import {defineField, defineType, defineArrayMember} from 'sanity'

export default defineType({
  name: 'project',
  type: 'document',
  title: 'Client Project / Case Study',
  fields: [
    defineField({
      name: 'client',
      type: 'reference',
      to: [{type: 'client'}],
      description:
        'Who this was for. The Client Profile owns the org’s name, sector and logo — the two fields below are the older free-text copies, kept because existing pages still read them. Set both to match while that is true.',
    }),
    defineField({name: 'name', type: 'string'}),
    defineField({name: 'clientType', type: 'string', description: 'e.g. Nonprofit, Independent practice, Small business'}),
    defineField({name: 'slug', type: 'slug', description: 'Gives this project its own case study page at /work/<slug>/. Leave empty to show as a card only.'}),
    defineField({name: 'year', type: 'string'}),
    defineField({name: 'url', type: 'url', description: 'Live site, if shareable'}),
    defineField({name: 'order', type: 'number', description: 'Sort order (lowest first)'}),
    defineField({name: 'featured', type: 'boolean', description: 'Show on the Websites page'}),
    defineField({name: 'thumbnail', type: 'string', description: 'Path to card image, e.g. /work/name-thumb.webp'}),
    defineField({name: 'image', type: 'string', description: 'Path to full-width case study image'}),
    defineField({name: 'imageAlt', type: 'string'}),
    defineField({name: 'summary', type: 'text', description: 'One or two sentences shown on the work card'}),
    defineField({name: 'situation', type: 'text', description: 'Short situation line (legacy card field)'}),
    defineField({
      name: 'contributions',
      type: 'array',
      description:
        'Short service tags shown on cards. FREE TEXT — descriptive only. It does not join to anything, so it cannot filter /work/ or link to a service page; use "Services demonstrated" below for that.',
      of: [
        defineArrayMember({type: 'string'}),
      ],
    }),
    defineField({
      name: 'services',
      type: 'array',
      title: 'Services demonstrated',
      of: [defineArrayMember({type: 'reference', to: [{type: 'service'}]})],
      description:
        'Which services this project is evidence for. Load-bearing in two places (journey-redesign.md §5.6): it builds the filter row on /work/, and it is how a case study page ends by pointing at the service it demonstrates instead of only at the review. Set it on every project — a project with none is invisible to both.',
    }),
    defineField({name: 'outcome', type: 'text', description: 'Short outcome line shown on cards'}),
    defineField({name: 'challengeLabel', type: 'string'}),
    defineField({name: 'challengeTitle', type: 'string'}),
    defineField({name: 'challengeBody', type: 'text'}),
    defineField({name: 'approachLabel', type: 'string'}),
    defineField({name: 'approachTitle', type: 'string'}),
    defineField({
      name: 'approachItems',
      type: 'array',
      of: [
        defineArrayMember({type: 'labeledCard'}),
      ],
    }),
    defineField({name: 'outcomeLabel', type: 'string'}),
    defineField({name: 'outcomeTitle', type: 'string'}),
    defineField({name: 'outcomeBody', type: 'text'}),
    defineField({name: 'quote', type: 'text'}),
    defineField({name: 'quoteAuthor', type: 'string'}),
    defineField({name: 'quoteRole', type: 'string'}),
    defineField({name: 'articleUrl', type: 'url', description: 'Optional deeper write-up elsewhere'}),
    defineField({name: 'articleLabel', type: 'string'}),
  ],
})
