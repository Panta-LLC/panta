import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'author',
  type: 'document',
  title: 'Author',
  fields: [
    defineField({name: 'name', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'role', type: 'string'}),
    defineField({name: 'photo', type: 'image', options: {hotspot: true}}),
    defineField({name: 'shortBio', type: 'text', rows: 3}),
  ],
  preview: {select: {title: 'name', subtitle: 'role', media: 'photo'}},
})
