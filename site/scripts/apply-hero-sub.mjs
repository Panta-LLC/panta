/**
 * Hero sub, to sit under "Strategy, Design & Technology for Building Community".
 *
 *   node scripts/apply-hero-sub.mjs            # dry run
 *   node scripts/apply-hero-sub.mjs --apply    # writes
 *
 * Fixes a live typo — the previous value read "for the who help people" with a
 * word missing and a trailing space — and replaces the line.
 *
 * The headline names capability categories (strategy / design / technology) and
 * a purpose (building community), but never says what Panta actually makes.
 * That is the gap this fills: concrete deliverables first, then the relationship.
 *
 * Deliberately NOT the comparison framing ("the same caliber of thinking
 * big-budget teams get"). It defines Panta relative to someone else and casts
 * the reader as the lesser party, which cuts against the dignity-forward voice
 * the rest of the site holds.
 */
import { run } from './lib/apply-edits.mjs';

await run({
  name: 'missionPage — hero sub under the Strategy/Design/Technology headline',

  sets: [
    [
      'missionPage',
      'summary',
      'We provide tools and support for the who help people. ',
      'Websites, web presence, and the systems behind them — built shoulder-to-shoulder with the people moving their communities forward.',
    ],
  ],
});
