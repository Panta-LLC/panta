import type { ResolvedSegment } from '../../lib/instrument/resolve.ts';
import type { AnswerMap, TrackTwoMap } from './localDraft.ts';

type Props = {
  segment: ResolvedSegment;
  trackTwo: TrackTwoMap;
  onChange: (key: string, patch: { checked?: boolean; note?: string }) => void;
  answers: AnswerMap;
  onAnswer: (key: string, v: string | number | null) => void;
  client: { name: string; websiteUrl: string | null };
};

/**
 * Track two — the second thing happening during the call.
 *
 * The questionnaire's operating instruction is "run two tracks at once": one
 * is the conversation, the other is you quietly looking at their site while
 * they describe it, and "the gap between the two is where most of the
 * observations come from."
 *
 * So this rail never scrolls away. An observation noticed at minute four has
 * to be recordable without leaving the question that is currently being
 * answered — if capturing it costs a navigation, it does not get captured.
 */
export function TrackTwoRail({ segment, trackTwo, onChange, answers, onAnswer, client }: Props) {
  const prompts = segment.trackTwo ?? [];
  const site = client.websiteUrl
    ? client.websiteUrl.startsWith('http')
      ? client.websiteUrl
      : `https://${client.websiteUrl}`
    : null;

  return (
    <aside className="rail">
      <div className="rail__head">
        <p className="kicker">Track two</p>
        {site && (
          <a href={site} target="_blank" rel="noreferrer noopener" className="rail__site">
            open their site ↗
          </a>
        )}
      </div>

      {prompts.length === 0 ? (
        <p className="rail__empty">Nothing to look at in this segment — just listen.</p>
      ) : (
        prompts.map((p) => {
          const state = trackTwo[p.key] ?? {};
          return (
            <div key={p.key} className="rail__item">
              <label className="rail__check">
                <input
                  type="checkbox"
                  checked={Boolean(state.checked)}
                  onChange={(e) => onChange(p.key, { checked: e.target.checked })}
                />
                <span>{p.prompt}</span>
              </label>
              <textarea
                rows={2}
                placeholder="what you saw"
                defaultValue={state.note ?? ''}
                onChange={(e) => onChange(p.key, { note: e.target.value })}
              />
            </div>
          );
        })
      )}

      {/*
        Always present, in every segment. A locked asset — a domain or profile
        controlled by a vendor or ex-employee — usually IS the recommendation
        regardless of everything else, and it surfaces whenever it surfaces.
        Burying it in the constraints segment means missing it at minute 11.
      */}
      <div className="rail__locked">
        <label htmlFor="locked_assets">Locked assets?</label>
        <p className="rail__lockedHint">
          A domain, site login, or Google profile someone else controls. If you hear
          one, it very likely becomes the recommendation.
        </p>
        <textarea
          id="locked_assets"
          rows={2}
          placeholder="none"
          defaultValue={(answers['locked_assets']?.v as string) ?? ''}
          onChange={(e) => onAnswer('locked_assets', e.target.value)}
        />
      </div>

      <div className="rail__locked">
        <label htmlFor="plan_shaped">Plan-shaped — deliberately not answered here</label>
        <textarea
          id="plan_shaped"
          rows={2}
          placeholder="park it for the Plan"
          defaultValue={(answers['plan_shaped']?.v as string) ?? ''}
          onChange={(e) => onAnswer('plan_shaped', e.target.value)}
        />
      </div>
    </aside>
  );
}
