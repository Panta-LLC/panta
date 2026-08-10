import {defineField, defineType, defineArrayMember} from 'sanity'

export default defineType({
  name: 'siteSettings',
  type: 'document',
  title: 'Site Settings',
  fields: [
    defineField({name: 'email', type: 'string', title: 'Email'}),
    defineField({name: 'locationLine', type: 'string', title: 'Location Line'}),
    defineField({name: 'footerTagline', type: 'string', title: 'Footer Tagline'}),
    defineField({name: 'footerDescriptor', type: 'text', title: 'Footer Descriptor'}),
    defineField({name: 'replyLine', type: 'string', title: 'Reply Line'}),
    defineField({name: 'headerCtaLabel', type: 'string', title: 'Header Cta Label'}),
    defineField({name: 'scheduleUrl', type: 'url', title: 'Schedule Url', description: 'Google Calendar public booking link'}),
    defineField({name: 'calEmbedUrl', type: 'url', title: 'Cal Embed Url', description: 'Google Calendar embeddable schedule URL'}),

    // --- homepage dynamic slots (PULSE-HOME-BUILD.md §6) ---
    // Was an array of bare images. Logos now live on the Client Profile they
    // belong to, so the bar is a curated, ordered list of those clients: drag
    // to reorder, and a client with no logo or no `logoApproved` is skipped by
    // the query rather than rendering a gap.
    defineField({
      name: 'trustBarClients',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'client'}]})],
      description:
        'Homepage trust bar, in display order. Only clients with an approved logo render. The bar appears at 3 or more; below that the homepage falls back to the single-line copy automatically.',
    }),
    defineField({
      name: 'featuredCaseStudy',
      type: 'reference',
      to: [{type: 'project'}],
      description: 'Drives the homepage case study section. Delta Bay Impact is the launch pick.',
    }),
    // Rendered in the footer, in this order, and published as the `sameAs`
    // array of the site-wide Organization JSON-LD — which is how Google ties
    // these accounts to Panta as one entity rather than several. That second
    // job is why the URL field is validated hard: a broken `sameAs` entry is a
    // worse signal than an absent one.
    defineField({
      name: 'socialProfiles',
      type: 'array',
      title: 'Social profiles',
      of: [defineArrayMember({type: 'socialProfile'})],
      description:
        'Where Panta exists off-site, in the order they should appear in the footer. Leave empty and the footer block disappears entirely rather than rendering an empty heading. Only list accounts that are actually maintained — a dead profile linked from the footer is a live impression of an abandoned business.',
    }),

    defineField({
      name: 'newsletterBlurb',
      type: 'text',
      rows: 2,
      description: 'Body copy for the newsletter blocks on the homepage and Pulse index.',
    }),
  ],
})
