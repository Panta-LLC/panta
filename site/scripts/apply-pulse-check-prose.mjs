/**
 * Second pass of the Pulse Check rename: the prose mentions.
 *
 *   node scripts/apply-pulse-check-prose.mjs            # dry run, shows every diff
 *   node scripts/apply-pulse-check-prose.mjs --apply    # writes
 *
 * apply-pulse-check.mjs handled labels and headlines, where each old value was
 * known exactly. These are long body strings scattered through plan/website
 * FAQs, so this does a guarded substring rename instead: it prints every
 * before/after for review, and only touches fields that actually match.
 *
 * "consultation" → "review" everywhere it names the offer. The Pulse Check
 * brand name is NOT injected into body copy — per §7.1 the name belongs in
 * headlines and microcopy, and sprinkling it through FAQ answers is exactly the
 * over-branding that rule exists to prevent.
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

const rename = (s) =>
  s
    .replace(/free 30-minute consultation/g, 'free 30-minute review')
    .replace(/Free 30-minute consultation/g, 'Free 30-minute review')
    .replace(/free consultation/g, 'free review')
    .replace(/Free consultation/g, 'Free review')

// Only these documents carry the prose; scoping the walk keeps the script from
// rewriting anything it was not reviewed against.
const IDS = ['planPage', 'websitesPage', 'consultationPage', 'contactPage', 'aboutPage', 'workPage']

const docs = await client.fetch('*[_id in $ids]', {ids: IDS})

/** Walk a document, collecting {path, from, to} for every string that changes. */
function collect(node, path, out) {
  if (typeof node === 'string') {
    const next = rename(node)
    if (next !== node) out.push({path, from: node, to: next})
    return
  }
  if (Array.isArray(node)) {
    node.forEach((v, i) => {
      // Key-addressed where possible so array reordering can't misdirect a patch.
      const seg = v && typeof v === 'object' && v._key ? `[_key=="${v._key}"]` : `[${i}]`
      collect(v, path + seg, out)
    })
    return
  }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith('_')) continue
      collect(v, path ? `${path}.${k}` : k, out)
    }
  }
}

let total = 0
const patches = []

for (const doc of docs) {
  const edits = []
  collect(doc, '', edits)
  if (!edits.length) continue
  console.log(`\n${doc._id}`)
  for (const e of edits) {
    console.log(`  ${e.path}`)
    console.log(`    - ${e.from.slice(0, 96)}`)
    console.log(`    + ${e.to.slice(0, 96)}`)
  }
  total += edits.length
  patches.push({id: doc._id, edits})
}

console.log(`\n${total} string${total === 1 ? '' : 's'} across ${patches.length} document${patches.length === 1 ? '' : 's'}`)

if (!total) process.exit(0)
if (!APPLY) {
  console.log('\nDry run. Re-run with --apply to write.')
  process.exit(0)
}
if (!token) {
  console.error('\nNo SANITY_WRITE_TOKEN found.')
  process.exit(1)
}

const tx = client.transaction()
for (const {id, edits} of patches) {
  tx.patch(client.patch(id).set(Object.fromEntries(edits.map((e) => [e.path, e.to]))))
}
await tx.commit()
console.log('\nApplied. Rebuild for this to reach the site.')
