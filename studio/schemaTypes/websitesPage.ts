import {defineField, defineType, defineArrayMember} from 'sanity'

export default defineType({
  name: 'websitesPage',
  type: 'document',
  title: 'Websites & Web Channels',
  fields: [
    defineField({name: 'heroLabel', type: 'string', title: 'Hero Label'}),
    defineField({name: 'heroTitle', type: 'string', title: 'Hero Title'}),
    defineField({name: 'heroLede', type: 'text', title: 'Hero Lede'}),
    defineField({name: 'proofLabel', type: 'string', title: 'Proof Label'}),
    defineField({name: 'workLabel', type: 'string', title: 'Work Label'}),
    defineField({name: 'workTitle', type: 'string', title: 'Work Title'}),
    defineField({name: 'moreCardTitle', type: 'string', title: 'More Card Title'}),
    defineField({name: 'moreCardBody', type: 'text', title: 'More Card Body'}),
    defineField({name: 'moreCardLinkLabel', type: 'string', title: 'More Card Link Label'}),
    defineField({name: 'buildLabel', type: 'string', title: 'Build Label'}),
    defineField({name: 'buildTitle', type: 'string', title: 'Build Title'}),
    defineField({
      name: 'buildCards',
      type: 'array',
      title: 'Build Cards',
      of: [
        defineArrayMember({name: 'labeledCard', type: 'labeledCard', title: 'Card'}),
      ],
    }),
    defineField({name: 'pivotLabel', type: 'string', title: 'Pivot Label'}),
    defineField({name: 'pivotTitle', type: 'string', title: 'Pivot Title'}),
    defineField({name: 'pivotLede', type: 'text', title: 'Pivot Lede'}),
    defineField({name: 'pivotIntro', type: 'string', title: 'Pivot Intro'}),
    defineField({
      name: 'pivotChecklist',
      type: 'array',
      title: 'Pivot Checklist',
      of: [
        defineArrayMember({name: 'labeledCard', type: 'labeledCard', title: 'Card'}),
      ],
    }),
    defineField({name: 'pivotCtaLabel', type: 'string', title: 'Pivot Cta Label'}),
    defineField({name: 'processLabel', type: 'string', title: 'Process Label'}),
    defineField({name: 'processTitle', type: 'string', title: 'Process Title'}),
    defineField({name: 'processBody', type: 'text', title: 'Process Body'}),
    defineField({name: 'processLinkLabel', type: 'string', title: 'Process Link Label'}),
    defineField({name: 'faqLabel', type: 'string', title: 'Faq Label'}),
    defineField({name: 'faqTitle', type: 'string', title: 'Faq Title'}),
    defineField({
      name: 'faqs',
      type: 'array',
      title: 'Faqs',
      of: [
        defineArrayMember({name: 'faqItem', type: 'faqItem', title: 'FAQ'}),
      ],
    }),
    defineField({name: 'ctaNote', type: 'string', title: 'Cta Note'}),
  ],
})
