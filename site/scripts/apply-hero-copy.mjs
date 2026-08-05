/**
 * Hero copy to match the rewritten homepage hero.
 *
 *   node scripts/apply-hero-copy.mjs            # dry run
 *   node scripts/apply-hero-copy.mjs --apply    # writes
 *
 * The hero went from a four-state slideshow to a single static offer, so two
 * fields change role:
 *
 *   heroDirect{Label,Href} was the "here for a website?" side door. It is now
 *   THE hero action, and the hero action should be a commitment rather than
 *   more reading — so it points at the free consultation. The websites link
 *   survives as a secondary text link in the template.
 *
 *   summary was a generic agency line sitting under a pull quote. It is now the
 *   sub-headline directly under the offer, which is a much more load-bearing
 *   position, so it states the problem the offer solves.
 *
 * Left alone deliberately: `practices[]`, `practicesLabel` and
 * `verbPanels[].num` are no longer rendered anywhere. The data stays put —
 * deleting fields risks Studio validation errors, and an unused field costs
 * nothing at build time.
 */
import { run } from './lib/apply-edits.mjs';

await run({
  name: 'missionPage — hero copy',

  sets: [
    [
      'missionPage',
      'heroDirectLabel',
      'See how we build websites',
      'Book a free 30-minute consultation',
    ],
    ['missionPage', 'heroDirectHref', '/web-strategy/websites/', '/consultation/'],
    [
      'missionPage',
      'summary',
      'Panta puts strategy, engineering, and creativity behind the small businesses, nonprofits, and independent practices that hold our communities together.',
      "Most organizations don't have a website problem — they have a being-found, trusted, and chosen problem, spread across a dozen places they don't control. We map all of it, tell you what to fix first, and then fix it.",
    ],
  ],
});
