/**
 * The content half of journey-redesign.md.
 *
 *   node scripts/apply-journey-redesign.mjs            # dry run
 *   node scripts/apply-journey-redesign.mjs --apply    # writes
 *
 * The code half is already in the repo; this is everything that lives in Sanity
 * and therefore could not ship with it. Grouped by the section of the proposal
 * it comes from. Safety contract is the shared one in lib/apply-edits.mjs:
 * every set declares the value it expects to find, a mismatch is a conflict
 * that aborts the whole run, and all edits commit in one transaction.
 *
 * TWO THINGS TO KNOW BEFORE RUNNING IT:
 *
 * 1. The Studio needs deploying too (`npm run deploy --prefix studio`). This
 *    script writes to fields that did not exist before — `service.audience`,
 *    `service.priceStrip`, `project.services`, `packageOffer.anchor`. The site
 *    reads them either way; the Studio will not SHOW them until it is deployed,
 *    so an editor would see the values vanish from the UI.
 *
 * 2. `project.services` and `service.featuredProjects` are references, written
 *    here by document _id. Those ids are stable and were read from the dataset;
 *    if a document has been recreated since, the run will fail loudly on a
 *    missing doc rather than writing a dangling reference.
 */
import { run } from './lib/apply-edits.mjs';

// Reference targets, by the _id they actually have in the dataset. Named here
// so a typo is a broken constant rather than a silently dangling reference.
const PROJECT = {
  dbi: 'ec0c47ee-a984-4990-b2bc-a619c4203407',
  arielle: '0cc5e6e2-2f14-4277-aa16-c9b658994a1f',
};

// The web service's _id is `service-web-presence`, not `service-web-design-development`:
// the document was migrated from the old "web presence" service and kept its id
// while its slug changed (see migrate-websites-service.mjs). Naming it once here
// so no edit below has to remember that.
const SERVICE_WEB = 'service-web-presence';

const ref = (id, key) => ({ _type: 'reference', _ref: id, _key: key });

