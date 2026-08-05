/**
 * Seeds the three Pulse categories with the bridge copy from
 * PULSE-HOME-BUILD.md §6, and an author record for the byline.
 *
 *   node scripts/seed-pulse.mjs            # dry run
 *   node scripts/seed-pulse.mjs --apply    # writes
 *
 * bridgeCopy is the end-of-article funnel (§5b) — the single conversion point
 * on an article page. It is seeded here rather than typed into the Studio so
 * the launch wording is version-controlled alongside the brief it came from.
 *
 * Safe to re-run: uses createIfNotExists, so hand edits in the Studio survive.
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

const REVIEW = 'A Pulse Check is a free 30-minute review — you’ll leave with a written readout and two or three things worth doing either way.'

const CATEGORIES = [
  {
    slug: 'signal',
    name: 'Signal',
    gloss: 'being found',
    pillar: 'digital',
    order: 1,
    bridgeCopy: `If people who need your work can’t find it, that’s usually fixable. ${REVIEW}`,
  },
  {
    slug: 'flow',
    name: 'Flow',
    gloss: 'running smoother',
    pillar: 'strategic',
    order: 2,
    bridgeCopy: `If your week disappears into processes like this one, that’s usually fixable. ${REVIEW}`,
  },
  {
    slug: 'voice',
    name: 'Voice',
    gloss: 'telling the story',
    pillar: 'creative',
    order: 3,
    bridgeCopy: `If your story isn’t landing the way the work deserves, that’s usually fixable. ${REVIEW}`,
  },
]

const AUTHOR = {
  _id: 'author-damon',
  _type: 'author',
  name: 'Damon Hastings',
  role: 'Founder, Panta',
}

const docs = [
  AUTHOR,
  ...CATEGORIES.map((c) => ({
    _id: `category-${c.slug}`,
    _type: 'category',
    name: c.name,
    slug: {_type: 'slug', current: c.slug},
    gloss: c.gloss,
    pillar: c.pillar,
    order: c.order,
    bridgeCopy: c.bridgeCopy,
  })),
]

console.log('\nPulse seed\n')
for (const d of docs) console.log(`  ${d._id.padEnd(20)} ${d._type}`)
console.log(`\n${docs.length} documents`)

if (!APPLY) {
  console.log('\nDry run. Re-run with --apply to write.')
  process.exit(0)
}
if (!token) {
  console.error('\nNo SANITY_WRITE_TOKEN found.')
  process.exit(1)
}

const client = createClient({
  projectId: 'tdi9ql1j',
  dataset: 'pantaco',
  apiVersion: '2024-01-01',
  useCdn: false,
  token,
})

const tx = client.transaction()
// createIfNotExists, not createOrReplace: re-running must never clobber copy
// that has since been edited in the Studio.
for (const d of docs) tx.createIfNotExists(d)
await tx.commit()
console.log('\nSeeded. Rebuild the site to pick these up.')
