import {defineField, defineType, defineArrayMember} from 'sanity'

export default defineType({
  name: 'contactPage',
  type: 'document',
  title: 'Contact Page',
  fields: [
    defineField({name: 'heroLabel', type: 'string', title: 'Hero Label'}),
    defineField({name: 'heroTitle', type: 'string', title: 'Hero Title'}),
    defineField({name: 'heroLede', type: 'text', title: 'Hero Lede'}),
    defineField({name: 'heroCtaLabel', type: 'string', title: 'Hero Cta Label'}),
    defineField({name: 'quoteHeroLabel', type: 'string', title: 'Quote Hero Label', description: 'Shown instead when arriving from a "Get a quote" CTA (/contact/?quote=1)'}),
    defineField({name: 'quoteHeroTitle', type: 'string', title: 'Quote Hero Title'}),
    defineField({name: 'quoteHeroLede', type: 'text', title: 'Quote Hero Lede'}),
    defineField({name: 'emailLabel', type: 'string', title: 'Email Label'}),
    defineField({name: 'nextLabel', type: 'string', title: 'Next Label'}),
    defineField({
      name: 'nextItems',
      type: 'array',
      title: 'Next Items',
      of: [
        defineArrayMember({name: 'text', type: 'text'}),
      ],
    }),
  ],
})
