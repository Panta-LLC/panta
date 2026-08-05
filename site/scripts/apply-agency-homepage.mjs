/**
 * Copy edits for the agency homepage merge (business-strategy.md §7).
 *
 *   node scripts/apply-agency-homepage.mjs            # dry run
 *   node scripts/apply-agency-homepage.mjs --apply    # writes
 *
 * The former /web-strategy/ hub's sections now render on the homepage, so the
 * copy that framed them as "the practice" reframes as the agency's storefront,
 * and the hero widens one notch past web-only. The canonical triad — Digital,
 * Strategic, Creative — anchors both (business-strategy.md §2).
 */
import { run } from './lib/apply-edits.mjs';

await run({
  name: 'Agency homepage merge — copy',

  sets: [
    // The services intro column no longer introduces a practice page; it
    // introduces what the agency does, on the homepage.
    [
      'webStrategyPage',
      'servicesLabel',
      'The practice',
      'What we do',
    ],
    [
      'webStrategyPage',
      'servicesIntro',
      'From the first honest read to the build — and the momentum after launch. Everything starts with the plan; everything after it is scoped from the plan, built by us or by anyone you choose.',
      'Digital, strategic, and creative support — from the first honest read to the build, and the momentum after launch. Everything starts with the plan; everything after it is scoped from the plan, built by us or by anyone you choose.',
    ],

    // Hero sub: one notch wider than web-only, matching the agency scope. The
    // shoulder-to-shoulder close stays — it is the best line in the hero.
    [
      'missionPage',
      'summary',
      'Websites, web presence, and the systems behind them — built shoulder-to-shoulder with the people moving their communities forward.',
      'Websites, media, products, and the systems behind them — built shoulder-to-shoulder with the people moving their communities forward.',
    ],
  ],
});
