/**
 * Third pass on the hero sub-headline — the brand-voice pass.
 *
 *   node scripts/apply-hero-copy-3.mjs            # dry run
 *   node scripts/apply-hero-copy-3.mjs --apply    # writes
 *
 * Pass two ("Your digital presence is deciding who contacts you") stated the
 * stakes but in conversion-copywriter voice, not Panta's: loss-framed, faintly
 * ominous, and it cast the reader as someone leaking business. Every other page
 * on this site treats that same reader as someone doing quiet, essential work.
 *
 * Panta's voice, as evidenced by the origin and converge copy: concrete nouns
 * over categories ("the shop on the corner that knows its clients by name"),
 * growth metaphors, dignity-forward, short declaratives with a turn.
 *
 * The angle this pass takes: for a small business or community organization,
 * the online version is almost always WORSE than the real thing — their
 * reputation in the room is years ahead of their reputation online. That is a
 * real stake without fear, it frames presence as representation rather than
 * leakage, and it is specifically true for this segment in a way it is not for
 * a funded startup. The headline (hardcoded in index.astro) carries the gap;
 * this sub names the channels and states how the practice closes it.
 */
import { run } from './lib/apply-edits.mjs';

await run({
  name: 'missionPage — hero sub, brand-voice pass',

  sets: [
    // Two steps in one pass. The first wording ran to five lines in the hero
    // and orphaned "are." on the last one; the second ends on "sounds like
    // you", which is both shorter and a stronger place to land.
    [
      'missionPage',
      'summary',
      "It's more than a website — it's search, social, directories, and reviews: every place someone checks before they reach out. We assess all of it, find where trust breaks down, and optimize it until it brings people to you.",
      'Your reputation in the room is years ahead of your reputation online. We look at every place people find you — website, search, social, reviews — and close the gap, until what they find sounds like the people you actually are.',
    ],
    [
      'missionPage',
      'summary',
      'Your reputation in the room is years ahead of your reputation online. We look at every place people find you — website, search, social, reviews — and close the gap, until what they find sounds like the people you actually are.',
      'Your reputation in the room is years ahead of your reputation online. We look at every place people find you — website, search, social, reviews — and close the gap, until what they find sounds like you.',
    ],
  ],
});
