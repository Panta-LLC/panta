import {defineField, defineType} from 'sanity'

/**
 * The contact page.
 *
 * Rewritten to journey-redesign.md §5.5: it used to SELL the review — a hero
 * button to /consultation/, a "what happens next" list promising to schedule
 * the call and then recommend the Digital Presence Plan, and a `?quote=1` mode
 * that swapped three lines of hero copy to impersonate a quote form. All of
 * that is stated on the pages that own it, and here it was answering a question
 * nobody on this page had asked.
 *
 * What the template renders now is the three fields below plus the address, a
 * three-door chooser, and a note form. FIELDS DELIBERATELY REMOVED from this
 * schema, whose values may still exist in the document and are simply not read:
 *
 *   heroCtaLabel                              — the hero has no button now
 *   quoteHeroLabel/Title/Lede                 — /quote/ is a real page
 *   nextLabel, nextItems                      — "what happens next" is the
 *                                               review page's job
 *
 * They are dropped rather than deprecated in place: a field visible in the
 * Studio that reaches no page is worse than a missing one, because someone will
 * eventually edit it and wonder why nothing changed.
 */
export default defineType({
  name: 'contactPage',
  type: 'document',
  title: 'Contact Page',
  fields: [
    defineField({name: 'heroLabel', type: 'string', title: 'Hero Label'}),
    defineField({name: 'heroTitle', type: 'string', title: 'Hero Title'}),
    defineField({
      name: 'heroLede',
      type: 'text',
      title: 'Hero Lede',
      description:
        'One sentence. Do not pitch the review here — the chooser directly below it offers all three doors, and a pitch above a chooser is a thumb on the scale.',
    }),
  ],
})
