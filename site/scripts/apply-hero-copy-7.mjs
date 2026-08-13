/**
 * Seventh pass on the hero, plus the header button — the review-notes pass.
 *
 *   node scripts/apply-hero-copy-7.mjs            # dry run
 *   node scripts/apply-hero-copy-7.mjs --apply    # writes
 *
 * Two edits, both from a design review of the shipped hero:
 *
 * 1. subhead — the previous line promised "online presence, design, content,
 *    marketing, and custom software". Only four services exist in the Studio,
 *    so marketing and custom software were named and then had no door: the
 *    cards under the CTA are the full set of places to go. The line now names
 *    the four that exist. Restore the wider promise the day those two services
 *    are real documents, not before — the cards read the service list live and
 *    will pick them up on their own.
 *
 * 2. headerCtaLabel — the nav said "Book a free review" while the hero said
 *    "Get a free review": one offer, two names, and the nav button is
 *    the one a visitor sees on every other page. Standardised on the hero's,
 *    which names the deliverable. The in-page asks (homepage pillars, the lead
 *    form, the mega-menu and footer quick links, the compact mobile header
 *    button) are code and moved with it in the same change.
 */
import { run } from './lib/apply-edits.mjs';

await run({
  name: 'homeHero subhead + siteSettings header CTA — review notes',

  sets: [
    [
      'homeHero',
      'subhead',
      'A full-service partner for private practices, community organizations, and local businesses — online presence, design, content, marketing, and custom software, under one roof.',
      'A full-service partner for private practices, community organizations, and local businesses — websites, brand, content, and operations, under one roof.',
    ],
    [
      'siteSettings',
      'headerCtaLabel',
      'Book a free review',
      'Get a free review',
    ],
  ],
});
