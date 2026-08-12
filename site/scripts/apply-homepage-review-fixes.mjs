/**
 * Homepage review fixes — the Studio half.
 *
 *   node scripts/apply-homepage-review-fixes.mjs            # dry run
 *   node scripts/apply-homepage-review-fixes.mjs --apply    # writes
 *
 * From a full marketing / UX / content review of the live homepage. The two
 * code-side fixes (the founder paragraph, the mid-ask heading) are in
 * index.astro; these are the ones an editor owns.
 *
 * 1. TAXONOMY. The page named the same four things twice: the hero's service
 *    cards and the packages grid, under different names, pointing at the same
 *    four URLs. "Digital Presence" and "Web Design & Development" were one
 *    page. Every package is `pageReady: false`, so packageHref() falls through
 *    to the linked service — which means the card names could not be made true
 *    by fixing the links, only by fixing the names. The package titles now
 *    match the page each one opens.
 *
 *    Custom Software is deliberately untouched: its page has no body copy yet
 *    (no heroLede, no goodFit, no ctaBody), packageHref() correctly returns
 *    null, and Damon is writing it. It starts linking on its own when
 *    `pageReady` flips.
 *
 * 2. TYPOS, both live on the homepage:
 *    - pillar-digital.lede — "as impactful as it's physical presence" → "its".
 *      Also drops the comparison to a "physical presence", which a private
 *      practice or a two-person nonprofit does not think in terms of.
 *    - the Delta Bay Impact summary — "A youth mentorship who needed…" was
 *      missing its noun and referred to an organization as "who".
 *
 * Not here, and on purpose: the packages price band. `homePackages` does not
 * exist as a document, so index.astro's fallback IS the live copy — the band
 * ships with the deploy and the Studio field is there for when it needs to
 * change.
 */
import { run } from './lib/apply-edits.mjs';

await run({
  name: 'homepage review — taxonomy alignment + live typos',

  sets: [
    // --- 1. package titles match their destinations ------------------------
    ['package-digital-presence', 'title', 'Digital Presence', 'Web Design & Development'],
    ['package-brand-development', 'title', 'Brand Development', 'Brand design'],
    ['package-content-strategy', 'title', 'Content Strategy', 'Storytelling and content'],
    ['package-operations-assessment', 'title', 'Operations Assessment', 'Operations and systems'],

    // --- 2. typos ----------------------------------------------------------
    [
      'pillar-digital',
      'lede',
      "Your organization's online presence should be as impactful as it's physical presence. ",
      'Your organization’s online presence should be as strong as the work it represents.',
    ],
    [
      'ec0c47ee-a984-4990-b2bc-a619c4203407',
      'summary',
      'A youth mentorship who needed their web presence to better reflect their work.  We built a site that showcased the youth at their best, thriving in a program that represented their own identity. ',
      'A youth mentorship program that needed its web presence to reflect the work. We built a site that shows the youth at their best, thriving in a program built around their own identity.',
    ],
  ],
});
