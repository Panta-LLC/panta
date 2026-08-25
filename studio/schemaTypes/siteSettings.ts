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
    // ?gv=true (site/src/lib/booking.js), so there is nothing else to keep in
    // sync and no way to have the embed pointing somewhere the fallback link
    // doesn't.
    defineField({
      name: 'scheduleUrl',
      type: 'url',
      title: 'Booking page URL',
      description:
        'The Google Calendar appointment schedule, e.g. https://calendar.google.com/calendar/appointments/schedules/… — open the schedule in Google Calendar, choose Share → Embed, and copy the address out of the snippet. Paste it plain; the site adds ?gv=true itself. Do NOT paste the short calendar.app.google link: it works as a link but refuses to be embedded, so the page would fall back to "open in a new tab" and show no calendar. Changing this changes both the embedded calendar and that fallback link.',
    }),
    // Kept rather than deleted so the old value is not silently dropped and so
    // nobody re-adds a field with this name meaning something else. Nothing
    // reads it — the embed URL is derived from Booking page URL above.
    defineField({
      name: 'calEmbedUrl',
      type: 'url',
      title: 'Cal Embed Url (retired)',
      readOnly: true,
      description:
        'RETIRED — the separate Google Calendar embed URL, from before the embed was derived from the booking link. No longer read by the site. Safe to ignore.',
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

    // --- copy that renders on more than one page -----------------------------
    // Both of these were literals in the codebase. They live here rather than on
    // a page singleton because neither belongs to one page: the steps render on
    // the homepage AND /process/, and the FAQ answers feed the homepage's
    // FAQPage JSON-LD as well as the visible list. Copy duplicated across
    // surfaces is how the site ends up promising two different things.
    //
    // Every field is optional. Both pages fall back to the launch copy in
    // `src/lib/process.js` and `src/pages/index.astro`, so emptying one here
    // renders the shipped page rather than a blank section.
    defineField({
      name: 'processSteps',
      type: 'array',
      title: 'Process steps',
      description:
        'The three steps, in order. Shown on the homepage and in full on /process/ — `output` and `note` only appear on /process/, which has the room for them. These state commitments (30 minutes, 48 hours, a fixed price before work starts) that the rest of the site repeats, so changing one here means checking it still agrees with the FAQ below.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'processStep',
          fields: [
            defineField({name: 'n', type: 'string', title: 'Number', description: 'e.g. “1”.'}),
            defineField({name: 'title', type: 'string', validation: (rule) => rule.required()}),
            defineField({
              name: 'body',
              type: 'text',
              rows: 4,
              description: 'What happens in this step. Shown on both pages.',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'output',
              type: 'text',
              rows: 3,
              description: 'What you walk away with. /process/ only.',
            }),
            defineField({
              name: 'note',
              type: 'string',
              description: 'An aside under the step. /process/ only.',
            }),
          ],
          preview: {
            select: {n: 'n', title: 'title'},
            prepare: ({n, title}) => ({title: [n, title].filter(Boolean).join('. ')}),
          },
        }),
      ],
    }),
    defineField({
      name: 'homeFaqs',
      type: 'array',
      title: 'Homepage FAQ',
      description:
        'The objection set immediately before the homepage’s closing ask, and the source of the page’s FAQPage structured data — so an answer here can appear in a search result, not just on the page. The first answer carries the only price on the site; keep it in step with the packages price band. Answers are plain text: they render both into HTML and into JSON-LD, and markup would reach the second as literal characters.',
      of: [defineArrayMember({type: 'faqItem'})],
    }),
  ],
})
