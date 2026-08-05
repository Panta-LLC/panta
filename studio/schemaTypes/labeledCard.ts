import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'labeledCard',
  type: 'object',
  title: 'Card',
  fields: [
    defineField({name: 'kicker', type: 'string', title: 'Kicker'}),
    defineField({name: 'title', type: 'string', title: 'Title'}),
    defineField({name: 'body', type: 'text', title: 'Body'}),
    defineField({name: 'href', type: 'string', title: 'Href'}),
    defineField({name: 'linkLabel', type: 'string', title: 'Link Label'}),
  ],
})
