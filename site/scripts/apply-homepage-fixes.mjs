/**
 * Fixes to the `homePage` document, which renders at /what-we-do/ and is now
 * the site's breadth page — the one place the full three-practice story lives.
 *
 *   node scripts/apply-homepage-fixes.mjs            # dry run
 *   node scripts/apply-homepage-fixes.mjs --apply    # writes
 *
 * Two problems, one of them substantive:
 *
 * 1. `practiceChecklist` still lists three service areas. Systems & Custom
 *    Software joined the live practice and was missing here.
 *
 * 2. `verbCards` were miscategorised. Their kickers and links were updated to
 *    the new taxonomy, but their BODIES were never rewritten — so the Connect
 *    card described web channels and the Create card described brand and
 *    content. Both are BUILD services. The page was linking to the community
 *    and product practices while describing client web work, which is exactly
 *    the incoherence the taxonomy reconciliation set out to remove.
 */
import { run } from './lib/apply-edits.mjs';

await run({
  name: 'homePage (/what-we-do/) — taxonomy alignment',

  sets: [
    // --- 2. verbCards: Connect described web channels, not community work ---
    [
      'homePage',
      'verbCards[_key=="connect"].title',
      'The places that matter',
      'The people it reaches',
    ],
    [
      'homePage',
      'verbCards[_key=="connect"].body',
      'The channels, networks, and directories where your community already looks — connected to each other so every door leads somewhere.',
      'Programs and content that put opportunity, learning, and connection within reach — built with the organizations already doing the work, not sold to them.',
    ],

    // --- verbCards: Create described brand and content, not products ---
    [
      'homePage',
      'verbCards[_key=="create"].title',
      'The story that carries',
      'The things we make',
    ],
    [
      'homePage',
      'verbCards[_key=="create"].body',
      'Brand, content, and design that make you recognizable everywhere you show up — and give people a reason to come back.',
      'Digital and physical products aimed at problems the market treats as too small to bother with — built once, useful to everyone who has them.',
    ],

    // --- the live practice now includes systems ---
    [
      'homePage',
      'practiceLede',
      'Our first practice: helping small businesses, nonprofits, and independent practices build a digital presence that actually works — strategy and engineering from the same hands.',
      'Our first practice: helping small businesses, nonprofits, and independent practices build a digital presence that actually works — and the systems running behind it. Strategy and engineering from the same hands.',
    ],
  ],

  inserts: [
    // --- 1. the fourth service area ---
    [
      'homePage',
      'practiceChecklist',
      {
        _key: 'systems',
        _type: 'object',
        title: 'Systems & Custom Software',
        body: 'intake, scheduling, records, and reporting — fixed where tools exist, built where nothing fits',
      },
      // After "web", matching the order on the practice page itself. No href:
      // there is no systems landing page, and the checklist renders unlinked
      // items plainly (the Content/Brand item already does this).
      'web',
    ],
  ],
});
