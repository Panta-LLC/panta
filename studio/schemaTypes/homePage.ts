import {defineField, defineType, defineArrayMember} from 'sanity'

export default defineType({
  name: 'homePage',
  type: 'document',
  title: 'What We Do Page (/what-we-do)',
  fields: [
    defineField({name: 'heroLabel', type: 'string', title: 'Hero Label'}),
    defineField({name: 'heroTitle', type: 'string', title: 'Hero Title'}),
    defineField({name: 'heroLede', type: 'text', title: 'Hero Lede'}),
    defineField({
      name: 'verbCards',
      type: 'array',
      title: 'Verb Cards',
      of: [
        defineArrayMember({name: 'labeledCard', type: 'labeledCard', title: 'Card'}),
      ],
    }),
    defineField({name: 'practicesLabel', type: 'string', title: 'Practices Label'}),
    defineField({name: 'practiceTitle', type: 'string', title: 'Practice Title'}),
    defineField({name: 'practiceLede', type: 'text', title: 'Practice Lede'}),
    defineField({
      name: 'practiceChecklist',
      type: 'array',
      title: 'Practice Checklist',
      of: [
        defineArrayMember({name: 'labeledCard', type: 'labeledCard', title: 'Card'}),
      ],
    }),
    defineField({name: 'practiceCtaLabel', type: 'string', title: 'Practice Cta Label'}),
    defineField({
      name: 'comingCards',
      type: 'array',
      title: 'Coming Cards',
      of: [
        defineArrayMember({name: 'labeledCard', type: 'labeledCard', title: 'Card'}),
      ],
    }),
    defineField({name: 'practicesNote', type: 'string', title: 'Practices Note'}),
    defineField({name: 'rippleTitle', type: 'string', title: 'Ripple Title'}),
    defineField({name: 'rippleLede', type: 'text', title: 'Ripple Lede'}),
    defineField({name: 'rippleCtaLabel', type: 'string', title: 'Ripple Cta Label'}),
  ],
})
