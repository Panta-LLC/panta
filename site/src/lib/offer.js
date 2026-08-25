/**
 * The offers, their routes, and the numbers attached to them.
 *
 * This file exists because `journey-redesign.md` §1 asks for three doors on
 * every page and a number on every offer — which means the same handful of
 * strings now appear on ~15 surfaces instead of two. Duplicating them is how
 * "$2,000–$10,000" ends up saying something different on the homepage FAQ than
 * on the brand page.
 *
 * ── The naming decision (journey-redesign.md §3) ───────────────────────────
 * The free entry offer was called "the Pulse Check". It is now **the Review**.
 * The collision the rename resolves: every button on the site already reads
 * "Get a free review", so the offer's name and its call to action were two
 * different words for one thing, and "Pulse" had to carry both the offer and
 * the newsletter. Pulse now means the newsletter and nothing else.
 *
 * What did NOT change, deliberately:
 *
 *   - **The URL.** `/consultation/` keeps its path. Inbound links, the Google
 *     Business Profile and every printed link point there, and the Plausible
 *     funnel is keyed to that pathname
 *     (docs/PLAUSIBLE-FUNNELS.md). `/review` and `/pulse-check` both 301 to it.
 *   - **The analytics event names.** `pulse_check_booked`, and
 *     `data-track-cta="pulse_check"`, stay exactly as they are. They are goal
 *     identifiers configured in the Plausible dashboard, not copy — renaming
 *     them would zero the historical series and silently break the configured
 *     goals. See DOORS below for the vocabulary the new paths use.
 *
 * The `TERM` pattern is what OfferTerm.astro looks for in CMS-editable
 * microcopy. Case-sensitive on "Review" on purpose: the lowercase phrase "free
 * review" is the button label and appears constantly, and matching it would
 * hang a definition tooltip off every CTA on the site.
 */

/** The free entry offer. */
export const OFFER = {
  /** Mid-sentence form: "start with the Review". */
  name: 'the Review',
  /** Sentence-initial / title form. */
  Name: 'The Review',
  /** What it is, in one clause. Used where the name needs an apposition. */
  gloss: 'a free 30-minute review',
  /** What arrives afterward. The only part a competitor cannot copy by also offering a free call. */
  deliverable: 'a one-page written readout within 48 hours',
  /** The definition OfferTerm hangs on the term. */
  definition:
    'A free 30-minute conversation about where things stand — plus a one-page readout within 48 hours: three observations and one recommendation, yours to keep whether we work together or not.',
};

/** Matches the offer name inside editor-written microcopy. See the header note. */
export const TERM = /\bthe Review\b/;

/** The paid engagement the Review leads to. */
export const PLAN = {
  name: 'the Digital Presence Plan',
  Name: 'The Digital Presence Plan',
  href: '/digital-presence-plan/',
  /* No floor published yet — the owner's call, journey-redesign.md §5.4. What
     IS committed is everything around the number, so the strip promises the
     shape of the deal rather than staying silent. */
  strip: 'Quoted in writing after the free review · 10 business days · free re-score at 90 days',
};

/**
 * Routes. Nothing outside this file should spell these out — the three doors
 * appear on every service page, the homepage, the review page and the plan.
 */
export const ROUTES = {
  review: '/consultation/',
  /** Only for labels that promise a slot outright ("or pick a time now"). */
  reviewSlot: '/consultation/#book',
  quote: '/quote/',
  process: '/process/',
  plan: '/digital-presence-plan/',
  work: '/work/',
  pulse: '/pulse/',
  services: '/services/',
  contact: '/contact/',
};

/**
 * The price strip (§4, "a number on every offer").
 *
 * One band across all five services rather than per-service ranges — the
 * owner's decision, and the honest one: this is the number already published in
 * the homepage FAQ and the packages band, so the strip restates a commitment
 * instead of inventing five new ones. Per-service ranges override it from the
 * Studio (`service.priceStrip`) the day those numbers exist.
 */
export const PRICE_STRIP =
  'Most projects: $2,000–$10,000 · scoped in weeks · fixed price in writing';

/**
 * The three doors, in the order they are always offered: decided-but-unsure,
 * decided-and-scoped, not-yet.
 *
 * `cta` is the analytics vocabulary for the door itself. `review` reuses the
 * existing `pulse_check` value for the reason in the header comment; the other
 * two are new because the paths they measure are new.
 */
export const DOORS = {
  review: {
    label: 'Get a free review',
    body: 'Something isn’t working and you’re not sure what. 30 minutes, then a written readout.',
    href: ROUTES.review,
    cta: 'pulse_check',
  },
  quote: {
    label: 'Send a brief for a quote',
    body: 'You know what you need built. A fixed-price quote in writing within two business days.',
    href: ROUTES.quote,
    cta: 'quote_request',
  },
  pulse: {
    label: 'Get Pulse every other week',
    body: 'Not ready for either. One useful idea at a time, no funnel.',
    href: ROUTES.pulse,
    cta: 'newsletter_door',
  },
};

/** The quote promise, stated identically wherever the quote door appears. */
export const QUOTE_PROMISE = 'A fixed-price quote in writing within two business days.';
