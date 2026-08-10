import { useCallback, useEffect, useRef, useState } from 'react';

import { writeDraft, type AnswerMap, type TrackTwoMap } from './localDraft.ts';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'offline';

type Options = {
  pulseId: string;
  initialAnswers: AnswerMap;
  initialTrackTwo: TrackTwoMap;
};

/** Idle time before a network flush. Long enough to batch a sentence. */
const DEBOUNCE_MS = 1500;
const MAX_BACKOFF_MS = 15_000;

/**
 * Three-layer save: memory → localStorage → network.
 *
 * Typing is never blocked on any of them. The network layer sends only the
 * keys that changed since the last acknowledged flush, so the server's JSONB
 * shallow merge can accept two in-flight requests touching different questions
 * without either clobbering the other.
 */
export function useAutosave({ pulseId, initialAnswers, initialTrackTwo }: Options) {
  const [answers, setAnswers] = useState<AnswerMap>(initialAnswers);
  const [trackTwo, setTrackTwo] = useState<TrackTwoMap>(initialTrackTwo);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  // Refs, not state: the flush closure must see the latest values without
  // being recreated (and without restarting the debounce) on every keystroke.
  const answersRef = useRef(answers);
  const trackTwoRef = useRef(trackTwo);
  const pendingAnswers = useRef<Set<string>>(new Set());
  const pendingTrackTwo = useRef<Set<string>>(new Set());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoff = useRef(1000);
  const inFlight = useRef(false);

  answersRef.current = answers;
  trackTwoRef.current = trackTwo;

  const hasPending = () => pendingAnswers.current.size > 0 || pendingTrackTwo.current.size > 0;

  const flush = useCallback(async () => {
    if (inFlight.current || !hasPending()) return;

    // Snapshot and clear before sending. Anything typed during the request
    // re-enters the pending set and goes out on the next flush rather than
    // being dropped by this one's success.
    const aKeys = [...pendingAnswers.current];
    const tKeys = [...pendingTrackTwo.current];
    pendingAnswers.current.clear();
    pendingTrackTwo.current.clear();

    const payload: { answers?: AnswerMap; trackTwo?: TrackTwoMap } = {};
    if (aKeys.length) {
      payload.answers = Object.fromEntries(
        aKeys.map((k) => [k, answersRef.current[k] ?? { v: null }]),
      );
    }
    if (tKeys.length) {
      payload.trackTwo = Object.fromEntries(
        tKeys.map((k) => [k, trackTwoRef.current[k] ?? {}]),
      );
    }

    inFlight.current = true;
    setStatus('saving');

    try {
      const res = await fetch(`/api/pulse/${pulseId}/answers`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(String(res.status));

      backoff.current = 1000;
      setStatus('saved');
      setSavedAt(new Date());
    } catch {
      // Put the keys back so nothing is lost, and let the retry pick them up.
      aKeys.forEach((k) => pendingAnswers.current.add(k));
      tKeys.forEach((k) => pendingTrackTwo.current.add(k));
      setStatus('offline');

      const delay = backoff.current;
      backoff.current = Math.min(delay * 2, MAX_BACKOFF_MS);
      timer.current = setTimeout(() => void flush(), delay);
    } finally {
      inFlight.current = false;
    }
  }, [pulseId]);

  const schedule = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), DEBOUNCE_MS);
  }, [flush]);

  const setAnswer = useCallback(
    (key: string, value: string | number | null) => {
      setAnswers((prev) => {
        const next = { ...prev, [key]: { v: value, at: new Date().toISOString() } };
        answersRef.current = next;
        writeDraft(pulseId, { answers: next, trackTwo: trackTwoRef.current });
        return next;
      });
      pendingAnswers.current.add(key);
      schedule();
    },
    [pulseId, schedule],
  );

  const setTrackTwoValue = useCallback(
    (key: string, patch: { checked?: boolean; note?: string }) => {
      setTrackTwo((prev) => {
        const next = { ...prev, [key]: { ...prev[key], ...patch } };
        trackTwoRef.current = next;
        writeDraft(pulseId, { answers: answersRef.current, trackTwo: next });
        return next;
      });
      pendingTrackTwo.current.add(key);
      schedule();
    },
    [pulseId, schedule],
  );

  /** Replace everything at once — used by the restore-from-local bar. */
  const replaceAll = useCallback(
    (a: AnswerMap, t: TrackTwoMap) => {
      setAnswers(a);
      setTrackTwo(t);
      answersRef.current = a;
      trackTwoRef.current = t;
      Object.keys(a).forEach((k) => pendingAnswers.current.add(k));
      Object.keys(t).forEach((k) => pendingTrackTwo.current.add(k));
      schedule();
    },
    [schedule],
  );

  useEffect(() => {
    /**
     * Flush when the tab is hidden. This fires when you switch to the video
     * call window, which during a Pulse Check is constantly — so it is the
     * single most effective save trigger in the set.
     */
    const onHide = () => {
      if (document.visibilityState !== 'hidden' || !hasPending()) return;

      const payload = {
        answers: Object.fromEntries(
          [...pendingAnswers.current].map((k) => [k, answersRef.current[k] ?? { v: null }]),
        ),
        trackTwo: Object.fromEntries(
          [...pendingTrackTwo.current].map((k) => [k, trackTwoRef.current[k] ?? {}]),
        ),
      };

      // sendBeacon survives the page going away, where fetch may not. It can
      // only POST, which is why the endpoint accepts POST as well as PATCH.
      const ok = navigator.sendBeacon?.(
        `/api/pulse/${pulseId}/answers`,
        new Blob([JSON.stringify(payload)], { type: 'application/json' }),
      );
      if (ok) {
        pendingAnswers.current.clear();
        pendingTrackTwo.current.clear();
      }
    };

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasPending()) e.preventDefault();
    };

    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onHide);
    window.addEventListener('beforeunload', onBeforeUnload);
    // Coming back online is the moment a stalled flush should retry.
    window.addEventListener('online', () => void flush());

    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onHide);
      window.removeEventListener('beforeunload', onBeforeUnload);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [pulseId, flush]);

  return {
    answers,
    trackTwo,
    status,
    savedAt,
    setAnswer,
    setTrackTwo: setTrackTwoValue,
    replaceAll,
    flushNow: flush,
  };
}
