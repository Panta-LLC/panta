import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'workPage',
  type: 'document',
  title: 'Client Work Page',
  fields: [
    defineField({name: 'heroLabel', type: 'string', title: 'Hero Label'}),
    defineField({name: 'heroTitle', type: 'string', title: 'Hero Title'}),
    defineField({name: 'heroLede', type: 'text', title: 'Hero Lede'}),
    defineField({name: 'footNote', type: 'string', title: 'Foot Note'}),
    defineField({name: 'footLinkLabel', type: 'string', title: 'Foot Link Label'}),
    defineField({name: 'ctaTitle', type: 'string', title: 'Cta Title'}),
    defineField({name: 'ctaLede', type: 'text', title: 'Cta Lede'}),
    defineField({name: 'ctaPrimaryLabel', type: 'string', title: 'Cta Primary Label'}),
    defineField({name: 'ctaSecondaryLabel', type: 'string', title: 'Cta Secondary Label'}),
  ],
})
