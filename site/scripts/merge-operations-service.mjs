/**
 * Merges "Process and workflow optimization" + "Tools and systems" into one
 * service, taking the list from six to five.
 *
 *   node scripts/merge-operations-service.mjs            # dry run
 *   node scripts/merge-operations-service.mjs --apply    # writes
 *
 * They were two halves of one engagement — diagnose where the hours go, then
 * fix it with the right tools or a small custom build. Nobody shops for those
 * separately.
 *
 * The new document takes slug `operations` and carries BOTH old ids in
 * `legacyAnchors`, so /services/#process and /services/#tools-systems still
 * land on it. That matters more than it looks: a stale fragment does not 404,
 * it silently scrolls to the top of the page, so there is no error anywhere to
 * tell you a link broke.
 *
 * The two originals are deleted only after the merged doc exists.
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

const doc = {
  _id: 'service-operations',
  _type: 'service',
  title: 'Operations and systems',
  slug: {_type: 'slug', current: 'operations'},
  pillar: 'strategic',
  order: 3,
  indexLabel: 'Operations and systems',
  legacyAnchors: ['process', 'tools-systems'],
  summary:
    'We map where the hours actually go — intake, scheduling, records, reporting — then fix the parts costing you most, with the right tools set up the right way. Where nothing off the shelf fits, we build something small that does.',

  heroTitle: 'The hours are going somewhere. Let’s find out where.',
  heroLede:
    'Most small teams are not short on effort. They are short on systems — and the gap shows up as evenings, weekends, and work that only one person knows how to do. We find the expensive parts and fix them.',
  heroSecondaryLabel: 'See our work',
  heroSecondaryHref: '/work/',

  includesLabel: 'What this looks like',
  includesTitle: 'Diagnose first. Then change as little as possible.',
  includes: [
    {
      _key: 'i1',
      _type: 'labeledCard',
      title: 'A map of where the time goes',
      body: 'We sit with the people doing the work and follow it end to end — intake, scheduling, records, reporting, handoffs. Most teams have never seen the whole path written down.',
    },
    {
      _key: 'i2',
      _type: 'labeledCard',
      title: 'The expensive parts, named',
      body: 'Not everything inefficient is worth fixing. You get a short list of what actually costs you hours, and what it would take to change each one.',
    },
    {
      _key: 'i3',
      _type: 'labeledCard',
      title: 'The right tools, set up properly',
      body: 'Usually the fix is a tool you already pay for, configured the way it should have been. We would rather turn something on than sell you something new.',
    },
    {
      _key: 'i4',
      _type: 'labeledCard',
      title: 'Custom builds, only where nothing fits',
      body: 'When off-the-shelf genuinely does not cover it, we build something small and maintainable — and show your team how to run it without us.',
    },
    {
      _key: 'i5',
      _type: 'labeledCard',
      title: 'Documentation your team will actually open',
      body: 'Short, current, and written for the person who has to do the task — not a manual nobody reads.',
    },
    {
      _key: 'i6',
      _type: 'labeledCard',
      title: 'A handover, not a dependency',
      body: 'You should be able to run what we build. If you need us afterwards, it should be because you want to, not because you are stuck.',
    },
  ],

  faqLabel: 'Questions',
  faqTitle: 'The things people ask first.',
  faqs: [
    {
      _key: 'f1',
      _type: 'faqItem',
      q: 'Do we have to replace the tools we already use?',
      a: 'Usually not. Most of what we find is a tool you are already paying for that was never set up properly. Replacing things is expensive and disruptive, so it is the last option, not the first.',
    },
    {
      _key: 'f2',
      _type: 'faqItem',
      q: 'How long does this take?',
      a: 'The mapping is usually a week or two depending on how many people we need to sit with. What follows depends entirely on what we find — and you decide how much of it to do.',
    },
    {
      _key: 'f3',
      _type: 'faqItem',
      q: 'Our process lives in one person’s head. Is that a problem?',
      a: 'It is the most common thing we see, and it is the reason this work matters. It is not a criticism of that person — it is a risk to the organization, and it is fixable.',
    },
    {
      _key: 'f4',
      _type: 'faqItem',
      q: 'What if we just need a small thing built?',
      a: 'Then we build the small thing. Not every engagement starts with a full map — if you already know what is broken, say so on the call and we will scope just that.',
    },
  ],

  pageReady: true,
  listed: true,
  serviceType: 'Business process and systems consulting',
}

const existing = await client.fetch(
  '*[_id in ["service-operations","service-process","service-tools-systems"]]{_id, title}'
)
const have = new Set(existing.map((d) => d._id))

console.log('\nMerge process + tools-systems → operations\n')
console.log(`  ${have.has(doc._id) ? 'exists  ' : 'CREATE  '} service-operations  (slug: operations)`)
console.log(`     legacyAnchors: ${doc.legacyAnchors.join(', ')}`)
for (const id of ['service-process', 'service-tools-systems']) {
  console.log(`  ${have.has(id) ? 'DELETE  ' : 'gone    '} ${id}`)
}

if (!APPLY) {
  console.log('\nDry run. Re-run with --apply to write.')
  process.exit(0)
}
if (!token) {
  console.error('\nNo SANITY_WRITE_TOKEN found.')
  process.exit(1)
}

// Create first, delete second — one transaction, so the overview is never
// briefly missing a strategic service.
const tx = client.transaction()
tx.createOrReplace(doc)
tx.delete('service-process')
tx.delete('service-tools-systems')
await tx.commit()
console.log('\nMerged. Five services now. Rebuild to see it.')
