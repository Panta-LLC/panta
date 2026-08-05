import {defineField, defineType, defineArrayMember} from 'sanity'

export default defineType({
  name: 'webStrategyPage',
  type: 'document',
  title: 'Web Strategy & Development (practice hub)',
  fields: [
    defineField({name: 'heroLabel', type: 'string', title: 'Hero Label'}),
    defineField({name: 'heroTitle', type: 'string', title: 'Hero Title'}),
    defineField({name: 'heroLede', type: 'text', title: 'Hero Lede'}),
    defineField({name: 'servicesLabel', type: 'string', title: 'Services Label'}),
    defineField({name: 'servicesTitle', type: 'string', title: 'Services Title'}),
    defineField({name: 'servicesIntro', type: 'text', title: 'Services Intro'}),
    defineField({
      name: 'services',
      type: 'array',
      title: 'Services',
      of: [
        defineArrayMember({name: 'labeledCard', type: 'labeledCard', title: 'Card'}),
      ],
    }),
    defineField({name: 'proofNote', type: 'string', title: 'Proof Note', description: 'Line pointing to client work, under the services'}),
    defineField({name: 'proofLinkLabel', type: 'string', title: 'Proof Link Label'}),
    defineField({name: 'arcLabel', type: 'string', title: 'Arc Label'}),
    defineField({name: 'arcTitle', type: 'string', title: 'Arc Title'}),
    defineField({name: 'arcIntro', type: 'text', title: 'Arc Intro'}),
    defineField({
      name: 'arcCards',
      type: 'array',
      title: 'Arc Cards',
      of: [
        defineArrayMember({name: 'labeledCard', type: 'labeledCard', title: 'Card'}),
      ],
    }),
    defineField({name: 'processLabel', type: 'string', title: 'Process Label'}),
    defineField({name: 'processTitle', type: 'string', title: 'Process Title'}),
    defineField({
      name: 'steps',
      type: 'array',
      title: 'Steps',
      of: [
        defineArrayMember({name: 'labeledCard', type: 'labeledCard', title: 'Card'}),
      ],
    }),
    defineField({name: 'aboutNote', type: 'string', title: 'About Note', description: 'Credibility line in the process section'}),
    defineField({name: 'aboutLinkLabel', type: 'string', title: 'About Link Label'}),
    defineField({name: 'ctaNote', type: 'string', title: 'Cta Note'}),
  ],
})