await run({
  name: 'journey-redesign.md — content batch',

  sets: [
    // ═══════════════════════════════════════════════════════════════════════
    // §3 — the rename. "Pulse Check" becomes "the Review"; Pulse now means the
    // newsletter and nothing else. See src/lib/offer.js for what the rename
    // deliberately did NOT touch: the /consultation/ URL and every analytics
    // event name.
    // ═══════════════════════════════════════════════════════════════════════
    [
      'homeHero',
      'ctaMicrocopy',
      'We call it the Pulse Check · 30 minutes + a written action plan in 48 hours',
      'We call it the Review · 30 minutes + a written action plan in 48 hours',
    ],
    [
      'consultationPage',
      'heroLabel',
      'The Pulse Check · free 30-minute review',
      'The Review · free, 30 minutes, no obligation',
    ],
    // The article-end funnel on every Pulse category (bridgeCopy is the WHOLE
    // article funnel — see the note in PULSE-HOME-BUILD.md §5). Three
    // near-identical lines, one per category, each naming the offer.
    [
      'category-flow',
      'bridgeCopy',
      'If your week disappears into processes like this one, that’s usually fixable. A Pulse Check is a free 30-minute review — you’ll leave with a written readout and two or three things worth doing either way.',
      'If your week disappears into processes like this one, that’s usually fixable. The Review is a free 30-minute conversation — you’ll leave with a written readout and two or three things worth doing either way.',
    ],
    [
      'category-signal',
      'bridgeCopy',
      'If people who need your work can’t find it, that’s usually fixable. A Pulse Check is a free 30-minute review — you’ll leave with a written readout and two or three things worth doing either way.',
      'If people who need your work can’t find it, that’s usually fixable. The Review is a free 30-minute conversation — you’ll leave with a written readout and two or three things worth doing either way.',
    ],
    [
      'category-voice',
      'bridgeCopy',
      'If your story isn’t landing the way the work deserves, that’s usually fixable. A Pulse Check is a free 30-minute review — you’ll leave with a written readout and two or three things worth doing either way.',
      'If your story isn’t landing the way the work deserves, that’s usually fixable. The Review is a free 30-minute conversation — you’ll leave with a written readout and two or three things worth doing either way.',
    ],

    // ═══════════════════════════════════════════════════════════════════════
    // §5.5 — /contact/ stops selling the review and becomes a contact page.
    // The hero copy is all that is still rendered; the "what happens next"
    // list and the ?quote=1 hero swap are gone from the template, and their
    // fields are no longer declared in the Studio schema.
    // ═══════════════════════════════════════════════════════════════════════
    // Straight apostrophes, not curly, in every `from` below that has one: the
    // live values were typed rather than smart-quoted, and the expected-value
    // check is byte-exact by design.
    ['contactPage', 'heroTitle', "Tell us what's not working.", 'Say hello.'],
    [
      'contactPage',
      'heroLede',
      'The fastest path is a Pulse Check — a free 30-minute review. Book a time directly, no back-and-forth.',
      'Tell us what’s going on and we’ll reply within one business day — with a straight answer if it doesn’t need a call, and a time to talk if it does.',
    ],

    // ═══════════════════════════════════════════════════════════════════════
    // §5.2 — the review page: repairs and the broadened frame.
    // ═══════════════════════════════════════════════════════════════════════
    // A genuinely broken link: /web-strategy/ is a retired route that 301s
    // through a catch-all, and `#process` is an anchor that exists on nothing.
    // "Not ready to book? See how the practice works" landed at the top of an
    // unrelated page. §3 built /process/ to be the destination it always meant.
    ['consultationPage', 'escapeHref', '/web-strategy/#process', '/process/'],
    [
      'consultationPage',
      'escapeLinkLabel',
      'See how the practice works',
      'See how a project runs',
    ],
    // §6: drop "website" from the CTA. The Review covers brand and operations
    // too, and the word excluded two thirds of what it looks at.
    ['consultationPage', 'bookCtaLabel', 'Get a free website review ↓', 'Get a free review ↓'],
    // The panel promised "the whole picture" and mapped three channels. §4's
    // fourth rule: the review page must see every persona, and operations was
    // invisible on the page that sells the front door to it.
    [
      'consultationPage',
      'panelSub',
      "What we map together \u2014 whether you're starting from zero or already live.",
      "What we map together \u2014 whether you're starting from zero or already live. Including where the hours go once people do show up.",
    ],

    // ═══════════════════════════════════════════════════════════════════════
    // §5.4 — the Digital Presence Plan.
    // ═══════════════════════════════════════════════════════════════════════
    // The button said "Get a quote" and led to /contact/?quote=1 — a generic
    // contact form. The destination is a real page now; the label matches it.
    ['planPage', 'pricingCtaLabel', 'Get a quote', 'Request a quote'],
    // "Quoted to your situation" answers a question nobody asked with a phrase
    // that sounds like avoidance. No floor is published yet (owner's call), so
    // this commits to the parts that ARE decided: written, before anything
    // starts, after a free conversation.
    [
      'planPage',
      'pricingTitle',
      'Quoted to your situation. Everything included.',
      'Quoted in writing after the free review. Everything included.',
    ],

    // ═══════════════════════════════════════════════════════════════════════
    // §6 — copy fixes.
    // ═══════════════════════════════════════════════════════════════════════
    // The Web card led with "your online representation spans across many
    // channels" — an abstraction that never says the word "website", on the
    // card for the service most people arrive wanting.
    [
      'package-digital-presence',
      'summary[_key=="c49646c3feb5"].children[_key=="b27cc9a0ba60"].text',
      // Every space in the live value is U+205F (medium mathematical space), not
      // U+0020 — the copy was pasted in from a design tool and the substitution
      // is invisible in the Studio. It reaches the homepage card as-is, so this
      // edit quietly fixes a rendering bug as well as the wording. The expected
      // value has to be spelled with the real characters or the byte-exact
      // check reports a conflict between two strings that look identical.
      'Your\u205fonline\u205frepresentation\u205fspans\u205facross\u205fmany\u205fchannels,\u205fincluding\u205fyour\u205fwebsite,\u205fsocial\u205fprofiles,\u205fbusiness\u205fdirectories,\u205fand\u205fmore.\u205fA\u205fstrong\u205fdigital\u205fpresence\u205fincludes\u205fa\u205fstrong,\u205fintentional\u205frelationship\u205fbetween\u205fthese\u205fthat\u205feffectively\u205frepresent\u205fyour\u205fbusiness\u205fmission\u205fand\u205fobjectives.',
      'A fast, credible website you can maintain yourself — connected to the Google profile, directories, and social channels people actually find you through.',
    ],
    // §3: Custom Software was a homepage card with no destination —
    // packageHref() returned null and it rendered as plain text. It now points
    // at its section of the Operations page.
    //
    // BOTH edits are required and the anchor alone does nothing: packageHref()
    // builds the URL from the SERVICE reference and only then appends the
    // fragment, so a package with an anchor and no service is still a dead card.
    [
      'package-custom-software',
      'service',
      undefined,
      {_type: 'reference', _ref: 'service-operations'},
    ],
    ['package-custom-software', 'anchor', undefined, 'small-tools'],

    // ═══════════════════════════════════════════════════════════════════════
    // §4 — the service page template. Proof that matches the service, "who
    // this is for", and the process link that was pointing at a service list.
    // ═══════════════════════════════════════════════════════════════════════
    // "See how it works →" pointed at /services/. It is the second of the two
    // broken process links §3 names.
    [SERVICE_WEB, 'processLinkHref', '/services/', '/process/'],
    [SERVICE_WEB, 'processLinkLabel', 'See how it works →', 'See how a project runs →'],

    // §4, Storytelling specifics: "Read Pulse" sent people to an archive with
    // one post in it. Until it is deeper, the storytelling page's secondary
    // action is the newsletter — the third door — not the archive.
    ['service-storytelling', 'heroSecondaryLabel', 'Read Pulse', undefined],
    ['service-storytelling', 'heroSecondaryHref', '/pulse/', undefined],
    // The other two carried "See our work" as a hero ghost button. That slot is
    // the quote door now (services/[slug].astro), and the work is directly
    // below the hero in the proof block either way.
    ['service-brand-design', 'heroSecondaryLabel', 'See our work', undefined],
    ['service-brand-design', 'heroSecondaryHref', '/work/', undefined],
    ['service-operations', 'heroSecondaryLabel', 'See our work', undefined],
    ['service-operations', 'heroSecondaryHref', '/work/', undefined],

    // Proof headings. The block under each hero is the case study itself now,
    // not a row of client names, so the label names what it is.
    [SERVICE_WEB, 'proofLabel', 'Trusted by teams like', 'Proof'],
    ['service-brand-design', 'proofLabel', undefined, 'Proof'],
    ['service-operations', 'proofLabel', undefined, 'Proof'],
    ['service-storytelling', 'proofLabel', undefined, 'Proof'],

    // Which case study proves which service. Before this, every service page
    // fell back to the globally-featured projects, so the brand page argued for
    // itself with a website build — the exact mismatch §1.2 exists to fix.
    // Order matters: the FIRST is the one the proof block shows.
    [
      'service-brand-design',
      'featuredProjects',
      undefined,
      [ref(PROJECT.arielle, 'fp-arielle')],
    ],
    ['service-operations', 'featuredProjects', undefined, [ref(PROJECT.dbi, 'fp-dbi')]],
    ['service-storytelling', 'featuredProjects', undefined, [ref(PROJECT.dbi, 'fp-dbi')]],
    [
      SERVICE_WEB,
      'featuredProjects',
      undefined,
      [ref(PROJECT.dbi, 'fp-dbi'), ref(PROJECT.arielle, 'fp-arielle')],
    ],

    // §5.6 — which services each case study demonstrates. Builds the /work/
    // filter row, and lets a case study end by pointing at the service it is
    // evidence for rather than only at the review.
    [
      PROJECT.dbi,
      'services',
      undefined,
      [
        ref(SERVICE_WEB, 'svc-web'),
        ref('service-operations', 'svc-ops'),
        ref('service-storytelling', 'svc-story'),
      ],
    ],
    [
      PROJECT.arielle,
      'services',
      undefined,
      [ref('service-brand-design', 'svc-brand'), ref(SERVICE_WEB, 'svc-web')],
    ],

    // "Who this is for" — three personas per service, one sentence each, in the
    // audience's own situation rather than in our label for it. §4 borrows the
    // shape from the Plan page's persona section, which §5.4 calls the model
    // for the rest of the site.
    //
    // These are claims about who the service suits, not about outcomes: nothing
    // here quantifies anything, per the standing rule that copy stays at what
    // the work IS until real client numbers exist.
    [
      SERVICE_WEB,
      'audience',
      undefined,
      [
        {
          _key: 'aud-practitioner',
          _type: 'labeledCard',
          title: 'Independent practitioners',
          body: 'A site that reads as competent to someone deciding whether to trust you with something personal — and that shows up when they search the thing you actually do, in the place you actually do it.',
        },
        {
          _key: 'aud-nonprofit',
          _type: 'labeledCard',
          title: 'Nonprofits and community organizations',
          body: 'One site that has to work for donors, volunteers, funders and the people you serve at once, and that a half-time communications person can keep current without calling anyone.',
        },
        {
          _key: 'aud-local',
          _type: 'labeledCard',
          title: 'Local businesses',
          body: 'The site, the Google profile and the directories treated as one system, so the people already searching for what you sell can find you, believe you, and get in touch on a phone.',
        },
      ],
    ],
    [
      'service-brand-design',
      'audience',
      undefined,
      [
        {
          _key: 'aud-practitioner',
          _type: 'labeledCard',
          title: 'Independent practitioners',
          body: 'You are the brand, which is the hard part. We build an identity that carries the feeling you want a first-time client to have, and applies it to the six things you actually print.',
        },
        {
          _key: 'aud-nonprofit',
          _type: 'labeledCard',
          title: 'Nonprofits and community organizations',
          body: 'Years of flyers, decks and reports made by different volunteers, none of which look related. A system plus editable templates so the next one matches without asking anybody.',
        },
        {
          _key: 'aud-local',
          _type: 'labeledCard',
          title: 'Local businesses',
          body: 'A look that survives a truck door, a photocopier and a phone screen — recognisable at the sizes you actually use, not just in a presentation.',
        },
      ],
    ],
    [
      'service-operations',
      'audience',
      undefined,
      [
        {
          _key: 'aud-practitioner',
          _type: 'labeledCard',
          title: 'Independent practitioners',
          body: 'Intake, scheduling, notes and invoicing spread across four tools and a notebook. We map where the hours go and fix the two that cost you most — usually with software you already pay for.',
        },
        {
          _key: 'aud-nonprofit',
          _type: 'labeledCard',
          title: 'Nonprofits and community organizations',
          body: 'The process lives in one person’s head and that person is leaving, or is you. Getting it out of there is a risk reduction before it is an efficiency gain.',
        },
        {
          _key: 'aud-local',
          _type: 'labeledCard',
          title: 'Local businesses',
          body: 'Quotes, jobs, and follow-up tracked in a spreadsheet that only works because you remember what the columns mean. We keep what works and replace the parts that break under load.',
        },
      ],
    ],
    [
      'service-storytelling',
      'audience',
      undefined,
      [
        {
          _key: 'aud-practitioner',
          _type: 'labeledCard',
          title: 'Independent practitioners',
          body: 'Writing about your work without overclaiming or hiding behind jargon — and within whatever your professional ethics code actually allows you to say.',
        },
        {
          _key: 'aud-nonprofit',
          _type: 'labeledCard',
          title: 'Nonprofits and community organizations',
          body: 'The work is moving and the words about it are not. We help you tell it in a way that respects the people in the story, and at a rhythm you can keep after we leave.',
        },
        {
          _key: 'aud-local',
          _type: 'labeledCard',
          title: 'Local businesses',
          body: 'Enough of the right words in the right places that a stranger understands what you do and why you, without you having to become a publisher.',
        },
      ],
    ],
  ],

  inserts: [
    // §5.2 — the fourth node in the review page's diagnostic panel. Three cards
    // (website, social, content) meant the page that sells the front door to
    // the operations practice never mentioned operations. Keyed, so a re-run is
    // a no-op rather than a duplicate.
    [
      'consultationPage',
      'panelNodes',
      {
        _key: 'n4',
        _type: 'labeledCard',
        kicker: 'Keep up',
        title: 'Operations',
        body: 'Where the hours go — intake, scheduling, records. Can you keep up once they do show up?',
      },
      'n3',
    ],

    // §4 — a cost question on Brand, Operations and Storytelling, to match the
    // one the Web page already carries. Same number as the price strip and the
    // homepage FAQ, because it is the same commitment, and a page that shows a
    // band in the hero and dodges the question in the FAQ reads worse than one
    // that never mentioned money.
    [
      'service-brand-design',
      'faqs',
      {
        _key: 'f-standalone',
        _type: 'faqItem',
        q: 'Do we have to do a website with you to do the brand?',
        a: 'No. Brand work is scoped on its own all the time — often before there is a site to put it on, which is the easiest order to do it in. If a site is coming later, we build the identity so whoever makes it has what they need.',
      },
      // Anchored on f3, not on f-cost, and queued BEFORE it. Inserts are checked
      // against the document as fetched, so anchoring one insert to another
      // insert's key in the same run is a conflict — the anchor does not exist
      // yet. Both go after f3; queueing this one first leaves the finished order
      // f3 → cost → standalone.
      'f3',
    ],
    [
      'service-brand-design',
      'faqs',
      {
        _key: 'f-cost',
        _type: 'faqItem',
        q: 'What does a brand project cost?',
        a: 'Most land between $2,000 and $10,000, depending on how much has to be applied and how many templates you need. A mark, type and colour with a short guide sits at the low end; a full system applied across a site, signage and print sits at the high end. Fixed price, in writing, before anything starts.',
      },
      'f3',
    ],
    // §4, Brand specifics: the site implied brand work follows a website
    // review. It does not have to, and saying so removes a sequencing objection
    // that was never real.
    [
      'service-operations',
      'faqs',
      {
        _key: 'f-cost',
        _type: 'faqItem',
        q: 'What does this cost?',
        a: 'Most engagements land between $2,000 and $10,000. A mapping engagement on its own sits at the low end; a map plus building the two or three things it turns up sits higher. Small tools are quoted separately and are usually the cheapest useful thing we do. Fixed price, in writing, before anything starts.',
      },
      'f4',
    ],
    [
      'service-storytelling',
      'faqs',
      {
        _key: 'f-cost',
        _type: 'faqItem',
        q: 'What does content work cost?',
        a: 'Most projects land between $2,000 and $10,000, depending on how much writing is ours and how much is yours with our help. Rewriting the pages that matter sits at the low end; a full content strategy with a publishing system sits higher. Fixed price, in writing, before anything starts.',
      },
      'f3',
    ],
  ],

  replacements: [
    // §5.4 — the Plan's third persona was E-commerce, a capability nothing else
    // on the site sells and no case study supports. Replaced with the third
    // audience the homepage hero already names, which the Cedar & Stone sample
    // readout is also written about.
    [
      'planPage',
      'fits',
      {
        _key: 'ec',
        title: 'Local businesses',
        body: 'the Google Business Profile, the directories your trade actually uses, and reviews — the places a nearby customer meets you before your website gets a look. Plus whether someone can reach you from a phone at eight in the evening.',
      },
    ],
  ],
});
