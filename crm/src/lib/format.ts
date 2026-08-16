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

// ── quarters ───────────────────────────────────────────────────────────────
// The funnel dashboard is read a quarter at a time (docs/FUNNEL-MEASUREMENT.md
// §4: monthly volume is too low to be signal). Quarter boundaries are Pacific
// midnights, not UTC ones — otherwise Q1 starts at 4pm on December 31st, and a
// call booked on New Year's Eve lands in the wrong quarter forever.

/** What the wall clock in TZ reads at this instant, expressed as a UTC time. */
function wallClockAsUtc(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, p) => {
      acc[p.type] = p.value;
      return acc;
    }, {});

  return Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    // hour12:false still emits "24" for midnight in some engines.
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second),
  );
}

const offsetMs = (d: Date) => wallClockAsUtc(d) - d.getTime();

/** The instant that is 00:00 in TZ on the given calendar date. */
function zonedStartOfDay(year: number, month: number, day: number): Date {
  const guess = Date.UTC(year, month - 1, day);
  // Two passes: the offset is sampled at the guess, which can sit on the wrong
  // side of a DST change, and the corrected instant is then re-sampled. Quarter
  // boundaries are never within an hour of a transition, so this settles.
  const first = guess - offsetMs(new Date(guess));
  return new Date(guess - offsetMs(new Date(first)));
}

/** The quarter containing `at`, in TZ. `q` is 1-4. */
export function quarterOf(at: Date = new Date()): { year: number; q: number } {
  const utc = new Date(wallClockAsUtc(at));
  return { year: utc.getUTCFullYear(), q: Math.floor(utc.getUTCMonth() / 3) + 1 };
}

/** Half-open [from, to) — `to` is the next quarter's first instant. */
export function quarterRange(year: number, q: number): { from: Date; to: Date } {
  const startMonth = (q - 1) * 3 + 1;
  return {
    from: zonedStartOfDay(year, startMonth, 1),
    to: q === 4 ? zonedStartOfDay(year + 1, 1, 1) : zonedStartOfDay(year, startMonth + 3, 1),
  };
}

/** "2026-Q3" — the URL form and the label form are deliberately the same. */
export function quarterLabel(year: number, q: number): string {
  return `${year}-Q${q}`;
}

/** Parses "2026-Q3". Returns null on anything else, including a plausible typo. */
export function parseQuarter(s: string | null): { year: number; q: number } | null {
  const m = /^(\d{4})-Q([1-4])$/.exec((s ?? '').trim());
  return m ? { year: Number(m[1]), q: Number(m[2]) } : null;
}

/** mm:ss for the wizard's elapsed clock. */
export function fmtElapsed(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
