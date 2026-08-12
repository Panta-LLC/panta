import {defineField, defineType} from 'sanity'

/**
 * Editable copy for the homepage hero (panta-homepage-copy.md §1).
 *
 * Named `homeHero`, not `homePage` — that type already exists and renders
 * /what-we-do/. The rest of the homepage stays in code by design: the build
 * brief's §6 schema puts only the dynamic slots in the CMS. The hero is the
 * exception because the copy deck lists alternate headlines for testing, and
 * testing shouldn't require a deploy.
 *
 * Every field is optional. `src/pages/index.astro` falls back to the launch
 * copy from the deck, so an empty or missing document renders the shipped page
 * rather than a blank hero.
 */
export default defineType({
  name: 'homeHero',
  type: 'document',
  title: 'Home hero (/)',
  fields: [
    defineField({
      name: 'headline',
      type: 'text',
      rows: 2,
      description:
        'The claim. Wrap a phrase in *asterisks* to set it in the accent colour. Deck alternates worth testing: "Meaningful work deserves to be found." · "You do the work that matters. We make sure it lands." · "Built for the organizations holding communities together."',
    }),
    defineField({
      name: 'subhead',
      type: 'text',
      rows: 3,
      description: 'One sentence under the headline.',
    }),
    defineField({
      name: 'ctaLabel',
      type: 'string',
      description:
        'Buttons describe, copy brands — this must pass the no-context test. Never "Pulse Check"; the brand name belongs in the microcopy below.',
    }),
    defineField({
      name: 'ctaMicrocopy',
      type: 'string',
      description: 'The line under the button, where the Pulse Check name lives.',
    }),
    defineField({
      name: 'riskReversal',
      type: 'string',
      description: 'The one-line answer to "what does this cost me", directly under the button.',
    }),
    defineField({
      name: 'secondaryLabel',
      type: 'string',
      description: 'The quiet text link beside the button.',
    }),
    defineField({
      name: 'trustedByLabel',
      type: 'string',
      description: 'The small label above the client line.',
    }),
    defineField({
      name: 'trustedBy',
      type: 'text',
      rows: 2,
      description: 'Client names. Each line break renders as a line break.',
    }),
  ],
  preview: {
    select: {title: 'headline'},
    prepare: ({title}) => ({title: title ?? 'Home hero', subtitle: '/'}),
  },
})
