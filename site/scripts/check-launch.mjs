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
for (const file of files) {
  const html = readFileSync(file, 'utf8')
  const text = html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .toLowerCase()
  for (const word of BANNED) {
    // "You don't need a digital transformation" is the copy deck's own line —
    // it names the phrase to reject it. Allow that single negated construction.
    if (word === 'digital transformation' && /(?:need|not) a digital transformation/.test(text)) continue
    if (text.includes(word)) {
      problems.push({kind: 'banned word', where: file.replace(DIST, '') || '/', detail: `"${word}"`})
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

// --- 3c. two filled buttons per page, besides nav (§3 / §7.3) ---------------
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
// No button may read "Pulse Check". Checks anchor/button text only.
for (const file of files) {
  const html = readFileSync(file, 'utf8')
  for (const m of html.matchAll(/<(?:a|button)\b[^>]*class="[^"]*btn[^"]*"[^>]*>([\s\S]*?)<\/(?:a|button)>/g)) {
    const label = m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    if (/pulse check/i.test(label)) {
      problems.push({
        kind: 'naming rule',
        where: file.replace(DIST, '') || '/',
        detail: `button reads "${label}" — buttons describe, copy brands`,
      })
    }
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
