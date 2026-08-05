import {defineField, defineType, defineArrayMember} from 'sanity'

/**
 * A Pulse piece (PULSE-HOME-BUILD.md §6). Two shapes share this type:
 *
 *  - `essay`  — dated, appears in category rails and the homepage strip
 *  - `guide`  — evergreen how-to. Date is NEVER displayed (§5b); `lastReviewed`
 *               is internal freshness tracking only.
 *
 * Replaces the interim `article` type, which existed only so the CLI could
 * publish before this Studio was reconstructed.
 */
export default defineType({
  name: 'post',
  type: 'document',
  title: 'Pulse post',
  fields: [
    defineField({name: 'title', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'title', maxLength: 80},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'standfirst',
      type: 'text',
      rows: 3,
      description: 'Magazine deck — the line under the headline. Separate from the SEO description.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'seoDescription',
      type: 'text',
      rows: 2,
      description: 'Meta description. If empty, the standfirst is used.',
    }),
    defineField({
      name: 'category',
      type: 'reference',
      to: [{type: 'category'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'contentType',
      type: 'string',
      options: {list: ['essay', 'guide'], layout: 'radio'},
      initialValue: 'essay',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      type: 'datetime',
      description: 'Guides do not display this, but it still orders them.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'lastReviewed',
      type: 'datetime',
      description: 'Internal freshness tracking, especially for guides. Never rendered.',
    }),
    defineField({name: 'author', type: 'reference', to: [{type: 'author'}]}),
    defineField({name: 'heroImage', type: 'image', options: {hotspot: true}}),
    defineField({
      name: 'body',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'Heading', value: 'h2'},
            {title: 'Subheading', value: 'h3'},
            {title: 'Pull quote', value: 'blockquote'},
          ],
          lists: [{title: 'Bullet', value: 'bullet'}, {title: 'Numbered', value: 'number'}],
          marks: {decorators: [{title: 'Emphasis', value: 'em'}, {title: 'Strong', value: 'strong'}]},
        }),
        defineArrayMember({type: 'image', options: {hotspot: true}}),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'featured',
      type: 'boolean',
      description:
        'Drives the Pulse index featured slot. Editor-picked, not newest. If several are flagged the most recent wins.',
      initialValue: false,
    }),
    defineField({
      name: 'clients',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'client'}]})],
      description:
        'Organizations this piece is about or draws on. Not displayed by the article template — it exists so a client’s work, quotes and writing can be gathered from one record, and so a piece naming a client can be found before that client is mentioned publicly.',
    }),
    defineField({
      name: 'related',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'post'}]})],
      description: 'Optional manual override for "Keep reading". Falls back to same-category recent.',
      validation: (rule) => rule.max(2),
    }),
  ],
  orderings: [
    {
      name: 'publishedDesc',
      title: 'Newest first',
      by: [{field: 'publishedAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {title: 'title', cat: 'category.name', type: 'contentType', featured: 'featured', media: 'heroImage'},
    prepare: ({title, cat, type, featured, media}) => ({
      title,
      subtitle: [featured ? '★ Featured' : null, cat, type].filter(Boolean).join(' · '),
      media,
    }),
  },
})
