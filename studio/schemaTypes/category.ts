import {defineField, defineType} from 'sanity'

/**
 * Pulse categories — Signal, Flow, Voice (PULSE-HOME-BUILD.md §6).
 *
 * `bridgeCopy` is load-bearing: it is the end-of-article funnel (§5b), the one
 * place an article converts. Guides are a contentType on `post`, not a
 * category, so they inherit whichever category they are filed under.
 */
export default defineType({
  name: 'category',
  type: 'document',
  title: 'Pulse category',
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      description: 'Signal | Flow | Voice',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'name'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'gloss',
      type: 'string',
      description:
        'Renders in muted text after the name at EVERY appearance — "being found" | "running smoother" | "telling the story".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'pillar',
      type: 'string',
      description: 'Which homepage service pillar this maps to.',
      options: {list: ['digital', 'strategic', 'creative']},
    }),
    defineField({
      name: 'bridgeCopy',
      type: 'text',
      rows: 4,
      description:
        'The end-of-article CTA paragraph — the funnel lives here. Followed by a text link, never a button.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'order',
      type: 'number',
      description: 'Display order in the category nav and section rails.',
    }),
  ],
  preview: {
    select: {title: 'name', subtitle: 'gloss'},
  },
})
