/**
 * Seeds the five package documents.
 *
 *   node scripts/seed-packages.mjs            # dry run
 *   node scripts/seed-packages.mjs --apply    # writes
 *
 * Uses createIfNotExists, so re-running is safe and any Studio edits survive.
 *
 * Service references are resolved BY SLUG at run time, not by assuming the
 * `service-<slug>` id convention — the live documents have diverged from it
 * (`service-web-presence` now carries the slug `web-design-development`, via
 * migrate-websites-service.mjs). A dangling _ref is accepted by the API and
 * then silently yields `service: null` in the GROQ select, producing a card
 * with no link and no error anywhere, so an unresolvable slug hard-fails here.
 *
 * `pageReady: false` on all five: the homepage cards link to the underlying
 * service until each package page's copy is written and the flag is flipped
 * per package, no deploy needed.
 *
 * `priceFrom` is deliberately UNSET. The homepage FAQ already commits to
 * $2,000–$10,000 for projects; a per-package figure invented in a seed script
 * would contradict it two screens down on the same page. Fill it in the Studio
 * once the numbers are decided — the card renders without it.
 *
 * The copy below is checked against check-launch.mjs's banned words before it
 * ships (see BANNED at the foot of this file). It is version-controlled here
 * for the same reason the seeded service summaries are: a diff is where copy
 * gets reviewed.
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

const PACKAGES = [
  {
    slug: 'digital-presence',
    order: 1,
    title: 'Digital Presence',
    serviceSlug: 'web-design-development',
    summary:
      'A website people can actually use, plus the listings they check before they ever reach it. Built so you can update a date or a price yourself without paying an engineer.',
    bullets: [
      'A site you own and can edit',
      'Google Business Profile and directory listings',
      'Analytics set up so you can see what works',
    ],
  },
  {
    slug: 'brand-development',
    order: 2,
    title: 'Brand Development',
    serviceSlug: 'brand-design',
    summary:
      'A look and a voice that match who you actually are, written down so they stay consistent whoever applies them next. Recognisable, not fashionable.',
    bullets: [
      'Logo, type, and colour, with the files to use them',
      'A short guide anyone on your team can follow',
      'Templates for the things you make most often',
    ],
  },
  {
    slug: 'content-strategy',
    order: 3,
    title: 'Content Strategy',
    serviceSlug: 'storytelling',
    summary:
      'What to say, where to say it, and how often — decided once, so publishing stops being a weekly argument. We write the first round with you and hand over the plan.',
    bullets: [
      'The stories worth telling, in priority order',
      'A calendar you can keep without us',
      'First pieces written and published together',
    ],
  },
  {
    slug: 'custom-software',
    order: 4,
    title: 'Custom Software',
    // No service reference: nothing in the current catalogue covers this. Until
    // one exists, the homepage card renders unlinked rather than pointing
    // somewhere that does not answer for it.
    serviceSlug: null,
    summary:
      'A small tool built for the one thing no off-the-shelf product does the way you need. Scoped tight enough to finish, and handed over with the source.',
    bullets: [
      'One clearly defined job, scoped before we start',
      'Built on tools you can hire for later',
      'Yours outright — code, accounts, and documentation',
    ],
  },
  {
    slug: 'operations-assessment',
    order: 5,
    title: 'Operations Assessment',
    serviceSlug: 'operations',
    // Deliberately draws the line against the free review in its own copy: an
    // "assessment" package sitting a screen above "book a free 30-minute
    // review" otherwise invites the question of which one is being sold.
    summary:
      'A deeper pass than the free 30-minute review: we sit with your team, map how work actually moves today, and hand back a prioritised plan with costs against each step.',
    bullets: [
      'Interviews with the people doing the work',
      'A written map of where time is going',
      'A ranked plan, with what each fix would cost',
    ],
  },
]

// ---------------------------------------------------------------- resolve --

const services = await client.fetch('*[_type == "service"]{_id, "slug": slug.current}')
const bySlug = new Map(services.map((s) => [s.slug, s._id]))

const missing = PACKAGES.filter((p) => p.serviceSlug && !bySlug.has(p.serviceSlug))
if (missing.length) {
  console.error('\nUnresolvable service slugs — refusing to write dangling references:')
  for (const p of missing) console.error(`  ${p.slug} → "${p.serviceSlug}"`)
  console.error(`\nServices present: ${[...bySlug.keys()].join(', ')}`)
  process.exit(1)
}

// `summary` and `bullets` are portable text in the schema now (richText /
// richList). The copy above stays plain strings — a seed file is where copy gets
// reviewed in a diff, and block arrays are unreadable there — so it is wrapped
// on the way out. Same block shape and the same stable keys as
// migrate-package-richtext.mjs, so a document created here and one migrated
// there are indistinguishable.
const key = (...parts) => createHash('sha1').update(parts.join('|')).digest('hex').slice(0, 12)

const block = (text, seed, listItem) => ({
  _type: 'block',
  _key: key(seed),
  style: 'normal',
  ...(listItem ? {listItem, level: 1} : {}),
  markDefs: [],
  children: [{_type: 'span', _key: key(seed, 'span'), text, marks: []}],
})

const docs = PACKAGES.map((p) => ({
  _id: `package-${p.slug}`,
  _type: 'packageOffer',
  title: p.title,
  slug: {_type: 'slug', current: p.slug},
  order: p.order,
  summary: [block(p.summary, `package-${p.slug}:summary:0`)],
  bullets: p.bullets.map((b, i) => block(b, `package-${p.slug}:bullets:${i}`, 'bullet')),
  listed: true,
  pageReady: false,
  ...(p.serviceSlug ? {service: {_type: 'reference', _ref: bySlug.get(p.serviceSlug)}} : {}),
}))

// ------------------------------------------------------------ copy check --
// The same list check-launch.mjs greps for, run here so a bad word fails at
// the seed rather than three steps later in a built page.
const BANNED = ['leverage', 'solutions', 'empower', 'seamless', 'digital transformation']
const copy = PACKAGES.map((p) => `${p.title} ${p.summary} ${p.bullets.join(' ')}`)
  .join(' ')
  .toLowerCase()
const hits = BANNED.filter((w) => copy.includes(w))
if (hits.length) {
  console.error(`\nBanned words in package copy: ${hits.join(', ')}`)
  process.exit(1)
}

// ------------------------------------------------------------------ write --

const existing = new Set(await client.fetch('*[_type == "packageOffer"]._id'))

console.log('\nSeed packages\n')
for (const d of docs) {
  const ref = d.service ? d.service._ref : 'no service'
  console.log(`  ${existing.has(d._id) ? 'exists      ' : 'WILL CREATE '} ${d._id}  (${ref})`)
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
