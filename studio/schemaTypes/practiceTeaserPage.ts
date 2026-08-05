import {defineField, defineType, defineArrayMember} from 'sanity'

export default defineType({
  name: 'practiceTeaserPage',
  type: 'document',
  title: 'Practice Teaser Page',
  fields: [
    defineField({name: 'slug', type: 'slug', title: 'Slug', description: 'Route: community-programs or product-development'}),
    defineField({name: 'heroLabel', type: 'string', title: 'Hero Label'}),
    defineField({name: 'heroTitle', type: 'string', title: 'Hero Title'}),
    defineField({name: 'heroLede', type: 'text', title: 'Hero Lede'}),
    defineField({name: 'gridLabel', type: 'string', title: 'Grid Label'}),
    defineField({name: 'gridTitle', type: 'string', title: 'Grid Title'}),
    defineField({
      name: 'cards',
      type: 'array',
      title: 'Cards',
      of: [
        defineArrayMember({name: 'labeledCard', type: 'labeledCard', title: 'Card'}),
      ],
    }),
    defineField({name: 'ctaLabel', type: 'string', title: 'Cta Label'}),
    defineField({name: 'ctaTitle', type: 'string', title: 'Cta Title'}),
    defineField({name: 'ctaLede', type: 'text', title: 'Cta Lede'}),
    defineField({name: 'ctaPrimaryLabel', type: 'string', title: 'Cta Primary Label'}),
    defineField({name: 'ctaSecondaryLabel', type: 'string', title: 'Cta Secondary Label'}),
  ],
})
