import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'faqItem',
  type: 'object',
  title: 'FAQ',
  fields: [
    defineField({name: 'q', type: 'string', title: 'Q'}),
    defineField({name: 'a', type: 'text', title: 'A'}),
  ],
})
