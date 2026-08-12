/**
 * Eighth pass on the hero — the risk-reversal line, shortened to a fragment.
 *
 *   node scripts/apply-hero-copy-8.mjs            # dry run
 *   node scripts/apply-hero-copy-8.mjs --apply    # writes
 *
 * The band between the CTA and the service cards read busy: 144px of small
 * print in two blocks capped within 16px of the same width, each wrapping to
 * two lines. Most of that was accidental — neither block had chosen its own
 * measure — and index.astro now sizes both to their content.
 *
 * This is the editorial half. "The action plan is yours to keep" repeated the
 * noun the spec line directly above had just introduced ("…a written action
 * plan in 48 hours"), which made the second line read as a restatement rather
 * than as a promise added to it. Dropping the subject makes the two lines one
 * thought: what you get, then what it costs you.
 *
 * The full sentence is not lost — PulseTerm's default tooltip still ends
 * "…yours to keep whether we work together or not" (PulseTerm.astro).
 */
import { run } from './lib/apply-edits.mjs';

await run({
  name: 'homeHero — risk reversal as a fragment',

  sets: [
    [
      'homeHero',
      'riskReversal',
      'The action plan is yours to keep, whether we work together or not.',
      'Yours to keep, whether we work together or not.',
    ],
  ],
});
