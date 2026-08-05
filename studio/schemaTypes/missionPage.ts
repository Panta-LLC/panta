import {defineField, defineType, defineArrayMember} from 'sanity'

export default defineType({
  name: 'missionPage',
  type: 'document',
  title: 'Home Page (mission story, /)',
  fields: [
    defineField({name: 'quote', type: 'text', title: 'Quote'}),
    defineField({name: 'summary', type: 'text', title: 'Summary'}),
    defineField({name: 'practicesLabel', type: 'string', title: 'Practices Label'}),
    defineField({
      name: 'practices',
      type: 'array',
      title: 'Practices',
      of: [
        defineArrayMember({name: 'labeledCard', type: 'labeledCard', title: 'Card'}),
      ],
    }),
    defineField({name: 'heroDirectLabel', type: 'string', title: 'Hero Direct Label', description: 'Shortcut under the practices list, e.g. for website-intent visitors'}),
    defineField({name: 'heroDirectHref', type: 'string', title: 'Hero Direct Href'}),
    defineField({name: 'originLabel', type: 'string', title: 'Origin Label'}),
    defineField({name: 'originTitle', type: 'string', title: 'Origin Title'}),
    defineField({name: 'originLede', type: 'text', title: 'Origin Lede'}),
    defineField({name: 'originBody', type: 'text', title: 'Origin Body'}),
    defineField({name: 'originTurn', type: 'string', title: 'Origin Turn'}),
    defineField({
      name: 'verbPanels',
      type: 'array',
      title: 'Verb Panels',
      of: [
        defineArrayMember({
          name: 'verbPanel',
          type: 'object',
          title: 'Verb Panel',
          fields: [
            defineField({name: 'num', type: 'string', title: 'Num'}),
            defineField({name: 'word', type: 'string', title: 'Word'}),
            defineField({name: 'head', type: 'string', title: 'Head'}),
            defineField({name: 'story', type: 'text', title: 'Story'}),
            defineField({
              name: 'chips',
              type: 'array',
              title: 'Chips',
              of: [
                defineArrayMember({name: 'string', type: 'string'}),
              ],
            }),
          ],
        }),
      ],
    }),
    defineField({name: 'convergeTitle', type: 'string', title: 'Converge Title'}),
    defineField({name: 'convergeLede', type: 'text', title: 'Converge Lede'}),
    defineField({name: 'primaryCtaLabel', type: 'string', title: 'Primary Cta Label'}),
    defineField({name: 'secondaryCtaLabel', type: 'string', title: 'Secondary Cta Label'}),
  ],
})
