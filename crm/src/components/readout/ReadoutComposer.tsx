import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { lintReadout, type Evidence, type ReadoutDoc } from '../../lib/readout/lint.ts';
import {
  deriveCandidates,
  RULES,
  CAPACITY_LABELS,
  type Candidate,
  type LadderInput,
} from '../../lib/readout/ladder.ts';

type EvidenceItem = { key: string; label: string; text: string };

export type ComposerProps = {
  pulseCheckId: string;
  initial: ReadoutDoc & { ladderRule?: number | null; ladderRationale?: string | null };
  evidenceItems: EvidenceItem[];
  ladderInput: LadderInput;
  capacity: string | null;
  goalInTheirWords: string | null;
  clientName: string;
  status: string;
};

/**
 * The readout composer.
 *
 * It scaffolds and constrains. It does not write.
 *
 * The three observations and the single recommendation are judgment calls
 * about the gap between what someone said and what you saw on their screen —
 * not derivable from the captured answers. Generating them would produce
 * exactly the artefact-free prose the instrument forbids ("Your homepage could
 * be clearer"), and would violate its "their words, not yours" rule in the
 * process. So every sentence here is typed by the person who was on the call;
 * the tool's job is to make the right shape easy and the forbidden thing
 * impossible.
 */
export default function ReadoutComposer(props: ComposerProps) {
  const [doc, setDoc] = useState<ReadoutDoc>({
    observations:
      props.initial.observations?.length === 3
        ? props.initial.observations
        : [
            { artifact: '', body: '', quoteRefs: [] },
            { artifact: '', body: '', quoteRefs: [] },
            { artifact: '', body: '', quoteRefs: [] },
          ],
    recWhat: props.initial.recWhat ?? '',
    recWhyFirst: props.initial.recWhyFirst ?? '',
    recEffort: props.initial.recEffort ?? '',
    recMode: props.initial.recMode ?? null,
    didntCover: props.initial.didntCover ?? '',
  });

  const [ladderRule, setLadderRule] = useState<number | null>(
    props.initial.ladderRule ?? null,
  );
  const [ladderRationale, setLadderRationale] = useState(
    props.initial.ladderRationale ?? '',
  );
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

  /** The field a quote click inserts into. */
  const focused = useRef<{ kind: 'observation'; index: number } | null>(null);

  const evidence: Evidence = useMemo(
    () => ({
      answerTexts: props.evidenceItems.map((e) => e.text),
      goalInTheirWords: props.goalInTheirWords,
      capacity: props.capacity,
    }),
    [props.evidenceItems, props.goalInTheirWords, props.capacity],
  );

  const lint = useMemo(() => lintReadout(doc, evidence), [doc, evidence]);
  const candidates = useMemo(() => deriveCandidates(props.ladderInput), [props.ladderInput]);

  // ── autosave ────────────────────────────────────────────────────────────
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setSaveState('saving');
      try {
        await fetch(`/api/readouts/${props.pulseCheckId}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ ...doc, ladderRule, ladderRationale }),
        });
        setSaveState('saved');
      } catch {
        setSaveState('idle');
      }
    }, 1200);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [doc, ladderRule, ladderRationale, props.pulseCheckId]);

  const setObservation = useCallback(
    (i: number, patch: Partial<{ artifact: string; body: string; quoteRefs: string[] }>) => {
      setDoc((prev) => {
        const observations = prev.observations.map((o, n) =>
          n === i ? { ...o, ...patch } : o,
        );
        return { ...prev, observations };
      });
    },
    [],
  );

  /**
   * Insert a quote into the focused observation.
   *
   * "Their words, not yours" is a rule you can follow only if their words are
   * at hand. Making the quote the path of least resistance beats remembering
   * the rule.
   */
  const insertQuote = useCallback(
    (item: EvidenceItem) => {
      const target = focused.current;
      if (!target) return;
      setDoc((prev) => {
        const observations = prev.observations.map((o, n) => {
          if (n !== target.index) return o;
          const body = `${o.body ?? ''}${o.body?.trim() ? ' ' : ''}“${item.text.trim()}”`;
          return {
            ...o,
            body,
            quoteRefs: [...new Set([...(o.quoteRefs ?? []), item.key])],
          };
        });
        return { ...prev, observations };
      });
    },
    [],
  );

  const ready = lint.blocking.length === 0;

  return (
    <div className="rc">
      {/* ── evidence ───────────────────────────────────────────────── */}
      <aside className="rc__evidence">
        <p className="kicker">What they told you</p>
        <p className="rc__evidenceHint">
          Click any answer to quote it into the observation you are writing.
        </p>
        {props.evidenceItems.map((item) => (
          <button
            key={item.key}
            type="button"
            className="rc__quote"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insertQuote(item)}>
            <span className="kicker">{item.label}</span>
            <span className="rc__quoteText">{item.text}</span>
          </button>
        ))}
      </aside>

      {/* ── compose ────────────────────────────────────────────────── */}
      <main className="rc__compose">
        <div className="rc__head">
          <div>
            <p className="kicker">Readout · {props.clientName}</p>
            <h1>One page, three observations, one recommendation</h1>
          </div>
          <span className="rc__save">{saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : ''}</span>
        </div>

        <section>
          <h2>What I noticed</h2>
          {doc.observations.map((o, i) => (
            <div className="rc__obs" key={i}>
              <label>
                <span className="kicker">Observation {i + 1} · the specific thing you looked at</span>
                <input
                  type="text"
                  value={o.artifact ?? ''}
                  placeholder="the headline above your booking button"
                  onChange={(e) => setObservation(i, { artifact: e.target.value })}
                />
              </label>
              <textarea
                rows={4}
                value={o.body ?? ''}
                placeholder="One short paragraph."
                onFocus={() => (focused.current = { kind: 'observation', index: i })}
                onChange={(e) => setObservation(i, { body: e.target.value })}
              />
              {(o.quoteRefs?.length ?? 0) > 0 && (
                <p className="rc__quoted">quotes {o.quoteRefs!.join(', ')}</p>
              )}
            </div>
          ))}
        </section>

        <section>
          <h2>What I'd do first</h2>

          <div className="rc__ladder">
            <p className="kicker">Pick it by rule, not by feel</p>
            {candidates.length === 0 ? (
              <p className="rc__empty">
                No candidates derived — the capture sheet is thin. Fill it in first.
              </p>
            ) : (
              <ol className="rc__candidates">
                {candidates.map((c: Candidate, i) => (
                  <li key={i}>
                    <span className={`rc__rule rc__rule--${c.rule}`}>rule {c.rule}</span>
                    <span className="rc__candidateLabel">{c.label}</span>
                    <span className="rc__candidateEvidence">{c.evidence}</span>
                  </li>
                ))}
              </ol>
            )}

            <div className="rc__rulePick">
              {([1, 2, 3, 4] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`rc__ruleBtn${ladderRule === r ? ' is-on' : ''}`}
                  title={RULES[r].note}
                  onClick={() => setLadderRule(ladderRule === r ? null : r)}>
                  {r}. {RULES[r].title}
                </button>
              ))}
            </div>
            {ladderRule && <p className="rc__ruleNote">{RULES[ladderRule as 1].note}</p>}
            <textarea
              rows={2}
              placeholder="Why this one — one line, for your own record."
              value={ladderRationale}
              onChange={(e) => setLadderRationale(e.target.value)}
            />
          </div>

          <label>
            <span className="kicker">What it is</span>
            <textarea
              rows={2}
              value={doc.recWhat ?? ''}
              onChange={(e) => setDoc((p) => ({ ...p, recWhat: e.target.value }))}
            />
          </label>
          <label>
            <span className="kicker">Why this one before the others</span>
            <textarea
              rows={3}
              value={doc.recWhyFirst ?? ''}
              onChange={(e) => setDoc((p) => ({ ...p, recWhyFirst: e.target.value }))}
            />
          </label>
          <label>
            <span className="kicker">Roughly what it takes</span>
            <textarea
              rows={2}
              value={doc.recEffort ?? ''}
              onChange={(e) => setDoc((p) => ({ ...p, recEffort: e.target.value }))}
            />
          </label>

          <div className="rc__mode">
            <span className="kicker">Say plainly which</span>
            {[
              ['diy', 'They can do it themselves'],
              ['bring_someone_in', 'Worth bringing someone in'],
            ].map(([v, label]) => (
              <button
                key={v}
                type="button"
                className={`q__choice${doc.recMode === v ? ' is-on' : ''}`}
                onClick={() => setDoc((p) => ({ ...p, recMode: p.recMode === v ? null : v }))}>
                {label}
              </button>
            ))}
            {props.capacity && (
              <span className="rc__capacity">
                they have {CAPACITY_LABELS[props.capacity] ?? props.capacity}
              </span>
            )}
          </div>
        </section>

        <section>
          <h2>What I didn't cover</h2>
          <p className="rc__hint">
            One or two lines of honest scope. The only place the Plan is mentioned, and
            as an option rather than a close.
          </p>
          <textarea
            rows={3}
            value={doc.didntCover ?? ''}
            onChange={(e) => setDoc((p) => ({ ...p, didntCover: e.target.value }))}
          />
        </section>

        <div className="rc__actions">
          <a
            className={`btn ${ready ? 'btn--primary' : 'btn--ghost'}`}
            href={ready ? `/readouts/${props.pulseCheckId}/print` : undefined}
            aria-disabled={!ready}
            onClick={(e) => {
              if (!ready) e.preventDefault();
            }}>
            Open print view
          </a>
          <span className="rc__count">{lint.charCount} characters</span>
        </div>
      </main>

      {/* ── lint ───────────────────────────────────────────────────── */}
      <aside className="rc__lint">
        <p className="kicker">Rules</p>

        {lint.blocking.length === 0 && lint.warnings.length === 0 && (
          <p className="rc__clean">Clean. Read it once more, then print it.</p>
        )}

        {lint.blocking.map((issue, i) => (
          <div className="rc__issue rc__issue--block" key={`b${i}`}>
            <p className="kicker">{issue.field}</p>
            <p>{issue.message}</p>
            {issue.match && <code>{issue.match}</code>}
          </div>
        ))}

        {lint.warnings.map((issue, i) => (
          <div className="rc__issue rc__issue--warn" key={`w${i}`}>
            <p className="kicker">{issue.field}</p>
            <p>{issue.message}</p>
            {issue.match && <code>{issue.match}</code>}
          </div>
        ))}

        {/* A character budget guides while typing; the print preview is what
            is actually true about one page. Both are shown. */}
        <div className="rc__budget">
          <div
            className="rc__budgetFill"
            style={{ width: `${Math.min(100, (lint.charCount / 2700) * 100)}%` }}
          />
        </div>
        <p className="rc__budgetNote">{lint.charCount} / ~2,700 before a second page</p>
      </aside>
    </div>
  );
}
