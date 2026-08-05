/**
 * Renames the entry offer to the Pulse Check across existing site copy.
 *
 *   node scripts/apply-pulse-check.mjs            # dry run
 *   node scripts/apply-pulse-check.mjs --apply    # writes
 *
 * PULSE-HOME-BUILD.md §1 defines the entry offer as the Pulse Check: a free
 * 30-minute review plus a one-page written readout within 48 hours. The site
 * has been calling the same thing a "free 30-minute consultation".
 *
 * THE NAMING RULE (§7.1, copy deck §3): buttons describe, copy brands. Button
 * text must pass the no-context test — "Book a free 30-minute review" — and the
 * Pulse Check name lives in headlines and microcopy AROUND buttons, never on
 * them. Every edit below respects that split, which is why button labels here
 * say "review" and only headings say "Pulse Check".
 *
 * The Digital Presence Plan is unchanged: it remains the paid engagement the
 * free review leads to.
 */
import { run } from './lib/apply-edits.mjs';

await run({
  name: 'Entry offer → the Pulse Check',

  sets: [
    // --- header button (appears on every page) ---
    ['siteSettings', 'headerCtaLabel', 'Get started', 'Book a free review'],

    // --- the booking page itself ---
    [
      'consultationPage',
      'heroLabel',
      'Free 30-minute consultation',
      'The Pulse Check · free 30-minute review',
    ],
    [
      'consultationPage',
      'bookCtaLabel',
      'Book my free consultation ↓',
      'Book a free 30-minute review ↓',
    ],
    [
      'consultationPage',
      'bookingTitle',
      'Book your free 30-minute consultation.',
      'Book your free 30-minute review.',
    ],
    // The readout is the deliverable that makes the offer concrete; the old
    // copy promised a summary without naming the 48-hour turnaround.
    [
      'consultationPage',
      'deliverIntro',
      'You leave with a short written summary — the honest read and what your plan needs to cover — whether or not we ever work together. And if you want the full picture, this conversation is exactly where the Digital Presence Plan starts.',
      'You leave with a one-page written readout within 48 hours — three observations and one recommendation, yours to keep whether or not we ever work together. If you want the full picture, this conversation is exactly where the Digital Presence Plan starts.',
    ],

    // --- contact page ---
    ['contactPage', 'heroCtaLabel', 'Book the free consultation', 'Book a free review'],
    [
      'contactPage',
      'heroLede',
      'The fastest path is the free 30-minute consultation — book a time directly, no back-and-forth.',
      'The fastest path is a Pulse Check — a free 30-minute review. Book a time directly, no back-and-forth.',
    ],
    [
      'contactPage',
      'nextItems[1]',
      "We'll schedule your free 30-minute consultation to hear what's going on.",
      "We'll schedule your free 30-minute review to hear what's going on.",
    ],

    // --- homepage hero CTA (still used by /what-we-do/ and other surfaces) ---
    [
      'missionPage',
      'heroDirectLabel',
      'Book a free 30-minute consultation',
      'Book a free 30-minute review',
    ],
    [
      'missionPage',
      'secondaryCtaLabel',
      'Book a free 30-minute consultation',
      'Book a free 30-minute review',
    ],

    // --- work page ---
    ['workPage', 'ctaPrimaryLabel', 'Start with the free consultation', 'Book a free 30-minute review'],
  ],
});
