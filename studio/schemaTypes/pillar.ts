import {defineField, defineType, defineArrayMember} from 'sanity'

/**
 * One of the three pillars — Digital, Strategic, Creative.
 *
 * A FIXED SET, not an open collection: there are exactly three, and
 * `pillarId` is the value every service document points at. The Studio config
 * blocks creating, duplicating and deleting these for that reason — a fourth
 * pillar would render a fourth homepage column with no services under it, and
 * a deleted one would orphan every service assigned to it.
 *
 * What lives here is the pillar's CHROME (kicker, head, lede, bullets). The
 * grouping itself is still `service.pillar`, a string enum on the service —
 * these documents supply the copy that wraps each group, not the taxonomy.
 */
export default defineType({
  name: 'pillar',
  type: 'document',
  title: 'Pillar',
  fields: [
    defineField({
      name: 'pillarId',
      type: 'string',
      title: 'Pillar',
      description:
        'LOAD-BEARING: services are grouped by this value. It must match the pillar chosen on the service documents — changing it empties this pillar’s column.',
      options: {
        list: [
          {title: 'Digital', value: 'digital'},
          {title: 'Strategic', value: 'strategic'},
          {title: 'Creative', value: 'creative'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'order',
      type: 'number',
      description: 'Reading order across the whole site — homepage columns, services overview, nav.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'kicker',
      type: 'string',
      description: 'The mono label above the heading ("Digital"). Rendered uppercase.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'head',
      type: 'string',
      description:
        'The outcome, as a sentence ("Get found."). Keep the period — the services overview strips it to build the gloss line on service pages.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'lede',
      type: 'text',
      rows: 2,
      description: 'One line under the heading. Two at most — it sits in a narrow column.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'bullets',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      description:
        'What this pillar covers, in plain language. Homepage only. Three is the designed count; four still reads, more will not.',
      validation: (rule) => rule.min(1).max(4),
    }),
  ],
  orderings: [
    {name: 'order', title: 'Reading order', by: [{field: 'order', direction: 'asc'}]},
  ],
  preview: {
    select: {title: 'head', kicker: 'kicker', order: 'order'},
    prepare: ({title, kicker, order}) => ({
      title: `${kicker} — ${title}`,
      subtitle: `Pillar ${order}`,
    }),
  },
})
