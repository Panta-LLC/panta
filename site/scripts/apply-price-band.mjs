/**
 * Carries the homepage price band ($2,000–$10,000 for projects) onto the other
 * pages that answer the cost question, so a visitor comparing pages doesn't get
 * a number in one place and "it depends" in another.
 *
 * Both build FAQs currently open with "it depends on scope, and we will not
 * pretend otherwise with a fake price grid." The instinct is right — a fake
 * grid IS worse than nothing — but a real range is not a fake grid, and
 * refusing to answer costs more bookings than a range costs enquiries. The
 * rewrite keeps the no-fake-grid stance and puts the band in front of it.
 *
 * `service-web-presence` and `websitesPage` carry the SAME two FAQs verbatim
 * (the service page superseded the standalone page but the copy was duplicated,
 * not moved), so both are patched to stay in sync.
 *
 * NOT touched: planPage. The Digital Presence Plan is a different product from
 * a build — six deliverables, a 90-day roadmap and a re-score — and the project
 * band is not its price. Applying it there would be inventing a number.
 * `planPage.faqs[f1]` and `planPage.pricingBody` still say "quoted from your
 * situation" and need their own figure.
 *
 *   node scripts/apply-price-band.mjs            # dry run, prints the plan
 *   node scripts/apply-price-band.mjs --apply    # writes
 *
 * Safe to re-run: every edit checks the current value first. An edit whose
 * target already holds the new text is skipped; one holding neither the old nor
 * the new value is reported and skipped, never overwritten.
 *
 * Writes PUBLISHED documents, because the site reads published content at build
 * time. Content only reaches the live site after a rebuild + redeploy.
 */
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';

const APPLY = process.argv.includes('--apply');

function tokenFromEnvFile() {
  try {
    const line = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
      .split('\n')
      .find((l) => l.trim().startsWith('SANITY_WRITE_TOKEN='));
    return line?.split('=').slice(1).join('=').trim().replace(/^["']|["']$/g, '');
  } catch {
    return undefined;
  }
}

const client = createClient({
  projectId: 'tdi9ql1j',
  dataset: 'pantaco',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN || tokenFromEnvFile(),
});

const COST_ANSWER =
  'Most builds land between $2,000 and $10,000, depending on scope — a focused rebuild sits at the low end, a larger site with custom work at the high end. We won’t pretend a fake price grid is more precise than that. Your build is scoped from your plan, or from the free review for small, clear projects, with a written fixed price before anything starts. No surprises, no hourly billing.';

const WITHOUT_PLAN_ANSWER =
  'Sometimes — the free review is where we decide together. If your scope is small and clear, we can quote it straight from that conversation, usually at the lower end of the $2,000–$10,000 range. But most builds go better and cost less overall when the Digital Presence Plan comes first.';

/** [docId, path, matcher for the current value, new value] */
const EDITS = [
  ['service-web-presence', 'faqs[_key=="f3"].a', /fake price grid/i, COST_ANSWER],
  ['websitesPage', 'faqs[_key=="f3"].a', /fake price grid/i, COST_ANSWER],
  ['service-web-presence', 'faqs[_key=="f1"].a', /go better and cost less/i, WITHOUT_PLAN_ANSWER],
  ['websitesPage', 'faqs[_key=="f1"].a', /go better and cost less/i, WITHOUT_PLAN_ANSWER],
];

const readPath = (doc, path) => {
  let node = doc;
  for (const part of path.split('.')) {
    if (node == null) return undefined;
    const keyed = part.match(/^(\w+)\[_key=="([^"]+)"\]$/);
    node = keyed ? (node[keyed[1]] ?? []).find((i) => i._key === keyed[2]) : node[part];
  }
  return node;
};

console.log(`\nprice band — ${APPLY ? 'APPLYING' : 'dry run'}\n`);

const ids = [...new Set(EDITS.map((e) => e[0]))];
const docs = Object.fromEntries(
  (await client.fetch('*[_id in $ids && !(_id in path("drafts.**"))]', { ids })).map((d) => [
    d._id,
    d,
  ]),
);

let tx = client.transaction();
let changes = 0;
let conflicts = 0;

for (const [id, path, matcher, to] of EDITS) {
  const doc = docs[id];
  const current = doc && readPath(doc, path);
  if (!doc) {
    console.log(`  MISSING DOC   ${id}`);
    conflicts++;
  } else if (current === to) {
    console.log(`  already done  ${id}.${path}`);
  } else if (typeof current === 'string' && matcher.test(current)) {
    console.log(`  WILL SET      ${id}.${path}`);
    tx = tx.patch(id, (p) => p.set({ [path]: to }));
    changes++;
  } else {
    console.log(`  CONFLICT      ${id}.${path}`);
    console.log(`                expected to match: ${matcher}`);
    console.log(`                found: ${JSON.stringify(String(current).slice(0, 110))}`);
    conflicts++;
  }
}

console.log(`\n  ${changes} to change, ${conflicts} conflict(s)\n`);

if (conflicts) {
  console.error('Conflicts present — nothing written. Resolve them first.\n');
  process.exit(1);
}
if (!APPLY) {
  console.log('Dry run. Re-run with --apply to write.\n');
  process.exit(0);
}
if (changes) {
  await tx.commit();
  console.log('Committed. Rebuild and redeploy for this to reach the live site.\n');
} else {
  console.log('Nothing to do.\n');
}
