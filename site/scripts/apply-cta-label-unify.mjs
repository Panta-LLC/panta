/**
 * One name for one offer — the Studio half.
 *
 *   node scripts/apply-cta-label-unify.mjs            # dry run
 *   node scripts/apply-cta-label-unify.mjs --apply    # writes
 *
 * The review note: the nav said "Book a free review", the hero said "Get a
 * free review", and deep pages said "Book a free 30-minute review" —
 * one action under three names, with the nav version following the visitor
 * onto every page where they had just read a different one.
 *
 * Standardised on the hero's, which names the deliverable rather than the
 * calendar slot. The buttons that live in code moved in the same change
 * (Base's header/footer/mega links, the homepage, the lead form, and the
 * services, packages and Pulse templates); these three are the ones an editor
 * owns.
 *
 * Left alone deliberately: the two body-copy sentences on the service and
 * package templates that begin "Book a free 30-minute review and we will tell
 * you honestly…". Those are sentences, not labels — the verb belongs to the
 * grammar of the sentence, and the canonical label is on the button directly
 * above each one.
 */
import { run } from './lib/apply-edits.mjs';

await run({
  name: 'CTA labels — one name for the review offer',

  sets: [
    ['contactPage', 'heroCtaLabel', 'Book a free review', 'Get a free review'],
    // Keeps its arrow: this one scrolls down the page it is already on rather
    // than navigating, and the glyph is what says so.
    [
      'consultationPage',
      'bookCtaLabel',
      'Book a free 30-minute review ↓',
      'Get a free review ↓',
    ],
    ['workPage', 'ctaPrimaryLabel', 'Book a free 30-minute review', 'Get a free review'],
  ],
});
