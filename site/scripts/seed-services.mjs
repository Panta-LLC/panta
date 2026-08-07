/**
 * Seeds the six service documents.
 *
 *   node scripts/seed-services.mjs            # dry run
 *   node scripts/seed-services.mjs --apply    # writes
 *
 * Uses createIfNotExists, so re-running is safe and any Studio edits survive.
 * `order` is site-wide reading order (not within-pillar). Live docs that already
 * exist are not patched here — use migrate-service-order.mjs to uniquify orders.
 *
 * CRITICAL: the slugs below are the six anchor ids currently hardcoded in
 * services.astro and targeted by the homepage hero. Seeding them verbatim is
 * what lets the overview switch from a hardcoded list to Sanity without
 * breaking a single link. The process/tools merge happens later (step D), via
 * a new document carrying both old ids in `legacyAnchors` — not by renaming
 * anything here.
 *
 * `pageReady: false` on all six: the hero keeps linking to overview anchors
 * until each page's copy is written and the flag is flipped per service.
 * Summaries are copied verbatim from services.astro so the overview renders
 * identically before and after the switch.
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

const SERVICES = [
  {
    slug: 'web-presence',
    pillar: 'digital',
    order: 1,
    title: 'Web presence and development',
    summary:
      'Websites that are fast, clear, and easy to update — built so you are not paying an engineer every time a date changes. We handle the whole front door: the site, your Google Business Profile, the directories people actually check.',
  },
  {
    slug: 'media-production',
    pillar: 'digital',
    order: 2,
    title: 'Media production',
    summary:
      'Photo and video that shows your work honestly, shot in the places you actually do it. No stock images of people who have never met you.',
  },
  {
    slug: 'process',
    pillar: 'strategic',
    order: 3,
    title: 'Process and workflow optimization',
    summary:
      'We map where the hours actually go — intake, scheduling, records, reporting — and fix the parts that are costing you the most. Usually the answer is smaller than people expect.',
  },
  {
    slug: 'tools-systems',
    pillar: 'strategic',
    order: 4,
    title: 'Tools and systems',
    summary:
      'The right tools, set up the right way, with no bloat you will never use. Where nothing off the shelf fits, we build something small that does — and show your team how to run it.',
  },
  {
    slug: 'storytelling',
    pillar: 'creative',
    order: 5,
    title: 'Storytelling and content',
    summary:
      'Writing and content that makes your mission felt, not just stated — and a publishing rhythm you can actually sustain after we leave.',
  },
  {
    slug: 'brand-design',
    pillar: 'creative',
    order: 6,
    title: 'Brand design',
    summary:
      'A look that matches who you are, applied consistently everywhere people meet you. Recognisable, not fashionable.',
  },
]

const docs = SERVICES.map((s) => ({
  _id: `service-${s.slug}`,
  _type: 'service',
  title: s.title,
  slug: {_type: 'slug', current: s.slug},
  pillar: s.pillar,
  order: s.order,
  summary: s.summary,
  pageReady: false,
  listed: true,
}))

const existing = new Set(
  await client.fetch('*[_type == "service"]._id')
)

console.log('\nSeed services\n')
const todo = docs.filter((d) => !existing.has(d._id))
for (const d of docs) {
  console.log(`  ${existing.has(d._id) ? 'exists      ' : 'WILL CREATE '} ${d._id}  (${d.pillar})`)
}
console.log(`\n${todo.length} to create · ${docs.length - todo.length} already present`)

if (!todo.length) process.exit(0)
if (!APPLY) {
  console.log('\nDry run. Re-run with --apply to write.')
  process.exit(0)
}
if (!token) {
  console.error('\nNo SANITY_WRITE_TOKEN found.')
  process.exit(1)
}

const tx = client.transaction()
todo.forEach((d) => tx.createIfNotExists(d))
await tx.commit()
console.log('\nCreated. Rebuild for these to reach the site.')
