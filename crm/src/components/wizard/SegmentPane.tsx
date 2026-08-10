import type { ResolvedSegment } from '../../lib/instrument/resolve.ts';
import type { AnswerMap } from './localDraft.ts';
import { QuestionField } from './QuestionField.tsx';

type Props = {
  segment: ResolvedSegment;
  answers: AnswerMap;
  onAnswer: (key: string, v: string | number | null) => void;
  fiveSecondRead: string | null;
  showSuppressed: boolean;
  onShowSuppressed: () => void;
};

/**
 * One segment per screen — not one question per screen.
 *
 * This is the load-bearing UX decision. On a real call the client answers Q10
 * while you are asking Q8, then circles back to Q4 during CHOOSE. A vertical
 * stack of all the segment's questions lets you type into whichever one just
 * got answered. Per-question navigation would force you to stop typing
 * mid-sentence to move, and "their words, not yours" is a readout rule that
 * only survives if you can capture the words as they are said.
 */
export function SegmentPane({
  segment,
  answers,
  onAnswer,
  fiveSecondRead,
  showSuppressed,
  onShowSuppressed,
}: Props) {
  const visible = segment.questions.filter((q) => !q.suppressed || showSuppressed);
  const hidden = segment.questions.filter((q) => q.suppressed && !showSuppressed);

  return (
    <section className="sp">
      <p className="kicker">
        {segment.minutes[0]}–{segment.minutes[1]} min
        {segment.modules.map((m) => (
          <span key={m.key} className="sp__moduleTag">
            module · {m.label}
          </span>
        ))}
      </p>
      <h1>{segment.label}</h1>

      {segment.note && <p className="sp__note">{segment.note}</p>}

      {segment.opener && (
        <blockquote className="sp__opener">
          <p className="kicker">Say this, roughly</p>
          {segment.opener}
        </blockquote>
      )}

      {segment.questions.map((q) => {
        const el = visible.includes(q) ? (
          <QuestionField
            key={q.key}
            question={q}
            value={answers[q.key]?.v ?? ''}
            onChange={(v) => onAnswer(q.key, v)}
          />
        ) : null;

        /**
         * The five-second read surfaces at Q8, where the questionnaire says to
         * tell them what you actually wrote down — "the single most useful
         * thing that happens on the call." Putting it anywhere else means it
         * gets written on prep and never used.
         */
        if (q.key === 'q08' && el) {
          return (
            <div key={q.key}>
              {el}
              <div className="sp__fiveSec">
                <p className="kicker">Your five-second read · locked</p>
                <p className="sp__fiveSecText">
                  {fiveSecondRead || <em>Not written during prep.</em>}
                </p>
                <label className="sp__toldThem">
                  <input
                    type="checkbox"
                    checked={answers['told_five_second']?.v === 'yes'}
                    onChange={(e) =>
                      onAnswer('told_five_second', e.target.checked ? 'yes' : null)
                    }
                  />
                  <span>Told them out loud</span>
                </label>
              </div>
            </div>
          );
        }

        return el ? <div key={q.key}>{el}</div> : null;
      })}

      {hidden.length > 0 && (
        <p className="sp__suppressed">
          {hidden.length} question{hidden.length === 1 ? '' : 's'} collapsed by an active
          module.{' '}
          <button type="button" className="linkish" onClick={onShowSuppressed}>
            Show anyway
          </button>
        </p>
      )}

      {segment.actions && (
        <div className="sp__actions">
          <p className="kicker">Before you hang up</p>
          {segment.actions.map((a) => (
            <label key={a.key} className="sp__action">
              <input
                type="checkbox"
                checked={answers[a.key]?.v === 'yes'}
                onChange={(e) => onAnswer(a.key, e.target.checked ? 'yes' : null)}
              />
              <span>
                {a.label}
                {a.optional && <span className="sp__optional">optional</span>}
              </span>
            </label>
          ))}
        </div>
      )}

      {segment.promoteNoticedTo && (
        <div className="sp__noticed">
          <label htmlFor={`noticed.${segment.key}`}>
            {segment.label.split('—')[0]?.trim()} — noticed
          </label>
          <p className="q__hint">
            Write it now, while it is live. Reconstructing this twenty minutes later
            is how observations get vague.
          </p>
          <textarea
            id={`noticed.${segment.key}`}
            rows={3}
            defaultValue={(answers[`noticed.${segment.key}`]?.v as string) ?? ''}
            onChange={(e) => onAnswer(`noticed.${segment.key}`, e.target.value)}
          />
        </div>
      )}

      {segment.listenFor && (
        <aside className="sp__listen">
          <p className="kicker">Listen for</p>
          <p>{segment.listenFor}</p>
        </aside>
      )}
    </section>
  );
}
