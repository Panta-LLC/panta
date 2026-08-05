/**
 * Moves Community Programs and Product Development out of the services
 * taxonomy and reframes them as things Panta makes and runs.
 *
 *   node scripts/apply-own-initiatives.mjs            # dry run
 *   node scripts/apply-own-initiatives.mjs --apply    # writes
 *
 * business-strategy.md already draws this line:
 *   §3 — client services : the six the homepage hero lists
 *   §4 — own initiatives : products released, content published, community
 *                          work pursued
 *
 * These two were on the wrong side of it. They were called "practices taking
 * root", which reads as a menu of things you will eventually be able to hire —
 * and that is what put four competing taxonomies on the site. Nothing is
 * deleted; the pages stop describing a purchase and start describing work.
 *
 * "See the practice that's live" also has to go: there is no practice to see
 * any more, and the link it labelled now 301s to the homepage.
 */
import { run } from './lib/apply-edits.mjs';

await run({
  name: 'Community Programs + Product Development → own initiatives',

  sets: [
    // ------------------------------------------------ community programs --
    [
      'communityProgramsPage',
      'heroLabel',
      'Connect · Community Programs & Content · Taking root',
      'What we’re building · Community programs',
    ],
    [
      'communityProgramsPage',
      'ctaLede',
      "We're developing this practice now — and the best programs are built with partners, not for them. If you run an organization that serves our community, or you want to hear when programs launch, we'd love to talk.",
      'The best programs are built with partners, not for them. If you run an organization that serves our community, or you want to hear when something launches, we’d love to talk.',
    ],
    [
      'communityProgramsPage',
      'ctaSecondaryLabel',
      "See the practice that's live",
      'See what we do for clients',
    ],

    // ----------------------------------------------- product development --
    [
      'productDevelopmentPage',
      'heroLabel',
      'Create · Product Development · Taking root',
      'What we’re building · Products',
    ],
    [
      'productDevelopmentPage',
      'ctaLede',
      "We're developing this practice now. If your organization keeps hitting a wall no existing tool solves — or you want to hear what we launch — tell us about it.",
      'If your organization keeps hitting a wall no existing tool solves — or you want to hear what we release — tell us about it.',
    ],
    [
      'productDevelopmentPage',
      'ctaSecondaryLabel',
      "See the practice that's live",
      'See what we do for clients',
    ],
  ],
});
