import { describe, expect, it } from 'vitest';

import { parseQuarter, quarterLabel, quarterOf, quarterRange } from './format.ts';

/**
 * Quarter boundaries only. The rest of format.ts is Intl passthrough.
 *
 * These exist because the funnel dashboard buckets every booking by quarter,
 * and a boundary computed in UTC would put a call booked on New Year's Eve
 * Pacific into the following year — permanently, and silently, since nothing
 * downstream can tell a misfiled row from a slow quarter.
 */
describe('quarterRange', () => {
  it('starts Q1 at Pacific midnight, which is 08:00Z in standard time', () => {
    expect(quarterRange(2026, 1).from.toISOString()).toBe('2026-01-01T08:00:00.000Z');
  });

  it('starts Q2 at 07:00Z, because April is daylight time', () => {
    // The whole reason the offset cannot be a constant.
    expect(quarterRange(2026, 2).from.toISOString()).toBe('2026-04-01T07:00:00.000Z');
  });

  it('starts Q3 and Q4 in daylight time too', () => {
    expect(quarterRange(2026, 3).from.toISOString()).toBe('2026-07-01T07:00:00.000Z');
    expect(quarterRange(2026, 4).from.toISOString()).toBe('2026-10-01T07:00:00.000Z');
  });

  it('rolls Q4 over into the next year, back in standard time', () => {
    expect(quarterRange(2026, 4).to.toISOString()).toBe('2027-01-01T08:00:00.000Z');
  });

  it('is half-open — one quarter ends exactly where the next begins', () => {
    expect(quarterRange(2026, 2).to.getTime()).toBe(quarterRange(2026, 3).from.getTime());
  });
});

describe('quarterOf', () => {
  it('reads the quarter in Pacific, not UTC', () => {
    // 2026-01-01T05:00Z is still 9pm on December 31st in California.
    expect(quarterOf(new Date('2026-01-01T05:00:00Z'))).toEqual({ year: 2025, q: 4 });
    // Eight hours later it has finally turned over.
    expect(quarterOf(new Date('2026-01-01T08:00:00Z'))).toEqual({ year: 2026, q: 1 });
  });

  it('agrees with quarterRange at every boundary', () => {
    for (const q of [1, 2, 3, 4]) {
      const { from, to } = quarterRange(2026, q);
      expect(quarterOf(from)).toEqual({ year: 2026, q });
      // The last instant inside the range still belongs to it.
      expect(quarterOf(new Date(to.getTime() - 1))).toEqual({ year: 2026, q });
    }
  });
});

describe('parseQuarter', () => {
  it('round-trips a label', () => {
    expect(parseQuarter(quarterLabel(2026, 3))).toEqual({ year: 2026, q: 3 });
  });

  it('rejects anything that is not exactly the label form', () => {
    // Nulls rather than throws: this reads a query parameter, and a bad one
    // should fall back to the current quarter rather than 500 the page.
    for (const bad of ['2026-Q5', '2026-Q0', '26-Q1', '2026Q1', '2026-q1', '', null]) {
      expect(parseQuarter(bad)).toBeNull();
    }
  });
});
