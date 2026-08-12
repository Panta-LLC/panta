/**
 * Fifth pass on the homepage hero — the above-the-fold rework.
 *
 *   node scripts/apply-hero-copy-5.mjs            # dry run
 *   node scripts/apply-hero-copy-5.mjs --apply    # writes
 *
 * The hero's fallbacks in src/pages/index.astro were rewritten with this copy,
 * but `homeHero` is populated in the Studio, so the fallbacks never render on
 * the live site. This is the other half of that change: without it the section
 * ships new structure wrapped around the old words.
 *
 * What moves, and why:
 *   - eyebrow (new)      names who the page is for before the claim lands
 *   - headline           was a description of Panta ("Digital, strategic, and
 *                        creative support…"); now an outcome the reader wants.
 *                        *asterisks* mark the accented phrase — index.astro
 *                        splits on them, so they are copy syntax, not typos
 *   - subhead            the same promise as before, with the terms attached:
 *                        no runaround, no retainers, fixed scope, weeks
 *   - ctaLabel           names the deliverable ("website review") rather than
 *                        the calendar slot ("30-minute review")
 *   - ctaMicrocopy       keeps the Pulse Check name — PulseTerm hangs the
 *                        definition tooltip on that exact phrase — and adds
 *                        what arrives afterwards
 *   - riskReversal (new) the objection answered out loud, under the button
 *   - trustedBy (new)    the client line under the hairline
 *
 * Deliberately NOT set: proofQuote / proofAttribution. The strip has a slot for
 * a testimonial and it stays empty until a real client sentence exists with
 * permission to publish it. An invented quote attributed to a named clinician
 * is a misrepresentation, not placeholder copy.
 */
import { run } from './lib/apply-edits.mjs';

await run({
  name: 'homeHero — above-the-fold rework',

  sets: [
    [
      'homeHero',
      'eyebrow',
      undefined,
      'For private practices · nonprofits · local businesses',
    ],
    [
      'homeHero',
      'headline',
      'Digital, strategic, and creative support for organizations that serve people.',
      'Get found by the people you serve — and look as *credible online* as you are in person.',
    ],
    [
      'homeHero',
      'subhead',
      'We help small businesses and community organizations establish tools and processes for strengthening their online presence, improving operational workflows, and communicating effectively with their core audience. ',
      'Panta builds websites, brands, and simple systems for the practices and organizations that hold a community together. No agency runaround, no retainers — fixed scope, in writing, delivered in weeks.',
    ],
    [
      'homeHero',
      'ctaLabel',
      'Book a free 30-minute review',
      'Get a free website review',
    ],
    [
      'homeHero',
      'ctaMicrocopy',
      'A quick pulse check, and a written follow-up within 48 hours.',
      'We call it the Pulse Check · 30 minutes + a written action plan in 48 hours',
    ],
    [
      'homeHero',
      'riskReversal',
      undefined,
      'The action plan is yours to keep, whether we work together or not.',
    ],
    ['homeHero', 'secondaryLabel', 'See our work', 'See client work'],
    ['homeHero', 'trustedByLabel', undefined, 'Trusted by'],
    [
      'homeHero',
      'trustedBy',
      undefined,
      'Delta Bay Impact · Arielle Rae Hastings Therapy\n+ small businesses across Northern California',
    ],
  ],
});
