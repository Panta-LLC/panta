/**
 * Launch gate. Run after `astro build`; exits non-zero if the site is not
 * shippable.
 *
 *   npm run check:launch
 *
 * PULSE-HOME-BUILD.md §7.4 — "bracketed placeholders must block launch, not
 * ship" — plus the §9 content blockers and the §7.5 copy bans. The point is
 * that none of these can be forgotten: they fail a command rather than relying
 * on someone remembering to look.
 */
import {readFileSync, readdirSync, statSync} from 'node:fs'
import {join} from 'node:path'

const DIST = 'dist/client'

function htmlFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) htmlFiles(full, out)
    else if (entry.endsWith('.html')) out.push(full)
  }
  return out
}

let files
try {
  files = htmlFiles(DIST)
} catch {
  console.error(`No build found at ${DIST}. Run \`npx astro build\` first.`)
  process.exit(1)
}

const problems = []

// --- 1. placeholders (§7.4) -------------------------------------------------
// Placeholder.astro stamps data-placeholder="<what is missing>".
for (const file of files) {
  const html = readFileSync(file, 'utf8')
  for (const m of html.matchAll(/data-placeholder="([^"]+)"/g)) {
    problems.push({
      kind: 'placeholder',
      where: file.replace(DIST, '') || '/',
      detail: m[1],
    })
  }
}

// --- 2. banned words (§7.5 / copy deck rule 1) ------------------------------
// Checked against visible text only: "solutions" legitimately appears in
// script/class names, and a false positive here would train people to ignore
// the gate.
const BANNED = ['leverage', 'solutions', 'empower', 'seamless', 'digital transformation']

// Words a CLIENT owns. The ban is on Panta's register, and quoting a client's
// own word for their own work is not Panta writing in that register —
// "empowerment" is Delta Bay's word for what Delta Bay does, and it reaches the
// page through `project.outcome`, which is their line and not ours.
//
// Scoped by proximity to the client's name rather than to the sentence it
// currently sits in: the allowance has to survive that line being reworded in
// the Studio, and it must not quietly clear the word for a page with nothing to
// do with the client. The window is wide enough to span a card — the homepage
// case card runs ~330 characters from the client's name to its outcome line —
// and nowhere near wide enough to cover a page.
const CLIENT_WORDS = [{word: 'empower', client: 'delta bay', window: 600}]

for (const file of files) {
  const html = readFileSync(file, 'utf8')
  const text = html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .toLowerCase()
  const where = file.replace(DIST, '') || '/'
  for (const word of BANNED) {
    // "You don't need a digital transformation" is the copy deck's own line —
    // it names the phrase to reject it. Allow that single negated construction.
    if (word === 'digital transformation' && /(?:need|not) a digital transformation/.test(text)) continue

    const owned = CLIENT_WORDS.find((c) => c.word === word)
    if (owned) {
      // Per occurrence, not per page: one use next to the client's name must
      // not vouch for a second use somewhere else on the same page.
      for (const match of text.matchAll(new RegExp(`${owned.word}\\w*`, 'g'))) {
        const from = Math.max(0, match.index - owned.window)
        const near = text.slice(from, match.index + owned.window)
        if (!near.includes(owned.client)) {
          problems.push({kind: 'banned word', where, detail: `"${match[0]}"`})
        }
      }
      continue
    }

    if (text.includes(word)) {
      problems.push({kind: 'banned word', where, detail: `"${word}"`})
    }
  }
}

// --- 3. Pulse strip cannot ship empty (§9) ----------------------------------
const home = files.find((f) => f === join(DIST, 'index.html'))
if (home) {
  const html = readFileSync(home, 'utf8')
  const cards = (html.match(/class="pulse-card"/g) ?? []).length
  if (cards < 3) {
    problems.push({
      kind: 'content',
      where: '/',
      detail: `Pulse strip has ${cards} of 3 posts — homepage cannot ship empty`,
    })
  }
}

// --- 3b. the services overview cannot ship empty ----------------------------
// Services are read from Sanity at build time, so a failed or empty fetch
// produces a valid-looking page with no services on it and no error anywhere.
const servicesIndex = files.find((f) => f === join(DIST, 'services', 'index.html'))
if (servicesIndex) {
  const html = readFileSync(servicesIndex, 'utf8')
  const blocks = (html.match(/class="svc-item"/g) ?? []).length
  if (blocks < 3) {
    problems.push({
      kind: 'content',
      where: '/services/',
      detail: `services overview has ${blocks} services — an empty Sanity fetch ships a blank page silently`,
    })
  }
}

// --- 3c. the packages grid cannot ship half-empty ---------------------------
// Same failure as 3b: packages come from Sanity at build time, so a bad fetch
// ships a homepage that silently lost a section. Gated on the section being
// rendered at all, because deliberately unlisting every package is a legitimate
// editorial choice — the homepage guard is against a broken fetch, not against
// an empty catalogue.
if (home) {
  const html = readFileSync(home, 'utf8')
  if (html.includes('data-section="packages"')) {
    // The character class is load-bearing: a bare /class="pkg-card/ also
    // matches pkg-card__name, __body, __list and __more, which made the count
    // ~5x the real one and let a one-card grid pass. Require the token to end.
    const cards = (html.match(/class="pkg-card[ "]/g) ?? []).length
    if (cards < 3) {
      problems.push({
        kind: 'content',
        where: '/',
        detail: `packages grid has ${cards} cards — an empty Sanity fetch ships a thin section silently`,
      })
    }
  }
}

