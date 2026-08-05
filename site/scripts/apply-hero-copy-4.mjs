/**
 * Fourth pass on the hero sub — the outcome-led pass.
 *
 *   node scripts/apply-hero-copy-4.mjs            # dry run
 *   node scripts/apply-hero-copy-4.mjs --apply    # writes
 *
 * Reference: fiftyandfifty.org/services/websites. Their structure is a category
 * reframe (a website is a fundraiser, not a brochure), an outcome headline, the
 * failure modes named bluntly, then hard numbers under every claim.
 *
 * What is borrowed: outcome-led headline, concrete failure modes, service verbs
 * (design / build / maintain), and an outcome noun set that spans all three
 * Panta segments — calls, bookings, donations. F&F can say "fundraiser" because
 * they serve nonprofits only; Panta cannot, so the plural does that work.
 *
 * What is NOT borrowed: the numbers. F&F put a 41% conversion lift and twenty
 * client logos directly under their promise. Panta has one testimonial and two
 * case studies carrying no metrics. Claims are therefore kept to what the work
 * actually is ("get found, earn trust, make the next step easy") rather than
 * quantified outcomes we cannot yet evidence.
 *
 * This replaces the brand-voice pass (see apply-hero-copy-3.mjs). That one was
 * identity-led and warm; this is outcome-led. They are different strategies and
 * the previous copy is preserved here as the `from` value if it needs reverting.
 */
import { run } from './lib/apply-edits.mjs';

await run({
  name: 'missionPage — hero sub, outcome-led pass',

  sets: [
    [
      'missionPage',
      'summary',
      'Your reputation in the room is years ahead of your reputation online. We look at every place people find you — website, search, social, reviews — and close the gap, until what they find sounds like you.',
      'Slow to load, hard to update, invisible in search — and earning you nothing. We design, build, and maintain sites that get found, earn trust, and turn visitors into calls, bookings, and donations.',
    ],
  ],
});
