/**
 * Brings the rest of the site onto the taxonomy the homepage hero establishes.
 *
 *   node scripts/apply-triad-alignment.mjs            # dry run
 *   node scripts/apply-triad-alignment.mjs --apply    # writes
 *
 * The hero is the source of truth: Digital / Strategic / Creative, six
 * services, for organizations that serve people. Four other taxonomies were
 * still live in Sanity copy — the Build/Connect/Create verbs as a service
 * frame, the three "practices" (Web & Systems, Community Programs & Content,
 * Product Development), the four Web & Systems service areas, and a footer
 * descriptor naming all of them.
 *
 * The split that resolves it is already written down in business-strategy.md:
 *   §3 — client services  = the six the hero lists
 *   §4 — own initiatives  = products, content, community work
 *
 * So Community Programs and Product Development are not retired, they simply
 * stop being things to hire. The verbs stay on /about/ as the mission they
 * always were.
 */
import { run } from './lib/apply-edits.mjs';

await run({
  name: 'Site-wide alignment to the hero taxonomy',

  sets: [
    // ------------------------------------------------------------- footer --
    // panta-homepage-copy.md's footer tagline is the hero sentence.
    [
      'siteSettings',
      'footerTagline',
      'One good move, felt everywhere.',
      'Digital, strategic, and creative support for organizations that serve people.',
    ],
    [
      'siteSettings',
      'footerDescriptor',
      'Web strategy, community programs, and product development — for the small businesses, nonprofits, and independent practices that hold our communities together.',
      'Web presence, media, process and tools, storytelling, and brand design — for the small businesses and community organizations that hold a place together.',
    ],

    // -------------------------------------------------------------- about --
    // "What we do" on About listed the old Web & Systems service areas. It now
    // names the triad, matching the hero and the services overview.
    [
      'aboutPage',
      'doItems[_key=="d1"].title',
      'Web Strategy & Planning.',
      'Digital — get found.',
    ],
    [
      'aboutPage',
      'doItems[_key=="d1"].body',
      'The Digital Presence Plan: a graded read on where you stand and a 90-day roadmap forward — the front door to Web & Systems.',
      'Web presence and development, and media production — so the people who need you can find you and see the work honestly.',
    ],
    [
      'aboutPage',
      'doItems[_key=="d2"].title',
      'Websites & Web Channels.',
      'Strategic — run smoother.',
    ],
    [
      'aboutPage',
      'doItems[_key=="d2"].body',
      'Your website plus social, Google Business Profile, and directory setup — cross-linked so no door dead-ends.',
      'Process and workflow optimization, and the tools and systems behind them — less duct tape, more breathing room.',
    ],
    [
      'aboutPage',
      'doItems[_key=="d3"].title',
      'Content, Brand & Ongoing Support.',
      'Creative — be remembered.',
    ],
    [
      'aboutPage',
      'doItems[_key=="d3"].body',
      'A rhythm you can sustain, one recognizable identity, and honest measurement that keeps the presence alive.',
      'Storytelling and content, and brand design — a mission that is felt, not just stated.',
    ],
    // The old note framed the other two as practices you could hire. Under the
    // §3/§4 split they are things Panta makes and runs, which is a different
    // sentence entirely.
    [
      'aboutPage',
      'doNote',
      "That's our client practice. Two more are taking root:",
      'That is what you can hire us for. We also build and run things of our own:',
    ],
  ],
});
