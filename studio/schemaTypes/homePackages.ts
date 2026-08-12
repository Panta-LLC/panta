import {defineField, defineType} from 'sanity'

/**
 * The header of the homepage packages section (§1.5) — the "Where to start"
 * kicker, its heading, and the label on each card's expander.
 *
 * The CARDS themselves are `packageOffer` documents and always have been; this
 * singleton only covers the three strings that surround them, which were the
 * last hardcoded thing in that section.
 *
 * Every field is optional. The page falls back to the shipped launch copy when
 * a field — or the whole document — is missing, so an unedited Studio renders
 * exactly today's page rather than a blank kicker. Same contract as Home hero.
 */
export default defineType({
  name: 'homePackages',
  type: 'document',
  title: 'Home packages section (/)',
  fields: [
    defineField({
      name: 'kicker',
      type: 'string',
      description: 'The small line above the heading. Defaults to “Where to start”.',
    }),
    defineField({
      name: 'heading',
      type: 'string',
      description:
        'Defaults to “Ways in, each one scoped before it starts.” Keep it under about 60 characters — it is capped at 22ch wide and a long one wraps to four lines.',
    }),
    defineField({
      name: 'priceNote',
      type: 'text',
      rows: 2,
      title: 'Price band',
      description:
        'The line under the heading that says what this costs. Defaults to the same $2,000–$10,000 range the FAQ answers in full, so the two must be changed together. Basic HTML is allowed here for emphasis, e.g. <strong>.',
    }),
    defineField({
      name: 'expandLabel',
      type: 'string',
      description:
        'The label on the expander that reveals each card’s list, e.g. “What’s included”. One label for every card, so it has to read true for all of them. Defaults to “What’s included”.',
    }),
  ],
  preview: {
    select: {kicker: 'kicker', heading: 'heading'},
    prepare: ({kicker, heading}) => ({
      title: kicker || 'Where to start',
      subtitle: heading || 'Ways in, each one scoped before it starts.',
    }),
  },
})
