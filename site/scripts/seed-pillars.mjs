/**
 * Seeds the three pillar documents.
 *
 *   node scripts/seed-pillars.mjs            # dry run
 *   node scripts/seed-pillars.mjs --apply    # writes
 *
 * Uses createIfNotExists, so re-running is safe and any Studio edits survive.
 *
 * The copy below is lifted VERBATIM from the `PILLARS` literal that used to
 * live in site/src/lib/pillars.js — the homepage and the services overview
 * must render identically before and after the switch. Anything you want to
 * change, change in the Studio after seeding, not here.
 *
 * `pillarId` is the load-bearing bit: it is the value every service document's
 * `pillar` field holds, and what lib/pillars.js groups on. The three values
 * are fixed (digital / strategic / creative) and the Studio blocks creating a
 * fourth — see studio/sanity.config.ts.
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

const PILLARS = [
  {
    id: 'digital',
    order: 1,
    kicker: 'Digital',
    head: 'Get found.',
    lede: 'Your web presence should work as hard as you do.',
    bullets: [
      'Websites that are fast, clear, and easy to update',
      'Web development that doesn’t require a full-time engineer',
      'Photo and video that shows your work honestly',
    ],
  },
  {
    id: 'strategic',
    order: 2,
    kicker: 'Strategic',
    head: 'Run smoother.',
    lede: 'Less duct tape, more breathing room.',
    bullets: [
      'A map of where the hours actually go — and which ones are worth buying back',
      'The right tools, set up the right way — no bloat',
      'Systems your whole team can actually use',
    ],
  },
  {
    id: 'creative',
    order: 3,
    kicker: 'Creative',
    head: 'Be remembered.',
    lede: 'People don’t remember services. They remember stories.',
    bullets: [
      'Storytelling that makes your mission felt, not just stated',
      'Content people actually want to read and share',
      'Brand design that looks like who you are',
    ],
  },
]

const docs = PILLARS.map((p) => ({
  _id: `pillar-${p.id}`,
  _type: 'pillar',
  pillarId: p.id,
  order: p.order,
  kicker: p.kicker,
  head: p.head,
  lede: p.lede,
  bullets: p.bullets,
}))

const existing = new Set(await client.fetch('*[_type == "pillar"]._id'))

console.log('\nSeed pillars\n')
for (const d of docs) {
  console.log(`  ${existing.has(d._id) ? 'exists      ' : 'WILL CREATE '} ${d._id}  (${d.head})`)
}
const todo = docs.filter((d) => !existing.has(d._id))
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
