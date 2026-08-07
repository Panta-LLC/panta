/**
 * Ensures every service has `listed: true` (or leaves an explicit false alone).
 *
 *   node scripts/migrate-service-listed.mjs            # dry run
 *   node scripts/migrate-service-listed.mjs --apply    # writes
 *
 * Docs created before the field existed are still treated as listed by GROQ
 * (`coalesce(listed, true)`), but setting the field makes the Studio toggle
 * visible and unambiguous.
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

const docs = await client.fetch(
  `*[_type == "service" && !(_id in path("drafts.**"))]{_id, title, listed, "slug": slug.current}`
)

console.log('\nMigrate service.listed\n')
const todo = []
for (const d of docs) {
  if (d.listed === true) {
    console.log(`  unchanged  ${d._id}  listed=true`)
    continue
  }
  if (d.listed === false) {
    console.log(`  leave      ${d._id}  listed=false (explicit hide)`)
    continue
  }
  console.log(`  WILL SET   ${d._id}  ${d.slug}  ∅ → true`)
  todo.push(d._id)
}

console.log(`\n${todo.length} to patch · ${docs.length - todo.length} skipped`)

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
todo.forEach((id) => tx.patch(id, {set: {listed: true}}))
await tx.commit()
console.log('\nPatched. Turn Listed off in Studio to hide a service site-wide.')
