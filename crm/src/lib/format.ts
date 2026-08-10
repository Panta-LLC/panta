/**
 * Date and duration formatting.
 *
 * Fixed to America/Los_Angeles rather than the viewer's locale: this is a
 * single-user tool and the only user is in Pacific time, so a readout deadline
 * must never render differently because the phone was on a different clock
 * when it was opened.
 */
const TZ = 'America/Los_Angeles';

export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: TZ,
  }).format(new Date(d));
}

export function fmtDateTime(d: Date | string | null | undefined): string {
  if (!d) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: TZ,
  }).format(new Date(d));
}

/** "in 11 hours" / "3 hours overdue". Used by the readout countdown. */
export function fmtCountdown(due: Date | string | null | undefined): {
  text: string;
  overdue: boolean;
  urgent: boolean;
} {
  if (!due) return { text: '—', overdue: false, urgent: false };

  const ms = new Date(due).getTime() - Date.now();
  const overdue = ms < 0;
  const abs = Math.abs(ms);

  const hours = Math.floor(abs / 3_600_000);
  const minutes = Math.floor((abs % 3_600_000) / 60_000);

  const unit =
    hours >= 24
      ? `${Math.floor(hours / 24)} day${Math.floor(hours / 24) === 1 ? '' : 's'}`
      : hours >= 1
        ? `${hours} hour${hours === 1 ? '' : 's'}`
        : `${minutes} minute${minutes === 1 ? '' : 's'}`;

  return {
    text: overdue ? `${unit} overdue` : `in ${unit}`,
    overdue,
    // Twelve hours is the point where "tomorrow morning" stops being a plan.
    urgent: !overdue && ms < 12 * 3_600_000,
  };
}

/** mm:ss for the wizard's elapsed clock. */
export function fmtElapsed(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
