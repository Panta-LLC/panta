import type { ResolvedSegment } from '../../lib/instrument/resolve.ts';

type Props = {
  segments: ResolvedSegment[];
  current: number;
  elapsedSeconds: number;
  onJump: (index: number) => void;
  running: boolean;
};

/**
 * Pacing, not pressure.
 *
 * Segments are sized proportionally to their minute budgets (3/6/7/6/5/3 of
 * 30), with a marker at current elapsed. The point of the questionnaire's time
 * map is "talk less than half the time," not finishing early — so there is no
 * countdown, no sound, and above all no modal. A dialog appearing during a
 * client call is a catastrophe.
 *
 * Steps are freely navigable in both directions. Nothing about a live
 * conversation is linear.
 */
export function PacingBar({ segments, current, elapsedSeconds, onJump, running }: Props) {
  const total = segments.at(-1)?.minutes[1] ?? 30;
  const elapsedMin = elapsedSeconds / 60;

  const active = segments[current];
  const overBy = active && running ? elapsedMin - active.minutes[1] : 0;
  const over = overBy > 0;

  return (
    <div className="pace">
      <div className="pace__track">
        {segments.map((s, i) => {
          const width = ((s.minutes[1] - s.minutes[0]) / total) * 100;
          return (
            <button
              key={s.key}
              type="button"
              className={`pace__seg${i === current ? ' is-current' : ''}`}
              style={{ width: `${width}%` }}
              onClick={() => onJump(i)}
              title={`${s.label} · ${s.minutes[0]}–${s.minutes[1]} min`}>
              <span className="pace__segLabel">{s.label.split('—')[0]?.trim()}</span>
            </button>
          );
        })}

        {running && (
          <span
            className="pace__marker"
            style={{ left: `${Math.min(100, (elapsedMin / total) * 100)}%` }}
            aria-hidden="true"
          />
        )}
      </div>

      <p className={`pace__status${over ? ' is-over' : ''}`}>
        {!running
          ? 'Not started'
          : over
            ? `${active?.label.split('—')[0]?.trim()} · ${Math.round(overBy)} over`
            : `${active?.label.split('—')[0]?.trim()} · ${Math.max(0, Math.round((active?.minutes[1] ?? 0) - elapsedMin))} min left`}
        {/* The questionnaire's "talk less than half the time" rule has a
            deadline attached: past minute 22 you should be listening, not
            explaining. A static nudge costs nothing. */}
        {running && elapsedMin > 22 && <span className="pace__past22">past 22 · listen</span>}
      </p>
    </div>
  );
}
