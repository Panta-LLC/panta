import {defineField, defineType, defineArrayMember} from 'sanity'

/**
 * A service Panta sells. A COLLECTION, not a singleton — the homepage hero's
 * "What we do" index, the /services/ overview and the /services/<slug>/ pages
 * are all derived from these documents, so the number of services is data, not
 * code. Adding a sixth means adding a document.
 *
 * Every section field below is optional and its section renders only when
 * populated (same pattern as work/[slug].astro). The type deliberately holds
 * short scalars in fixed slots rather than Portable Text: the layouts are
 * fixed, and rich text would let an editor produce shapes the CSS cannot
 * support.
 *
 * Rule for future growth: a section belongs here only if at least two services
 * would plausibly use it. One-offs go in `contentGaps` or get their own page.
 */
export default defineType({
  name: 'service',
  type: 'document',
  title: 'Service',
  groups: [
    {name: 'index', title: 'Index & taxonomy', default: true},
    {name: 'hero', title: 'Hero'},
    {name: 'body', title: 'Page sections'},
    {name: 'faq', title: 'FAQ'},
    {name: 'cta', title: 'Closing CTA'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    // ------------------------------------------------ index & taxonomy --
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
        'LOAD-BEARING TWICE: this is the page URL (/services/<slug>/) AND the anchor id on the services overview that the homepage hero links to. Changing it breaks the hero link and every inbound deep link — add the old value to "Legacy anchors" if you must change it.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'pillar',
      type: 'string',
      group: 'index',
      description: 'Which of the three pillars this sits under.',
      options: {
        list: [
          {title: 'Digital — get found', value: 'digital'},
          {title: 'Strategic — run smoother', value: 'strategic'},
          {title: 'Creative — be remembered', value: 'creative'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'order',
      type: 'number',
      group: 'index',
      description:
        'Site-wide reading order — homepage hero, services overview, and schema. Lower first. Pillar is taxonomy only; it does not control this.',
      validation: (rule) => rule.required().integer().min(1),
    }),
    defineField({
      name: 'summary',
      type: 'text',
      rows: 4,
      group: 'index',
      description: 'The paragraph shown on the services overview.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'indexLabel',
      type: 'string',
      group: 'index',
      description: 'Shorter label for the homepage hero row. Falls back to the title.',
    }),
    defineField({
      name: 'listed',
      type: 'boolean',
      group: 'index',
      initialValue: true,
      description:
        'Off: hidden from the hero, /services/ overview, related-service links, and static paths. The document stays in Studio so you can turn it back on without recreating it. Distinct from Page ready — that only controls whether the detail page is live vs an overview anchor.',
    }),
    defineField({
      name: 'pageReady',
      type: 'boolean',
      group: 'index',
      initialValue: false,
      description:
        'Off: links point at the overview anchor and the page is noindex. On: links point at the full page. Flip this per service as its copy is finished — no deploy needed. Ignored when Listed is off.',
    }),
    defineField({
      name: 'legacyAnchors',
      type: 'array',
      group: 'index',
      of: [defineArrayMember({type: 'string'})],
      description:
        'Old anchor ids this service absorbed (e.g. a merged service). Rendered as invisible anchor stubs on the overview so old links still land in the right place — a stale fragment scrolls silently to the top rather than 404ing, so this is the only defence.',
    }),
    defineField({
      name: 'relatedServices',
      type: 'array',
      group: 'index',
      of: [defineArrayMember({type: 'reference', to: [{type: 'service'}]})],
      validation: (rule) => rule.max(3),
      description: 'Often paired with — shown near the foot of the page.',
    }),

    // ------------------------------------------------------------- hero --
    defineField({name: 'heroLabel', type: 'string', group: 'hero'}),
    defineField({name: 'heroTitle', type: 'string', group: 'hero'}),
    defineField({name: 'heroLede', type: 'text', rows: 3, group: 'hero'}),
    defineField({
      name: 'heroSecondaryLabel',
      type: 'string',
      group: 'hero',
      description: 'Optional ghost button beside the primary. The primary always books a review.',
    }),
    defineField({name: 'heroSecondaryHref', type: 'string', group: 'hero'}),

    // ------------------------------------------------- price & audience --
    // journey-redesign.md §4: every service page carries a price strip, proof,
    // and "who this is for". The first two have code defaults; the third has
    // none, because a persona sentence written by a template would be worth
    // less than the space — an unfilled `audience` renders a build-blocking
    // placeholder instead (see services/[slug].astro).
    defineField({
      name: 'priceStrip',
      type: 'string',
      group: 'hero',
      description:
        'The price/time line under the hero buttons. Leave EMPTY to use the site-wide band ("Most projects: $2,000–$10,000 · scoped in weeks · fixed price in writing", set in src/lib/offer.js). Fill it in only when this service has its own published range — and then it must be a range you will honour in writing.',
    }),

    defineField({
      name: 'audienceLabel',
      type: 'string',
      group: 'body',
      description: 'Defaults to "Who this is for".',
    }),
    defineField({name: 'audienceTitle', type: 'string', group: 'body'}),
    defineField({
      name: 'audience',
      type: 'array',
      group: 'body',
      of: [defineArrayMember({type: 'labeledCard'})],
      validation: (rule) => rule.max(4),
      description:
        'Two or three personas — practitioner, nonprofit, local business — each with ONE sentence on what this service does for them specifically. Not a benefits list: the job is that a reader recognises themselves. Required for a page-ready service; the page renders a visible placeholder and fails npm run check:launch without it.',
    }),

    // ---------------------------------------------------------- sections --
    defineField({
      name: 'proofLabel',
      type: 'string',
      group: 'body',
      description:
        'Heading over the proof block under the hero (defaults to "Proof"). The block itself is built from Featured projects below — it shows the case study and the client\'s own quote where there is one, so a service with no featured project shows nothing here and blocks the launch check.',
    }),

    defineField({name: 'workLabel', type: 'string', group: 'body'}),
    defineField({name: 'workTitle', type: 'string', group: 'body'}),
    defineField({
      name: 'featuredProjects',
      type: 'array',
      group: 'body',
      of: [defineArrayMember({type: 'reference', to: [{type: 'project'}]})],
      validation: (rule) => rule.max(3),
      description:
        'Work to show on this service. THE FIRST ONE is the proof block under the hero, so put the project that actually demonstrates THIS service first — a brand page proving itself with a website build is the exact mismatch the proof block exists to fix. If empty, falls back to projects flagged "featured".',
    }),
    defineField({name: 'moreCardTitle', type: 'string', group: 'body'}),
    defineField({name: 'moreCardBody', type: 'text', rows: 2, group: 'body'}),
    defineField({name: 'moreCardLinkLabel', type: 'string', group: 'body'}),

    defineField({name: 'includesLabel', type: 'string', group: 'body'}),
    defineField({name: 'includesTitle', type: 'string', group: 'body'}),
    defineField({
      name: 'includes',
      type: 'array',
      group: 'body',
      of: [defineArrayMember({type: 'labeledCard'})],
      description: 'What the engagement actually covers.',
    }),

    defineField({name: 'pivotLabel', type: 'string', group: 'body'}),
    defineField({name: 'pivotTitle', type: 'string', group: 'body'}),
    defineField({
      name: 'pivotAnchor',
      type: 'string',
      group: 'body',
      description:
        'Optional #fragment id for the pivot band, so something else can deep-link straight to it — the homepage Custom Software card points at /services/operations/#small-tools this way. Lowercase, hyphenated, no "#". LOAD-BEARING once anything links to it: a stale fragment scrolls silently to the top of the page rather than 404ing, so changing it breaks the link with no error anywhere.',
    }),
    defineField({name: 'pivotLede', type: 'text', rows: 2, group: 'body'}),
    defineField({name: 'pivotIntro', type: 'text', rows: 2, group: 'body'}),
    defineField({
      name: 'pivotChecklist',
      type: 'array',
      group: 'body',
      of: [defineArrayMember({type: 'labeledCard'})],
    }),
    defineField({name: 'pivotCtaLabel', type: 'string', group: 'body'}),
    defineField({name: 'pivotCtaHref', type: 'string', group: 'body'}),

    defineField({name: 'processLabel', type: 'string', group: 'body'}),
    defineField({name: 'processTitle', type: 'string', group: 'body'}),
    defineField({name: 'processBody', type: 'text', rows: 3, group: 'body'}),
    defineField({name: 'processLinkLabel', type: 'string', group: 'body'}),
    defineField({
      name: 'processLinkHref',
      type: 'string',
      group: 'body',
      description: 'Defaults to /process/. Leave empty unless this service genuinely runs differently.',
    }),

    // -------------------------------------------------------------- faq --
    defineField({name: 'faqLabel', type: 'string', group: 'faq'}),
    defineField({name: 'faqTitle', type: 'string', group: 'faq'}),
    defineField({
      name: 'faqs',
      type: 'array',
      group: 'faq',
      of: [defineArrayMember({type: 'faqItem'})],
    }),

    // -------------------------------------------------------------- cta --
    // The page always ends in the THREE DOORS (review · quote · newsletter) —
    // journey-redesign.md §1.1. These two are the heading and lede over them.
    defineField({
      name: 'ctaTitle',
      type: 'string',
      group: 'cta',
      description: 'Heading over the three doors. Defaults to "Not sure this is what you need?".',
    }),
    defineField({
      name: 'ctaBody',
      type: 'text',
      rows: 3,
      group: 'cta',
      description:
        'One line under that heading. Do NOT re-pitch the review here — the doors name themselves, and the review is already the recommended one.',
    }),
    // `ctaLabel` and `ctaNote` are retired: the door labels come from
    // src/lib/offer.js so all three read identically on every page, and the
    // microcopy line they sat under went with the single-CTA close. Left
    // undeclared rather than deprecated — any value still in a document is
    // simply not read, and re-adding them would reintroduce per-page drift in
    // the one label that must not drift.

    // --------------------------------------------------- content gaps --
    defineField({
      name: 'contentGaps',
      type: 'array',
      group: 'index',
      of: [defineArrayMember({type: 'string'})],
      description:
        'Anything still missing (e.g. "two media samples"). Each one renders a visible placeholder and fails npm run check:launch, so it cannot ship unnoticed.',
    }),

    // -------------------------------------------------------------- seo --
    defineField({name: 'seoTitle', type: 'string', group: 'seo'}),
    defineField({name: 'seoDescription', type: 'text', rows: 2, group: 'seo'}),
    defineField({
      name: 'serviceType',
      type: 'string',
      group: 'seo',
      description: 'schema.org serviceType. Falls back to the title.',
    }),
  ],
  orderings: [
    {
      name: 'order',
      title: 'Reading order',
      by: [{field: 'order', direction: 'asc'}],
    },
  ],
  preview: {
    select: {title: 'title', pillar: 'pillar', order: 'order', ready: 'pageReady', listed: 'listed'},
    prepare: ({title, pillar, order, ready, listed}) => ({
      title,
      subtitle: [
        listed === false ? 'hidden' : null,
        typeof order === 'number' ? `#${order}` : null,
        pillar,
        ready ? 'live' : 'anchor only',
      ]
        .filter(Boolean)
        .join(' · '),
    }),
  },
})
