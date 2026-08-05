/**
 * Drafts page copy for the three services that had none.
 *
 *   node scripts/draft-service-copy.mjs            # dry run
 *   node scripts/draft-service-copy.mjs --apply    # writes
 *
 * web-presence came from the migrated Websites page and operations was written
 * during the merge; these three (media production, storytelling and content,
 * brand design) existed only as a title and a summary.
 *
 * Written to be edited in the Studio, not treated as final. Deliberately
 * contains NO metrics, NO client names, and NO capability claims beyond what
 * business-strategy.md §3 already lists — §7.4 of the build brief bans
 * invented numbers, and a drafted page is not a licence to invent them.
 *
 * setIfMissing throughout: an editor's work always wins over this draft.
 */
import {createClient} from '@sanity/client'
import {readFileSync} from 'node:fs'

const APPLY = process.argv.includes('--apply')

function tokenFromEnvFile() {
  try {
    const line = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
      .split('\n')
      .find((l) => l.trim().startsWith('SANITY_WRITE_TOKEN='))
    return line?.split('=').slice(1).join('=').trim().replace(/^["']|["']$/g, '')
  } catch {
    return undefined
  }
}

const token = process.env.SANITY_WRITE_TOKEN || tokenFromEnvFile()

const client = createClient({
  projectId: 'tdi9ql1j',
  dataset: 'pantaco',
  apiVersion: '2024-01-01',
  useCdn: false,
  token,
})

const card = (k, title, body) => ({_key: k, _type: 'labeledCard', title, body})
const faq = (k, q, a) => ({_key: k, _type: 'faqItem', q, a})

const DRAFTS = {
  'service-media-production': {
    heroTitle: 'Show the work as it actually looks.',
    heroLede:
      'Most organizations doing real work have almost no honest images of it. What they have is a logo, a stock photo, and a board headshot from four years ago — and none of it shows anyone why the work matters.',
    heroSecondaryLabel: 'See our work',
    heroSecondaryHref: '/work/',
    includesLabel: 'What this looks like',
    includesTitle: 'Shot where the work happens.',
    includes: [
      card('i1', 'Documentary photography', 'Your people, your spaces, your programs — photographed as they actually are, on a day when the work is happening.'),
      card('i2', 'Short video', 'Pieces short enough that people finish them. Usually one clear story rather than an overview of everything you do.'),
      card('i3', 'Interviews that sound like people', 'We ask questions until someone says the true thing, then cut around it. No scripts read at a camera.'),
      card('i4', 'A library, not a shoot', 'You leave with images you can use across the site, social, decks and grant applications — not twelve photos of the same handshake.'),
      card('i5', 'Consent handled properly', 'Especially where programs involve young people or vulnerable clients. Releases, permissions and the ability to withdraw are part of the process, not an afterthought.'),
      card('i6', 'Files you can actually use', 'Sized and exported for the places they are going, with the originals handed over. They are your images.'),
    ],
    faqLabel: 'Questions',
    faqTitle: 'The things people ask first.',
    faqs: [
      faq('f1', 'We are camera shy. Does this still work?', 'Usually yes, and usually better. The most useful footage tends to come from people who were doing something else and forgot the camera was there.'),
      faq('f2', 'Can you shoot around our clients’ privacy?', 'Yes — it is a normal constraint, not an obstacle. We plan the shoot around who can and cannot appear, and there is always a way to show the work without showing a face.'),
      faq('f3', 'Do we need video, or are photos enough?', 'Often photos are enough. Video is worth it when something has to be understood rather than just seen. We will say so on the call if we think you do not need it.'),
    ],
    serviceType: 'Photography and video production',
  },

  'service-storytelling': {
    heroTitle: 'Say the thing that makes people act.',
    heroLede:
      'Most mission statements describe what an organization does without ever explaining why it matters to the person reading. The work is not to write more — it is to find the true sentence and put it where people will see it.',
    heroSecondaryLabel: 'Read Pulse',
    heroSecondaryHref: '/pulse/',
    includesLabel: 'What this looks like',
    includesTitle: 'Fewer words, better placed.',
    includes: [
      card('i1', 'The core story, written down', 'What you do, who it is for, and why it matters — in language a stranger understands on first read. Everything else follows from this.'),
      card('i2', 'Website and channel copy', 'The pages and profiles people actually land on, rewritten so the next step is obvious.'),
      card('i3', 'A publishing rhythm you can keep', 'Realistic for the hours you actually have. A monthly piece you publish beats a weekly one you abandon.'),
      card('i4', 'Case studies and impact writing', 'The work you have already done, written up so funders and clients can see it.'),
      card('i5', 'Grant and appeal support', 'The same story, adapted for the people who need to read it in their format.'),
      card('i6', 'A voice your team can use', 'Written guidance simple enough that whoever posts next week still sounds like you.'),
    ],
    faqLabel: 'Questions',
    faqTitle: 'The things people ask first.',
    faqs: [
      faq('f1', 'Will this sound like us or like you?', 'Like you. Most of the work is listening to how you already talk about the work and removing what gets in the way of it.'),
      faq('f2', 'We have no time to publish anything. Is this worth it?', 'Then we build for the time you have. Sometimes the honest answer is that you need three pages that are right, not a blog.'),
      faq('f3', 'Can you help us keep it going afterwards?', 'Yes, and we would rather set you up to do it yourselves. If ongoing help makes more sense we will scope it, but it is not the default.'),
    ],
    serviceType: 'Content strategy and copywriting',
  },

  'service-brand-design': {
    heroTitle: 'Look like the organization you already are.',
    heroLede:
      'A brand is not a logo. It is whether the flyer, the website, the email and the sign on the door look like they came from the same people — and whether that impression matches the quality of the work.',
    heroSecondaryLabel: 'See our work',
    heroSecondaryHref: '/work/',
    includesLabel: 'What this looks like',
    includesTitle: 'Recognisable, not fashionable.',
    includes: [
      card('i1', 'Identity design', 'A mark, type and colour that work at the sizes you actually use — including badly photocopied and on a phone.'),
      card('i2', 'A system, not a logo file', 'How the pieces go together, so the next thing you make already matches without asking us.'),
      card('i3', 'Templates you can edit', 'Flyers, decks, social and documents in tools your team already has. Design that needs a designer to update is design you will stop using.'),
      card('i4', 'Applied to the real things', 'The website, the signage, the forms, the annual report — wherever the brand actually has to survive contact with the world.'),
      card('i5', 'Accessible by default', 'Colour contrast and type sizes that work for the people you serve, not just in the presentation.'),
      card('i6', 'Guidance short enough to read', 'A few pages someone will actually open, not a sixty-page manual.'),
    ],
    faqLabel: 'Questions',
    faqTitle: 'The things people ask first.',
    faqs: [
      faq('f1', 'We like our logo. Does it all have to change?', 'No. Quite often the logo is fine and the problem is everything around it. We will tell you honestly if a redesign is not what you need.'),
      faq('f2', 'How do we keep this consistent once you are gone?', 'That is what the templates and the short guidance are for. If your team cannot maintain it, the work has not really been done.'),
      faq('f3', 'Is a rebrand worth it for an organization our size?', 'Sometimes not — and that is a real answer we give. Book a review and we will tell you where your money is better spent.'),
    ],
    serviceType: 'Brand identity design',
  },
}

console.log('\nDraft service copy\n')
let count = 0
const tx = client.transaction()

for (const [id, fields] of Object.entries(DRAFTS)) {
  const doc = await client.fetch('*[_id == $id][0]', {id})
  if (!doc) {
    console.log(`  MISSING  ${id} — skipped`)
    continue
  }
  const missing = Object.keys(fields).filter(
    (k) => doc[k] === undefined || doc[k] === null || (Array.isArray(doc[k]) && !doc[k].length)
  )
  console.log(`  ${doc.title}`)
  console.log(`    will set: ${missing.join(', ') || '(nothing — already written)'}`)
  if (missing.length) {
    // setIfMissing, so anything already edited in the Studio survives.
    tx.patch(client.patch(id).setIfMissing(fields).set({pageReady: true}))
    count++
  }
}

console.log(`\n${count} service${count === 1 ? '' : 's'} to draft`)

if (!count) process.exit(0)
if (!APPLY) {
  console.log('\nDry run. Re-run with --apply to write.')
  process.exit(0)
}
if (!token) {
  console.error('\nNo SANITY_WRITE_TOKEN found.')
  process.exit(1)
}

await tx.commit()
console.log('\nDrafted and marked pageReady. Edit in the Studio — this is a first pass, not final copy.')
