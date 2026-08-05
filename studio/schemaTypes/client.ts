import {defineField, defineType} from 'sanity'

/**
 * An organization Panta has worked with — the single record of who they are,
 * referenced from everywhere they appear rather than retyped.
 *
 * Before this type, a client existed as free text in three unrelated places:
 * `project.name` + `project.clientType`, the org named in `testimonial.role`,
 * and (eventually) a logo file uploaded to the trust bar with no idea which
 * project it belonged to. Renaming a client meant finding all of them.
 *
 * The logo lives here for the same reason: it is a property of the org, not of
 * the homepage. `logoApproved` gates whether it may be shown publicly — the
 * trust bar query filters on it, so an uploaded-but-uncleared logo cannot leak
 * into the page by someone dragging a reference into Site Settings.
 */
export default defineType({
  name: 'client',
  type: 'document',
  title: 'Client Profile',
  groups: [
    {name: 'identity', title: 'Identity', default: true},
    {name: 'logo', title: 'Logo & permission'},
    {name: 'relationship', title: 'Relationship'},
  ],
  fields: [
    // ---------------------------------------------------------- identity --
    defineField({
      name: 'name',
      type: 'string',
      group: 'identity',
      description: 'The org’s own name, spelled the way they spell it.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      group: 'identity',
      options: {source: 'name', maxLength: 60},
      description:
        'Stable handle for this client. Nothing routes to it yet — it exists so a client index or /clients/<slug> page can be added later without re-keying content.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'sector',
      type: 'string',
      group: 'identity',
      description:
        'Matches the free-text values already used in project.clientType, so the two agree while projects are migrated over.',
      options: {
        list: [
          'Nonprofit',
          'Independent practice',
          'Small business',
          'Community organization',
          'Public agency',
        ],
      },
    }),
    defineField({
      name: 'location',
      type: 'string',
      group: 'identity',
      description: 'e.g. Stockton, CA',
    }),
    defineField({
      name: 'url',
      type: 'url',
      group: 'identity',
      description: 'Their site, if it is theirs to link to.',
    }),
    defineField({
      name: 'summary',
      type: 'text',
      rows: 2,
      group: 'identity',
      description: 'One or two sentences on what they do. Used where a client is introduced.',
    }),

    // -------------------------------------------------------------- logo --
    defineField({
      name: 'logo',
      type: 'image',
      group: 'logo',
      options: {hotspot: false},
      description:
        'SVG or transparent PNG. The trust bar renders these at a single height, so wordmarks read better than stacked lockups.',
      fields: [
        defineField({
          name: 'alt',
          type: 'string',
          description: 'Falls back to the client name if empty.',
        }),
      ],
    }),
    defineField({
      name: 'logoApproved',
      type: 'boolean',
      group: 'logo',
      initialValue: false,
      description:
        'Do we have their permission to show this logo publicly? Off means the logo never renders, no matter where the client is referenced.',
      validation: (rule) =>
        rule
          .custom((approved, context) =>
            (context.document as {logo?: unknown} | undefined)?.logo && !approved
              ? 'Logo uploaded but not cleared for public use — it will not render anywhere on the site until this is on.'
              : true
          )
          .warning(),
    }),

    // ------------------------------------------------------ relationship --
    defineField({
      name: 'relationship',
      type: 'string',
      group: 'relationship',
      initialValue: 'current',
      options: {
        list: [
          {title: 'Current client', value: 'current'},
          {title: 'Past client', value: 'past'},
          {title: 'Partner / collaborator', value: 'partner'},
          {title: 'Pro bono', value: 'probono'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'since',
      type: 'string',
      group: 'relationship',
      description: 'Year the work started, e.g. 2024.',
    }),
    defineField({
      name: 'order',
      type: 'number',
      group: 'relationship',
      description: 'Sort order in client lists (lowest first). The trust bar uses its own order.',
    }),
  ],
  orderings: [
    {name: 'manual', title: 'Manual order', by: [{field: 'order', direction: 'asc'}]},
    {name: 'nameAsc', title: 'Name A–Z', by: [{field: 'name', direction: 'asc'}]},
  ],
  preview: {
    select: {title: 'name', sector: 'sector', relationship: 'relationship', media: 'logo'},
    prepare: ({title, sector, relationship, media}) => ({
      title,
      subtitle: [sector, relationship === 'current' ? null : relationship].filter(Boolean).join(' · '),
      media,
    }),
  },
})
