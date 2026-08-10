import {defineArrayMember, defineType} from 'sanity'

/**
 * The two rich-text shapes package copy is written in.
 *
 * Both are deliberately NARROWER than `post.body`. An article is the deep end
 * of the site and can carry headings, quotes and images; these fields render
 * inside a card, a hero, or a CTA panel whose type scale is fixed by the design
 * — an h2 dropped into a homepage card has nowhere to go but through it. The
 * editor only offers what the page can actually render, so nothing an editor
 * can do in the Studio produces a page that looks broken.
 *
 * Link annotations are here because they are the reason a plain string was not
 * enough: emphasis and a link inside a sentence are what "make it WYSIWYG"
 * asks for. The site sanitises hrefs at render time (see lib/portable.js) —
 * the schema does not, since a validated field still gets edited later.
 */

/** Prose: paragraphs with inline emphasis and links. No headings, no lists. */
export const richText = defineType({
  name: 'richText',
  type: 'array',
  title: 'Rich text',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [{title: 'Normal', value: 'normal'}],
      lists: [],
      marks: {
        decorators: [
          {title: 'Emphasis', value: 'em'},
          {title: 'Strong', value: 'strong'},
        ],
        annotations: [
          {
            name: 'link',
            type: 'object',
            title: 'Link',
            fields: [
              {
                name: 'href',
                type: 'url',
                title: 'URL',
                description:
                  'An internal path (/services/) or a full https:// address. Anything else is dropped at render time rather than published as a live link.',
                validation: (rule) =>
                  rule.uri({allowRelative: true, scheme: ['http', 'https', 'mailto', 'tel']}),
              },
            ],
          },
        ],
      },
    }),
  ],
})

/** A list: one bullet per line, same inline marks. Rendered with the design's
 *  own markers, so the bullet style chosen here is structure, not decoration. */
export const richList = defineType({
  name: 'richList',
  type: 'array',
  title: 'Rich list',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [{title: 'Normal', value: 'normal'}],
      lists: [{title: 'Bullet', value: 'bullet'}],
      marks: {
        decorators: [
          {title: 'Emphasis', value: 'em'},
          {title: 'Strong', value: 'strong'},
        ],
        annotations: [
          {
            name: 'link',
            type: 'object',
            title: 'Link',
            fields: [
              {
                name: 'href',
                type: 'url',
                title: 'URL',
                validation: (rule) =>
                  rule.uri({allowRelative: true, scheme: ['http', 'https', 'mailto', 'tel']}),
              },
            ],
          },
        ],
      },
    }),
  ],
})
