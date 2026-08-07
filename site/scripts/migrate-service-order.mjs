/**
 * Sets unique site-wide `order` on every service document.
 *
 *   node scripts/migrate-service-order.mjs            # dry run
 *   node scripts/migrate-service-order.mjs --apply    # writes
 *
 * Before this, `order` meant “within the pillar” (1/2 per pillar), so GROQ
 * `order(order asc)` interleaved pillars. The site now treats `order` as the
 * single reading order for the hero, /services/, and schema — these values
 * preserve the previous pillar-first sequence so nothing reshuffles until an
 * editor changes them in the Studio.
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

/** Previous effective order: Digital → Strategic → Creative, then within-pillar. */
const ORDERS = [
  {id: 'service-web-presence', order: 1},
  {id: 'service-media-production', order: 2},
  {id: 'service-operations', order: 3},
  {id: 'service-storytelling', order: 4},
  {id: 'service-brand-design', order: 5},
]

const existing = await client.fetch(
  `*[_type == "service" && _id in $ids]{_id, title, order, "slug": slug.current}`,
  {ids: ORDERS.map((o) => o.id)}
)
const byId = Object.fromEntries(existing.map((d) => [d._id, d]))

console.log('\nMigrate service order (global)\n')
for (const {id, order} of ORDERS) {
  const doc = byId[id]
  if (!doc) {
    console.log(`  MISSING     ${id}`)
    continue
  }
  const same = doc.order === order
  console.log(
    `  ${same ? 'unchanged  ' : 'WILL SET   '} ${id}  ${doc.slug}  ${doc.order ?? '∅'} → ${order}`
  )
}

const todo = ORDERS.filter(({id, order}) => byId[id] && byId[id].order !== order)
console.log(`\n${todo.length} to patch · ${ORDERS.length - todo.length} already set or missing`)

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
todo.forEach(({id, order}) => tx.patch(id, {set: {order}}))
await tx.commit()
console.log('\nPatched. Restart the site dev server (memoised fetch) to see the new order.')
