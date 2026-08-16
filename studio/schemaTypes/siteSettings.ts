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
    // The one booking URL. /consultation/ derives the embed from it by adding
    // ?embed=true (site/src/lib/booking.js), so there is nothing else to keep
    // in sync and no way to have the embed pointing somewhere the fallback
    // link doesn't.
    defineField({
      name: 'scheduleUrl',
      type: 'url',
      title: 'Booking page URL',
      description:
        'The Koalendar booking page, e.g. https://koalendar.com/e/your-page. Copy it from Koalendar → your event → Share. Paste the plain link; the site adds ?embed=true itself. Changing this changes both the embedded calendar and the "open in a new tab" fallback.',
    }),
    // Kept rather than deleted so the old value is not silently dropped and so
    // nobody re-adds a field with this name meaning something else. Nothing
    // reads it.
    defineField({
      name: 'calEmbedUrl',
      type: 'url',
      title: 'Cal Embed Url (retired)',
      readOnly: true,
      description:
        'RETIRED — the Google Calendar embed URL, from before the switch to Koalendar. No longer read by the site. Safe to ignore.',
    }),

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
