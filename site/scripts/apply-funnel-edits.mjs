/**
 * The remainder of SANITY-EDITS.md — the funnel / free-call-vs-paid-plan batch.
 *
 * Most of that document was already applied by hand before this ran: the
 * contact page, the consultation page, and missionPage.secondaryCtaLabel are
 * all done. What's left is the two practice CTA labels (which drifted to a
 * value naming the old practice) and two live copy bugs in the hero verb
 * panels.
 *
 *   node scripts/apply-funnel-edits.mjs            # dry run
 *   node scripts/apply-funnel-edits.mjs --apply    # writes
 *
 * Deliberately NOT included, because the hero rewrite decides them:
 *   - missionPage.practicesLabel  (the practices list is leaving the hero)
 *   - missionPage.verbPanels[].num shortening ("01 · The first verb")
 */
import { run } from './lib/apply-edits.mjs';

await run({
  name: 'SANITY-EDITS.md — funnel batch',

  sets: [
    // SANITY-EDITS.md §1. The doc expected "Read the mission behind it"; the
    // value has since drifted to a label naming the practice by its old name,
    // so it needs the change regardless.
    [
      'communityProgramsPage',
      'ctaSecondaryLabel',
      'Learn about our Web Strategy practice',
      "See the practice that's live",
    ],
    [
      'productDevelopmentPage',
      'ctaSecondaryLabel',
      'Learn about our Web Strategy practice',
      "See the practice that's live",
    ],

    // SANITY-EDITS.md §4. An ungrammatical fragment, live on the site and more
    // prominent now that the verb panels are hero slides.
    [
      'missionPage',
      'verbPanels[_key=="build"].chips[1]',
      'Services shaped to how your unique workflows',
      'Services shaped to how your workflows actually run',
    ],

    // Same section: trailing space, trimmed in the data rather than the template.
    [
      'missionPage',
      'verbPanels[_key=="build"].head',
      'Growth requires stable ground. ',
      'Growth requires stable ground.',
    ],
  ],
});
