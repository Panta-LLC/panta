import {defineField, defineType, defineArrayMember} from 'sanity'

/**
 * A package Panta sells — a fixed-scope engagement with a name, not a
 * capability. A COLLECTION, like `service`, and toggled the same way: `listed`
 * controls whether it appears at all, `pageReady` controls whether its own page
 * is the destination.
 *
 * WHY THIS IS NOT `service`. A service says what we CAN do; the homepage hero
 * indexes those. A package says what you can BUY. They overlap by design —
 * `service` below is the reference that says which capability a package draws
 * on — but they answer different questions and a visitor asks the second one.
 *
 * The type name is `packageOffer`, not `package`, because `package` is a
 * reserved word in strict-mode JavaScript: `import package from './package'`
 * is a syntax error, and every schema file here is an ES module. The Studio
 * label and the URL (/packages/<slug>/) both stay "package".
 *
 * Deliberately much smaller than `service`. That type carries a seven-section
 * page apparatus because service pages are the deep end of the site; a package
 * needs a homepage card and a short page that ends in the review CTA.
 */
export default defineType({
  name: 'packageOffer',
  type: 'document',
  title: 'Package',
  groups: [
    {name: 'index', title: 'Card & taxonomy', default: true},
    {name: 'page', title: 'Package page'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    // -------------------------------------------------- card & taxonomy --
    defineField({
      name: 'title',
      type: 'string',
      group: 'index',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      group: 'index',
      options: {source: 'title', maxLength: 60},
      description:
        'The page URL (/packages/<slug>/). Changing it breaks every inbound link to that page — there is no legacy-anchor rescue here, so treat it as fixed once the package has been shared anywhere.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'order',
      type: 'number',
      group: 'index',
      description: 'Card order on the homepage grid. Lower first.',
      validation: (rule) => rule.required().integer().min(1),
    }),
    defineField({
      name: 'summary',
      type: 'richText',
      group: 'index',
      description:
        'The blurb on the homepage card, and the opening line of the package page when Hero lede is empty. Two or three sentences — the card has room for about four lines before it starts to crowd the rest.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'listed',
      type: 'boolean',
      group: 'index',
      initialValue: true,
      description:
        'Off: hidden from the homepage grid and no page is built. The document stays in Studio so you can turn it back on without recreating it. Distinct from Page ready — that only controls where the card links.',
    }),
    defineField({
      name: 'pageReady',
      type: 'boolean',
      group: 'index',
      initialValue: false,
      description:
        'Off: the card links to the service below instead, and the page is noindex. On: the card links to the full package page. Flip this as each page’s copy is finished — no deploy needed. Ignored when Listed is off.',
    }),
    defineField({
      name: 'bullets',
      type: 'richList',
      group: 'index',
      description:
        'What the package includes — one bullet per line. Hidden behind the “What’s included” expander on the homepage card and shown in full on the package page, in this order, in both places. Nothing is truncated, but a card whose list runs long is a card nobody finishes reading.',
    }),
    defineField({
      name: 'priceFrom',
      type: 'string',
      group: 'index',
      description:
        'DELIBERATELY EMPTY on all five packages today — this is a decision, not an oversight, and the card renders correctly without it. The homepage FAQ commits to $2,000–$10,000 for projects and each service FAQ gives a narrower band with the reasoning attached; a per-package figure that disagrees with either contradicts it two screens down on the same page. Fill this only when a package has a real fixed price that has been decided, not to make the field look answered. Optional and rendered verbatim, e.g. “From $3,000” or “$3,000–$6,000”. A blank field is not a blank line.',
    }),
    defineField({
      name: 'service',
      type: 'reference',
      group: 'index',
      to: [{type: 'service'}],
      description:
        'The capability this package draws on. Load-bearing: until Page ready is on, the homepage card links here instead. A package with neither renders as an unlinked card.',
    }),
    defineField({
      name: 'anchor',
      type: 'string',
      group: 'index',
      description:
        'Optional #fragment on the service page above, for a package whose home is a SECTION of that page rather than the page itself (e.g. "small-tools" on Operations). Ignored unless the service exists and is Page ready — appending a fragment to the /services/#slug fallback would produce a URL that scrolls nowhere. Must match an id actually rendered on that page.',
    }),
    defineField({
      name: 'contentGaps',
      type: 'array',
      group: 'index',
      of: [defineArrayMember({type: 'string'})],
      description:
        'Anything still missing (e.g. “the price band”). Each one renders a visible placeholder and fails npm run check:launch, so it cannot ship unnoticed.',
    }),

    // ------------------------------------------------------ package page --
    defineField({
      name: 'heroLede',
      type: 'richText',
      group: 'page',
      description: 'Opening paragraph on the package page. Falls back to the summary.',
    }),
    defineField({name: 'includesTitle', type: 'string', group: 'page'}),
    defineField({name: 'goodFitTitle', type: 'string', group: 'page'}),
    defineField({
      name: 'goodFit',
      type: 'richList',
      group: 'page',
      description: 'Who this is for — one bullet per line.',
    }),

    // The page always ends in a review CTA; these only override the defaults.
    //
    // Titles and labels stay plain strings on purpose. They render inside a
    // heading and a button whose type is fixed by the design, so the only thing
    // formatting could do to them is break them — and `ctaNote` is read as text
    // by PulseTerm, which finds "Pulse Check" in it to attach the definition
    // tooltip. Rich text there would hide the phrase from that lookup.
    defineField({name: 'ctaTitle', type: 'string', group: 'page'}),
    defineField({name: 'ctaBody', type: 'richText', group: 'page'}),
    defineField({
      name: 'ctaLabel',
      type: 'string',
      group: 'page',
      description:
        'Buttons describe, copy brands — must pass the no-context test. Never “Pulse Check”; the brand name belongs in the note below.',
    }),
    defineField({name: 'ctaNote', type: 'string', group: 'page'}),

    // --------------------------------------------------------------- seo --
    // Plain by necessity: these are <meta> attribute values, and there is no
    // markup in a meta tag to carry emphasis into.
    defineField({name: 'seoTitle', type: 'string', group: 'seo'}),
    defineField({name: 'seoDescription', type: 'text', rows: 2, group: 'seo'}),
  ],
  orderings: [
    {
      name: 'order',
      title: 'Card order',
      by: [{field: 'order', direction: 'asc'}],
    },
  ],
  preview: {
    select: {title: 'title', order: 'order', price: 'priceFrom', ready: 'pageReady', listed: 'listed'},
    prepare: ({title, order, price, ready, listed}) => ({
      title,
      subtitle: [
        listed === false ? 'hidden' : null,
        typeof order === 'number' ? `#${order}` : null,
        price || null,
        ready ? 'live' : 'card only',
      ]
        .filter(Boolean)
        .join(' · '),
    }),
  },
})
