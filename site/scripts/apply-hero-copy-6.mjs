/**
 * Sixth pass on the homepage hero — the mission-headline layout.
 *
 *   node scripts/apply-hero-copy-6.mjs            # dry run
 *   node scripts/apply-hero-copy-6.mjs --apply    # writes
 *
 * Follows apply-hero-copy-5.mjs, which is one revision old: that pass led with
 * an outcome ("Get found by the people you serve…") behind an audience eyebrow.
 * This one leads with the mission and lets the subhead carry both the audience
 * and the range, which frees the space the service cards now occupy.
 *
 * What moves:
 *   - eyebrow      UNSET. The subhead names the three audiences, so the label
 *                  above the claim was the same qualification made twice
 *   - headline     the mission line. *asterisks* mark the accented phrase —
 *                  copy syntax that index.astro splits on, not a typo
 *   - subhead      audience + range: who it is for, then the span of the work
 *                  it covers, "under one roof"
 *   - trustedBy    one line rather than two. The hero lost its testimonial to
 *                  the fold budget when the cards arrived; the names stay
 *
 * Unchanged from pass 5, and deliberately: ctaLabel, ctaMicrocopy,
 * riskReversal, secondaryLabel, trustedByLabel.
 *
 * The service cards under the CTA are NOT content in this document — they are
 * the `service` documents, read live. Two of the six the subhead promises do
 * not exist yet (digital marketing, custom software); creating them is a
 * Studio job and the grid picks them up with no code change.
 */
import { run } from './lib/apply-edits.mjs';

await run({
  name: 'homeHero — mission headline + service cards layout',

  unsets: [
    ['homeHero', 'eyebrow', 'For private practices · nonprofits · local businesses'],
  ],

  sets: [
    [
      'homeHero',
      'headline',
      'Get found by the people you serve — and look as *credible online* as you are in person.',
      'Built to serve the people *who serve people.*',
    ],
    [
      'homeHero',
      'subhead',
      'Panta builds websites, brands, and simple systems for the practices and organizations that hold a community together. No agency runaround, no retainers — fixed scope, in writing, delivered in weeks.',
      'A full-service partner for private practices, community organizations, and local businesses — online presence, design, content, marketing, and custom software, under one roof.',
    ],
    [
      'homeHero',
      'trustedBy',
      'Delta Bay Impact · Arielle Rae Hastings Therapy\n+ small businesses across Northern California',
      'Delta Bay Impact · Arielle Rae Hastings Therapy · + small businesses across Northern California',
    ],
  ],
});
