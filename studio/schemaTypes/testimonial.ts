import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'testimonial',
  type: 'document',
  title: 'Testimonial',
  fields: [
    defineField({name: 'quote', type: 'text', title: 'Quote'}),
    defineField({name: 'author', type: 'string', title: 'Author'}),
    defineField({name: 'role', type: 'string', title: 'Role', description: 'Title and organization'}),
    defineField({
      name: 'client',
      type: 'reference',
      to: [{type: 'client'}],
      description:
        'The organization the author speaks for. `role` still carries the displayed line — this is what makes the quote findable from the client and the project.',
    }),
  ],
  preview: {
    select: {title: 'author', subtitle: 'role', media: 'client.logo'},
  },
})
