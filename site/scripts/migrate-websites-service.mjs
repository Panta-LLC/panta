/**
 * Migrates the Websites page content into the `web-presence` service document.
 *
 *   node scripts/migrate-websites-service.mjs            # dry run
 *   node scripts/migrate-websites-service.mjs --apply    # writes
 *
 * /web-strategy/websites/ was, in substance, already the "Web presence and
 * development" service page. This copies its sections onto the service doc so
 * the new template renders the same page at /services/web-presence/, then sets
 * pageReady so links point at it.
 *
 * `websitesPage` is NOT deleted — it is retitled "(unused)" in the Studio desk,
 * the same treatment webStrategyPage got, so the content stays recoverable.
 *
 * Two bugs are fixed in the move rather than carried over:
 *   1. pivotCtaHref hardcoded /web-strategy/, which 301s to / today — a live
 *      redirect hop on an in-page primary CTA.
 *   2. processLinkHref pointed at /web-strategy/#process, an anchor that no
 *      longer exists anywhere.
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

const src = await client.fetch('*[_id == "websitesPage"][0]')
const dest = await client.fetch('*[_id == "service-web-presence"][0]')

if (!src) {
  console.error('websitesPage not found — nothing to migrate.')
  process.exit(1)
}
if (!dest) {
  console.error('service-web-presence not found — run seed-services.mjs first.')
  process.exit(1)
}

// Left = websitesPage field, right = service field. Renames are deliberate:
// build* becomes includes* because "what a build includes" is website-specific
// and the service type is shared by five services.
// heroLabel is deliberately absent: the new template builds its own crumb
// ("Services / Digital · get found") from the pillar, and the stored value
// ("Websites · a Web & Systems service") names a taxonomy that no longer
// exists. Importing it would reintroduce a retired term.
const MAP = {
  heroTitle: 'heroTitle',
  heroLede: 'heroLede',
  proofLabel: 'proofLabel',
  workLabel: 'workLabel',
  workTitle: 'workTitle',
  moreCardTitle: 'moreCardTitle',
  moreCardBody: 'moreCardBody',
  moreCardLinkLabel: 'moreCardLinkLabel',
  buildLabel: 'includesLabel',
  buildTitle: 'includesTitle',
  buildCards: 'includes',
  pivotLabel: 'pivotLabel',
  pivotTitle: 'pivotTitle',
  pivotLede: 'pivotLede',
  pivotIntro: 'pivotIntro',
  pivotChecklist: 'pivotChecklist',
  pivotCtaLabel: 'pivotCtaLabel',
  processLabel: 'processLabel',
  processTitle: 'processTitle',
  processBody: 'processBody',
  processLinkLabel: 'processLinkLabel',
  faqLabel: 'faqLabel',
  faqTitle: 'faqTitle',
  faqs: 'faqs',
  ctaNote: 'ctaNote',
}

const patch = {}
const skipped = []

for (const [from, to] of Object.entries(MAP)) {
  const v = src[from]
  if (v === undefined || v === null || (Array.isArray(v) && !v.length)) {
    skipped.push(`${from} (empty in source)`)
    continue
  }
  if (dest[to] !== undefined && dest[to] !== null) {
    // Never clobber something already written on the service doc.
    skipped.push(`${to} (already set on service — left alone)`)
    continue
  }
  patch[to] = v
}

// The two href fixes. These fields do not exist on websitesPage; the old page
// hardcoded both destinations in markup.
patch.pivotCtaHref = '/digital-presence-plan/'
patch.processLinkHref = '/services/'
patch.pageReady = true
patch.serviceType = 'Website design and development'

// Copy that still names the retired "practice" taxonomy. Rewritten here rather
// than carried across — importing it would undo the taxonomy cleanup.
patch.pivotCtaLabel = 'See the Digital Presence Plan'
patch.processLinkLabel = 'See how it works →'
if (typeof patch.processBody === 'string') {
  patch.processBody = patch.processBody.replace(
    "the practice's three steps",
    'our three steps'
  )
}

console.log('\nMigrate websitesPage → service-web-presence\n')
for (const [k, v] of Object.entries(patch)) {
  const preview = Array.isArray(v) ? `[${v.length} items]` : String(v).slice(0, 62)
  console.log(`  SET  ${k.padEnd(20)} ${preview}`)
}
if (skipped.length) {
  console.log('\n  skipped:')
  skipped.forEach((s) => console.log(`    - ${s}`))
}
console.log(`\n${Object.keys(patch).length} fields to set`)

if (!APPLY) {
  console.log('\nDry run. Re-run with --apply to write.')
  process.exit(0)
}
if (!token) {
  console.error('\nNo SANITY_WRITE_TOKEN found.')
  process.exit(1)
}

await client.patch('service-web-presence').set(patch).commit()
console.log('\nApplied. web-presence is now pageReady — rebuild to see /services/web-presence/.')
