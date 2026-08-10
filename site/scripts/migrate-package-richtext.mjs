/**
 * Converts the package copy fields from strings to portable text.
 *
 *   node scripts/migrate-package-richtext.mjs            # dry run, prints the diff
 *   node scripts/migrate-package-richtext.mjs --apply    # writes
 *
 * `summary`, `heroLede` and `ctaBody` were `text`; `bullets` and `goodFit` were
 * arrays of strings. They are now `richText` / `richList` (see
 * studio/schemaTypes/richText.ts), and a document still holding the old shape
 * shows as an invalid value in the Studio — the editor refuses to edit a string
 * in a block-array field, which is exactly the field this change was made to
 * open up.
 *
 * The site renders both shapes (site/src/lib/portable.js), so running this is
 * not what keeps the pages up; it is what makes the fields editable.
 *
 * Idempotent: a field already holding blocks is left alone, so re-running after
 * a partial run costs nothing. Drafts are migrated alongside their published
 * documents — an unmigrated draft is the same broken editor, and it is the copy
 * someone is in the middle of writing.
 *
 * Keys are derived from the document id and field, not random: a re-run must
 * produce byte-identical blocks or every run shows as a change in history.
 */
import {createClient} from '@sanity/client'
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'

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

/** Short, stable, collision-free enough for keys within one field. */
const key = (...parts) => createHash('sha1').update(parts.join('|')).digest('hex').slice(0, 12)

const block = (text, seed, {listItem} = {}) => ({
  _type: 'block',
  _key: key(seed),
  style: 'normal',
  ...(listItem ? {listItem, level: 1} : {}),
  markDefs: [],
  children: [{_type: 'span', _key: key(seed, 'span'), text, marks: []}],
})

/** A blank line separates paragraphs — the only structure a textarea had. */
const toRichText = (value, seed) =>
  String(value)
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p, i) => block(p, `${seed}:${i}`))

/** One string in, one bullet out. Order is the array's own. */
const toRichList = (value, seed) =>
  value
    .filter((item) => typeof item === 'string' && item.trim())
    .map((item, i) => block(item.trim(), `${seed}:${i}`, {listItem: 'bullet'}))

const PROSE = ['summary', 'heroLede', 'ctaBody']
const LISTS = ['bullets', 'goodFit']

/** Already migrated? Portable text is an array of objects with a _type. */
const isBlocks = (value) => Array.isArray(value) && value.every((v) => v && typeof v === 'object')

const docs = await client.fetch(
  `*[_type == "packageOffer"]{_id, title, ${[...PROSE, ...LISTS].join(', ')}}`
)

if (!docs.length) {
  console.log('No packageOffer documents found.')
  process.exit(0)
}

const patches = []
for (const doc of docs) {
  const set = {}

  for (const field of PROSE) {
    const value = doc[field]
    if (typeof value !== 'string' || !value.trim()) continue
    set[field] = toRichText(value, `${doc._id}:${field}`)
  }

  for (const field of LISTS) {
    const value = doc[field]
    if (!Array.isArray(value) || !value.length || isBlocks(value)) continue
    set[field] = toRichList(value, `${doc._id}:${field}`)
  }

  if (Object.keys(set).length) patches.push({id: doc._id, title: doc.title, set})
}

if (!patches.length) {
  console.log(`✓ Nothing to migrate — all ${docs.length} package documents already hold rich text.`)
  process.exit(0)
}

for (const {id, title, set} of patches) {
  console.log(`\n${title ?? '(untitled)'}  ${id}`)
  for (const [field, blocks] of Object.entries(set)) {
    const preview = blocks
      .map((b) => `${b.listItem ? '• ' : ''}${b.children[0].text}`)
      .join('\n      ')
    console.log(`  ${field} → ${blocks.length} block${blocks.length === 1 ? '' : 's'}`)
    console.log(`      ${preview}`)
  }
}

if (!APPLY) {
  console.log(`\nDry run. ${patches.length} document(s) would change. Re-run with --apply to write.`)
  process.exit(0)
}

if (!token) {
  console.error('\nSANITY_WRITE_TOKEN is not set (env or site/.env.local). Nothing was written.')
  process.exit(1)
}

const tx = patches.reduce((t, {id, set}) => t.patch(id, {set}), client.transaction())
await tx.commit()
console.log(`\n✓ Migrated ${patches.length} document(s).`)
