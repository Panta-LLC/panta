import {defineField, defineType, defineArrayMember} from 'sanity'

export default defineType({
  name: 'consultationPage',
  type: 'document',
  title: 'Free Consultation',
  fields: [
    defineField({name: 'heroLabel', type: 'string', title: 'Hero Label'}),
    defineField({name: 'heroTitle', type: 'string', title: 'Hero Title'}),
    defineField({name: 'heroLede', type: 'text', title: 'Hero Lede'}),
    defineField({name: 'bookCtaLabel', type: 'string', title: 'Book Cta Label'}),
    defineField({name: 'bookNote', type: 'string', title: 'Book Note'}),
    defineField({name: 'panelLabel', type: 'string', title: 'Panel Label'}),
    defineField({name: 'panelSub', type: 'text', title: 'Panel Sub'}),
    defineField({
      name: 'panelNodes',
      type: 'array',
      title: 'Panel Nodes',
      of: [
        defineArrayMember({name: 'labeledCard', type: 'labeledCard', title: 'Card'}),
      ],
    }),
    defineField({name: 'panelFootTag', type: 'string', title: 'Panel Foot Tag'}),
    defineField({name: 'panelFootText', type: 'text', title: 'Panel Foot Text'}),
    defineField({name: 'proofLabel', type: 'string', title: 'Proof Label'}),
    defineField({name: 'deliverLabel', type: 'string', title: 'Deliver Label'}),
    defineField({name: 'deliverTitle', type: 'string', title: 'Deliver Title'}),
    defineField({name: 'deliverIntro', type: 'text', title: 'Deliver Intro'}),
    defineField({
      name: 'deliverCards',
      type: 'array',
      title: 'Deliver Cards',
      of: [
        defineArrayMember({name: 'labeledCard', type: 'labeledCard', title: 'Card'}),
      ],
    }),
    defineField({name: 'adsLabel', type: 'string', title: 'Ads Label'}),
    defineField({name: 'adsTitle', type: 'string', title: 'Ads Title'}),
    defineField({name: 'adsBody', type: 'text', title: 'Ads Body'}),
    defineField({name: 'adsNote', type: 'text', title: 'Ads Note'}),
    defineField({
      name: 'adsChecklist',
      type: 'array',
      title: 'Ads Checklist',
      of: [
        defineArrayMember({name: 'labeledCard', type: 'labeledCard', title: 'Card'}),
      ],
    }),
    defineField({name: 'bookingLabel', type: 'string', title: 'Booking Label'}),
    defineField({name: 'bookingTitle', type: 'string', title: 'Booking Title'}),
    defineField({name: 'bookingBody', type: 'text', title: 'Booking Body'}),
    defineField({
      name: 'trustRow',
      type: 'array',
      title: 'Trust Row',
      of: [
        defineArrayMember({name: 'string', type: 'string'}),
      ],
    }),
    defineField({name: 'escapeLabel', type: 'string', title: 'Escape Label', description: 'Escape hatch under the booking embed for visitors not ready to book'}),
    defineField({name: 'escapeLinkLabel', type: 'string', title: 'Escape Link Label'}),
    defineField({name: 'escapeHref', type: 'string', title: 'Escape Href'}),
  ],
})