// --- 3d. two filled buttons per page, besides nav (§3 / §7.3) ---------------
// The cap was a review convention until .btn--filled became global; now it is
// mechanical. The header CTA is chrome and is excluded, matching §5a's own
// phrasing ("the only filled CTA on the page besides nav").
for (const file of files) {
  const html = readFileSync(file, 'utf8')
  const body = html.replace(/<header[\s\S]*?<\/header>/g, ' ')
  const filled = (body.match(/class="[^"]*btn--filled[^"]*"/g) ?? []).length
  if (filled > 2) {
    problems.push({
      kind: 'naming rule',
      where: file.replace(DIST, '') || '/',
      detail: `${filled} filled buttons besides nav — the cap is 2`,
    })
  }
}

// --- 4. buttons describe, copy brands (§7.1) --------------------------------
// A button must pass the no-context test: it names the action, never the offer.
// "The Review" is the offer's name (journey-redesign.md §3) and belongs in
// headlines and microcopy — the button says "Get a free review".
//
// The old form of this rule matched "Pulse Check" and is now rule 4b, which
// catches the retired name anywhere on the page rather than only on buttons.
// The pattern here is capitalised and word-bounded on purpose: "Get a free
// review" is the correct label and must not trip it.
for (const file of files) {
  const html = readFileSync(file, 'utf8')
  for (const m of html.matchAll(/<(?:a|button)\b[^>]*class="[^"]*btn[^"]*"[^>]*>([\s\S]*?)<\/(?:a|button)>/g)) {
    const label = m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    if (/pulse check/i.test(label) || /\bThe Review\b/.test(label)) {
      problems.push({
        kind: 'naming rule',
        where: file.replace(DIST, '') || '/',
        detail: `button reads "${label}" — buttons describe, copy brands`,
      })
    }
  }
}

// --- 4b. the retired offer name (journey-redesign.md §3) --------------------
// "Pulse Check" was the entry offer's name and is now "the Review". Copy lives
// in three places — this repo, the Sanity dataset, and a Studio an editor can
// type into — so the rename can be undone from outside the codebase by someone
// who never saw the decision. This is the only thing that would notice.
//
// Scoped to VISIBLE text, and deliberately two words: "Pulse" on its own is the
// newsletter and is correct everywhere it appears.
for (const file of files) {
  const html = readFileSync(file, 'utf8')
  const text = html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
  if (/pulse check/i.test(text)) {
    problems.push({
      kind: 'naming rule',
      where: file.replace(DIST, '') || '/',
      detail: '"Pulse Check" — the offer is called the Review (journey-redesign.md §3)',
    })
  }
}

// --- 4c. the three doors reach every page (journey-redesign.md §1.1) --------
// Every page gives the ready buyer a quote path and the not-yet visitor a
// newsletter. The newsletter is in the footer sitewide and the quote link is in
// the footer nav, so this is really a check that the layout still renders them —
// but that is exactly the regression worth catching: both arrive via Base.astro,
// and a page that stops using it loses two thirds of the funnel silently.
//
// /thanks/ is exempt: it is reached only by a scheduler redirect after a booking
// is already made, and offering someone three ways to start at that moment is
// noise. Prototype pages are exempt for the same reason they are out of the
// sitemap — they are not part of the journey yet.
const DOOR_EXEMPT = ['/thanks/', '/journey/', '/consultation-condensed/', '/hero-mockup/', '/hero-centered/']
for (const file of files) {
  const where = file.replace(DIST, '').replace(/index\.html$/, '') || '/'
  if (DOOR_EXEMPT.includes(where)) continue
  const html = readFileSync(file, 'utf8')
  const missing = [
    html.includes('href="/quote/') ? null : 'no quote link',
    html.includes('/api/subscribe') ? null : 'no newsletter signup',
  ].filter(Boolean)
  if (missing.length) {
    problems.push({
      kind: 'three doors',
      where,
      detail: `${missing.join(' · ')} — every page carries all three doors`,
    })
  }
}

// --- report -----------------------------------------------------------------
if (!problems.length) {
  console.log(`✓ Launch checks passed across ${files.length} pages.`)
  process.exit(0)
}

const byKind = problems.reduce((acc, p) => ((acc[p.kind] ??= []).push(p), acc), {})
console.log(`\n✗ ${problems.length} launch blocker${problems.length === 1 ? '' : 's'}:\n`)
for (const [kind, items] of Object.entries(byKind)) {
  console.log(`  ${kind.toUpperCase()}`)
  const seen = new Set()
  for (const i of items) {
    const key = `${i.where}|${i.detail}`
    if (seen.has(key)) continue
    seen.add(key)
    console.log(`    ${i.where.padEnd(28)} ${i.detail}`)
  }
  console.log()
}
console.log('These are content blockers, not code bugs — see PULSE-HOME-BUILD.md §9.\n')
process.exit(1)
