/**
 * Second pass on the hero sub-headline.
 *
 *   node scripts/apply-hero-copy-2.mjs            # dry run
 *   node scripts/apply-hero-copy-2.mjs --apply    # writes
 *
 * The first pass led with a negation — "most organizations don't have a website
 * problem" — which is a clever reframe but an indirect one: it spends the
 * highest-value sentence on the page saying what the problem ISN'T.
 *
 * This pass splits the two jobs the hero has to do. The headline (hardcoded in
 * index.astro) now asserts why digital presence matters at all; this sub
 * defines what "presence" covers and states how the practice optimizes it —
 * assess, locate the failure, improve. That sequence is also the funnel:
 * Digital Presence Plan first, build services scoped from it.
 */
import { run } from './lib/apply-edits.mjs';

await run({
  name: 'missionPage — hero sub, second pass',

  sets: [
    [
      'missionPage',
      'summary',
      "Most organizations don't have a website problem — they have a being-found, trusted, and chosen problem, spread across a dozen places they don't control. We map all of it, tell you what to fix first, and then fix it.",
      "It's more than a website — it's search, social, directories, and reviews: every place someone checks before they reach out. We assess all of it, find where trust breaks down, and optimize it until it brings people to you.",
    ],
  ],
});
