/**
 * Lifts the messaging from UPDATED_VIDEO_SCRIPTS.md into the site copy.
 *
 *   node scripts/apply-script-messaging.mjs            # dry run
 *   node scripts/apply-script-messaging.mjs --apply    # writes
 *
 * The scripts are the sharpest statement of Panta's positioning in the repo —
 * written to be said out loud, which is why they are tighter than the page copy
 * they are replacing. See content-architecture.md for the full placement map.
 *
 * TWO TRANSLATIONS ARE APPLIED, deliberately, and neither is a copy error:
 *
 * 1. Dead offer names. Scripts 4 and 5 reference a "Growth Audit" and Script 5
 *    says "Web Presence Assessment". Both are pre-consolidation names that
 *    exist nowhere on the site. Every lift here uses the site's real names: the
 *    free 30-minute consultation, and the Digital Presence Plan.
 *
 * 2. The free-vs-paid line. Script 6 claims the free consultation is where "we
 *    find the leaks" — but leak-mapping is the paid Plan's deliverable. Copying
 *    that would re-break what SANITY-EDITS.md section 2 fixed on the contact
 *    page. The consultation copy below names the three questions (which IS the
 *    free call's job) and stops short of promising the leak map.
 */
import { run } from './lib/apply-edits.mjs';

await run({
  name: 'Script-derived messaging → site copy',

  sets: [
    // ---------------------------------------------------------------- home --
    // Pairs with the hardcoded H1 in index.astro ("You don't need a bigger
    // budget. You need to know what's possible."). Script 2 owns "we stay
    // ahead of the pace of change, so you don't have to" — the clearest answer
    // anywhere in the repo to "why Panta rather than a freelancer", and it
    // appeared nowhere on the site. Script 4 owns "within your means, not
    // somebody else's budget".
    [
      'missionPage',
      'summary',
      'Slow to load, hard to update, invisible in search — and earning you nothing. We design, build, and maintain sites that get found, earn trust, and turn visitors into calls, bookings, and donations.',
      "We stay ahead of the pace of change so you don't have to. It starts with an honest read of where you stand — then a plan built for your means, not somebody else's budget.",
    ],

    // --------------------------------------------------------------- about --
    // Script 1's whole argument, compressed: the problems are identical across
    // funded and unfunded organizations; only the resources differ. The old
    // title ("A friendly partner in the growth of your mission") stated a
    // posture; this states the insight the company was founded on.
    //
    // The lede also carries Script 3's identity line, which the source document
    // explicitly marks "use in site copy too" and which appeared nowhere.
    [
      'aboutPage',
      'heroTitle',
      'A friendly partner in the growth of your mission.',
      "The problems are the same. The resources aren't.",
    ],
    [
      'aboutPage',
      'heroLede',
      'Panta builds, connects, and creates for community growth and development — helping community-based businesses and organizations grow their reach and their mission.',
      'Researchers, engineers, designers, creative thinkers — with fifteen years split between venture-funded startups and organizations running on almost nothing. The problems were identical in both: reaching people, building trust, turning attention into action. Only the resources differed. Panta exists to close that gap.',
    ],

    // -------------------------------------------------- free consultation --
    // Script 6 owns Find / Trust / Choose and calls it "the whole game". The
    // framework already existed on the site as webStrategyPage.arcCards, one
    // level down from where it does the most work. Naming the three questions
    // in the consultation hero also pays off the section heading further down
    // the page, which already reads "Three answers, not a sales call."
    //
    // NOTE the deliberate stop: this promises where you stand and what to do
    // first. It does NOT promise the leak map — that is the paid Plan.
    // consultationPage.deliverIntro already draws this line correctly and is
    // left untouched.
    [
      'consultationPage',
      'heroTitle',
      "One conversation. An honest read, and a blueprint for what's next.",
      'Can they find you? Trust you? Choose you?',
    ],
    [
      'consultationPage',
      'heroLede',
      "Whether you have no website yet or one that isn't pulling its weight, we'll map where you stand against what your business needs — and name the one thing to do first.",
      'Three questions decide whether a digital presence works. In thirty minutes we walk through all three for your organization — and you leave knowing where you stand and what to do first.',
    ],
  ],
});
