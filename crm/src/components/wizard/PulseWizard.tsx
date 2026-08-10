import { useCallback, useEffect, useMemo, useState } from 'react';

import type { InstrumentDefinition } from '../../lib/instrument/types.ts';
import { resolveInstrument, suggestedModules } from '../../lib/instrument/resolve.ts';
import { useAutosave } from './useAutosave.ts';
import { useElapsed } from './useElapsed.ts';
import { readDraft, draftIsNewer, type AnswerMap, type TrackTwoMap } from './localDraft.ts';
import { SegmentPane } from './SegmentPane.tsx';
import { TrackTwoRail } from './TrackTwoRail.tsx';
import { PacingBar } from './PacingBar.tsx';
import { SaveIndicator } from './SaveIndicator.tsx';

export type WizardProps = {
  pulseId: string;
  definition: InstrumentDefinition;
  initialAnswers: AnswerMap;
  initialTrackTwo: TrackTwoMap;
  initialModules: string[];
  startedAt: string | null;
  serverNow: string;
  serverUpdatedAt: string | null;
  fiveSecondRead: string | null;
  client: { name: string; websiteUrl: string | null; sector: string | null };
};

export default function PulseWizard(props: WizardProps) {
  const [modules, setModules] = useState<string[]>(props.initialModules);
  const [startedAt, setStartedAt] = useState<string | null>(props.startedAt);
  const [step, setStep] = useState(0);
  const [showSuppressed, setShowSuppressed] = useState(false);

  const {
    answers,
    trackTwo,
    status,
    savedAt,
    setAnswer,
    setTrackTwo,
    replaceAll,
    flushNow,
  } = useAutosave({
    pulseId: props.pulseId,
    initialAnswers: props.initialAnswers,
    initialTrackTwo: props.initialTrackTwo,
  });

  const resolved = useMemo(
    () => resolveInstrument(props.definition, modules),
    [props.definition, modules],
  );

  const suggestions = useMemo(
    () => suggestedModules(props.definition, props.client),
    [props.definition, props.client],
  );

  const elapsed = useElapsed(startedAt, props.serverNow);
  const segment = resolved.segments[step];

  // ── restore-from-local ──────────────────────────────────────────────────
  // Offered, never applied automatically: a silent merge you did not ask for
  // is worse than either version, because you cannot tell which you are
  // looking at.
  const [restorable, setRestorable] = useState<ReturnType<typeof readDraft>>(null);
  useEffect(() => {
    const draft = readDraft(props.pulseId);
    if (draftIsNewer(draft, props.serverUpdatedAt)) setRestorable(draft);
  }, [props.pulseId, props.serverUpdatedAt]);

  const toggleModule = useCallback(
    async (key: string) => {
      const next = modules.includes(key)
        ? modules.filter((m) => m !== key)
        : [...modules, key];
      setModules(next);
      try {
        await fetch(`/api/pulse/${props.pulseId}/modules`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ modules: next }),
        });
      } catch {
        // The toggle is local-first too; a failed sync corrects on next load.
      }
    },
    [modules, props.pulseId],
  );

  const startCall = useCallback(async () => {
    const res = await fetch(`/api/pulse/${props.pulseId}/start`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fiveSecondRead: props.fiveSecondRead }),
    });
    const data = (await res.json()) as { startedAt?: string };
    if (data.startedAt) setStartedAt(data.startedAt);
  }, [props.pulseId, props.fiveSecondRead]);

  const endCall = useCallback(async () => {
    await flushNow();
    // A real form post, not fetch: the endpoint redirects to the capture sheet
    // and the browser should follow it.
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `/api/pulse/${props.pulseId}/end`;
    document.body.appendChild(form);
    form.submit();
  }, [props.pulseId, flushNow]);

  if (!segment) return null;

  const isLast = step === resolved.segments.length - 1;

  return (
    <div className="wz">
      {/* ── sticky header ────────────────────────────────────────────── */}
      <header className="wz__bar">
        <div className="wz__barTop">
          <div className="wz__clock">
            {startedAt ? (
              <>
                <span className="wz__dot" aria-hidden="true" />
                <span className="wz__time">{fmt(elapsed)}</span>
              </>
            ) : (
              <button className="btn btn--primary btn--sm" onClick={() => void startCall()}>
                Start call
              </button>
            )}
          </div>

          <PacingBar
            segments={resolved.segments}
            current={step}
            elapsedSeconds={elapsed}
            onJump={setStep}
            running={Boolean(startedAt)}
          />

          <SaveIndicator status={status} savedAt={savedAt} />
        </div>

        <div className="wz__modules">
          <span className="kicker">Modules</span>
          {resolved.moduleToggles.map((m) => (
            <button
              key={m.key}
              type="button"
              className={`wz__chip${m.enabled ? ' is-on' : ''}`}
              onClick={() => void toggleModule(m.key)}
              title={m.recNote}>
              {m.label}
              {!m.enabled && suggestions.includes(m.key) && (
                <span className="wz__suggest" title="Suggested for this client" />
              )}
            </button>
          ))}
        </div>
      </header>

      {restorable && (
        <div className="wz__restore">
          <span>
            Unsaved answers from this device, newer than the server copy.
          </span>
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => {
              replaceAll(restorable.answers, restorable.trackTwo);
              setRestorable(null);
            }}>
            Restore
          </button>
          <button className="btn btn--ghost btn--sm" onClick={() => setRestorable(null)}>
            Discard
          </button>
        </div>
      )}

      {/* ── two tracks ───────────────────────────────────────────────── */}
      <div className="wz__body">
        <main className="wz__main">
          <SegmentPane
            segment={segment}
            answers={answers}
            onAnswer={setAnswer}
            fiveSecondRead={props.fiveSecondRead}
            showSuppressed={showSuppressed}
            onShowSuppressed={() => setShowSuppressed(true)}
          />

          <nav className="wz__nav">
            <button
              className="btn btn--ghost"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}>
              ← Back
            </button>

            {isLast ? (
              <button className="btn btn--primary" onClick={() => void endCall()}>
                End call &amp; capture
              </button>
            ) : (
              <button
                className="btn btn--primary"
                onClick={() => setStep((s) => s + 1)}>
                {resolved.segments[step + 1]?.label.split('—')[0]?.trim()} →
              </button>
            )}
          </nav>
        </main>

        <TrackTwoRail
          segment={segment}
          trackTwo={trackTwo}
          onChange={setTrackTwo}
          answers={answers}
          onAnswer={setAnswer}
          client={props.client}
        />
      </div>
    </div>
  );
}

function fmt(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
