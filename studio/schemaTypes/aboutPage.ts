import {defineField, defineType, defineArrayMember} from 'sanity'

export default defineType({
  name: 'aboutPage',
  type: 'document',
  title: 'About Page',
  fields: [
    defineField({name: 'heroLabel', type: 'string', title: 'Hero Label'}),
    defineField({name: 'heroTitle', type: 'string', title: 'Hero Title'}),
    defineField({name: 'heroLede', type: 'text', title: 'Hero Lede'}),
    defineField({name: 'believeLabel', type: 'string', title: 'Believe Label'}),
    defineField({name: 'believeTitle', type: 'string', title: 'Believe Title'}),
    defineField({name: 'believeBody1', type: 'text', title: 'Believe Body 1'}),
    defineField({name: 'believeBody2', type: 'text', title: 'Believe Body 2'}),
    defineField({name: 'doLabel', type: 'string', title: 'Do Label'}),
    defineField({
      name: 'doItems',
      type: 'array',
      title: 'Do Items',
      of: [
        defineArrayMember({name: 'labeledCard', type: 'labeledCard', title: 'Card'}),
      ],
    }),
    defineField({name: 'doNote', type: 'text', title: 'Do Note'}),
    defineField({name: 'rippleTitle', type: 'string', title: 'Ripple Title'}),
    defineField({name: 'rippleLede', type: 'text', title: 'Ripple Lede'}),
    defineField({name: 'auditLabel', type: 'string', title: 'Audit Label'}),
    defineField({name: 'auditTitle', type: 'string', title: 'Audit Title'}),
    defineField({name: 'auditBody', type: 'text', title: 'Audit Body'}),
    defineField({name: 'auditCtaLabel', type: 'string', title: 'Audit Cta Label'}),
  ],
})
