import {defineField, defineType, defineArrayMember} from 'sanity'

export default defineType({
  name: 'planPage',
  type: 'document',
  title: 'Digital Presence Plan',
  fields: [
    defineField({name: 'heroLabel', type: 'string', title: 'Hero Label'}),
    defineField({name: 'heroTitle', type: 'string', title: 'Hero Title'}),
    defineField({name: 'heroLede', type: 'text', title: 'Hero Lede'}),
    defineField({name: 'stepOneLabel', type: 'string', title: 'Step One Label'}),
    defineField({name: 'stepOneTitle', type: 'string', title: 'Step One Title'}),
    defineField({name: 'stepOneBody', type: 'text', title: 'Step One Body'}),
    defineField({name: 'fragmentsLabel', type: 'string', title: 'Fragments Label'}),
    defineField({name: 'fragmentsTitle', type: 'string', title: 'Fragments Title'}),
    defineField({name: 'fragmentsBody', type: 'text', title: 'Fragments Body'}),
    defineField({name: 'deliverablesLabel', type: 'string', title: 'Deliverables Label'}),
    defineField({name: 'deliverablesTitle', type: 'string', title: 'Deliverables Title'}),
    defineField({
      name: 'deliverables',
      type: 'array',
      title: 'Deliverables',
      of: [
        defineArrayMember({name: 'labeledCard', type: 'labeledCard', title: 'Card'}),
      ],
    }),
    defineField({name: 'proofNote', type: 'string', title: 'Proof Note', description: 'Line pointing to client work, at the decision point'}),
    defineField({name: 'proofLinkLabel', type: 'string', title: 'Proof Link Label'}),
    defineField({name: 'timelineLabel', type: 'string', title: 'Timeline Label'}),
    defineField({name: 'timelineTitle', type: 'string', title: 'Timeline Title'}),
    defineField({
      name: 'timeline',
      type: 'array',
      title: 'Timeline',
      of: [
        defineArrayMember({
          name: 'timelineRow',
          type: 'object',
          title: 'Timeline Row',
          fields: [
            defineField({name: 'when', type: 'string', title: 'When'}),
            defineField({name: 'what', type: 'text', title: 'What'}),
          ],
        }),
      ],
    }),
    defineField({name: 'fitLabel', type: 'string', title: 'Fit Label'}),
    defineField({name: 'fitTitle', type: 'string', title: 'Fit Title'}),
    defineField({
      name: 'fits',
      type: 'array',
      title: 'Fits',
      of: [
        defineArrayMember({name: 'labeledCard', type: 'labeledCard', title: 'Card'}),
      ],
    }),
    defineField({name: 'pricingLabel', type: 'string', title: 'Pricing Label'}),
    defineField({name: 'pricingTitle', type: 'string', title: 'Pricing Title'}),
    defineField({name: 'pricingBody', type: 'text', title: 'Pricing Body'}),
    defineField({name: 'pricingCtaLabel', type: 'string', title: 'Pricing Cta Label'}),
    defineField({name: 'pricingCtaNote', type: 'string', title: 'Pricing Cta Note'}),
    defineField({name: 'pricingAfterNote', type: 'text', title: 'Pricing After Note'}),
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
