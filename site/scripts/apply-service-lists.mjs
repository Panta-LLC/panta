/**
 * Corrects `project.contributions` on the two client projects, so the homepage
 * "What we did" list names the work that was actually delivered.
 *
 * The stored lists were written from the case-study pages and had drifted from
 * the engagements: Arielle's omitted the custom furniture entirely, and Delta
 * Bay's said "Photography" where the work was event photography, and carried
 * nothing for the systems and tooling assessment.
 *
 * These are MERGES, not replacements — the stored entries are kept and the
 * corrected ones added. Three pairs are the same deliverable under two names,
 * so the corrected wording supersedes the stored wording rather than sitting
 * beside it as a near-duplicate:
 *
 *   Arielle   "Web design & build"  ->  "Web presence"
 *   Delta Bay "Photography"         ->  "Event photography"
 *   Delta Bay "Web design & build"  ->  "Web development"
 *
 * Everything else stored survives: Arielle keeps Positioning / Local SEO /
 * Analytics & consent, Delta Bay keeps Content strategy / Brand. Corrected
 * items lead, because they are the headline services for each engagement.
 *
 * Not routed through lib/apply-edits.mjs: that engine compares expected vs
 * current with `===`, which is reference equality for arrays and would report a
 * CONFLICT on every run. The safety contract is reproduced here against a
 * JSON comparison instead — same guarantees, array-aware.
 *
 *   node scripts/apply-service-lists.mjs            # dry run, prints the plan
 *   node scripts/apply-service-lists.mjs --apply    # writes
 *
 * Needs a token with write access to the `pantaco` dataset:
 *   SANITY_WRITE_TOKEN=... node scripts/apply-service-lists.mjs --apply
 * or put SANITY_WRITE_TOKEN in site/.env.local (it is gitignored).
 *
 * Writes to the PUBLISHED documents, because the site reads published content
 * at build time. Content only reaches the live site after a rebuild + redeploy.
 */
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';

const APPLY = process.argv.includes('--apply');

// .env.local isn't auto-loaded outside Astro, so read it directly.
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

/** [slug, expected current value, merged new value] */
const EDITS = [
  [
    'arielle-rae-hastings',
    ['Positioning', 'Web design & build', 'Local SEO', 'Analytics & consent'],
    [
      'Brand development',
      'Custom furniture',
      'Web presence', // supersedes "Web design & build"
      'Positioning',
      'Local SEO',
      'Analytics & consent',
    ],
  ],
  [
    'delta-bay-impact',
    ['Content strategy', 'Photography', 'Web design & build', 'Brand'],
    [
      'Event photography', // supersedes "Photography"
      'Systems and tool assessment',
      'Web development', // supersedes "Web design & build"
      'Content strategy',
      'Brand',
    ],
  ],
];

const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

// The draft exclusion is load-bearing, not decoration. A token-authed client
// sees drafts too, so a project with an open draft returns TWO documents for
// the same slug — and building the lookup from that array silently keeps the
// last one. Arielle has a draft, so the first run of this script patched
// `drafts.<id>` and left the published document untouched, which is invisible
// on the site because every query in src/lib/sanity.js reads published only.
const docs = await client.fetch(
  `*[_type == "project" && slug.current in $slugs && !(_id in path("drafts.**"))]{
     _id, "slug": slug.current, name, contributions
   }`,
  { slugs: EDITS.map(([slug]) => slug) },
);
const bySlug = Object.fromEntries(docs.map((d) => [d.slug, d]));

console.log(`\nservice lists — ${APPLY ? 'APPLYING' : 'dry run'}\n`);

let tx = client.transaction();
let changes = 0;
let conflicts = 0;

for (const [slug, from, to] of EDITS) {
  const doc = bySlug[slug];
  if (!doc) {
    console.log(`  MISSING DOC   ${slug}`);
    conflicts++;
  } else if (same(doc.contributions, to)) {
    console.log(`  already done  ${slug}`);
  } else if (same(doc.contributions, from)) {
    console.log(`  WILL SET      ${slug}`);
    console.log(`                from: ${JSON.stringify(doc.contributions)}`);
    console.log(`                to:   ${JSON.stringify(to)}`);
    tx = tx.patch(doc._id, (p) => p.set({ contributions: to }));
    changes++;
  } else {
    // Neither the value we expected nor the one we want: somebody edited this
    // in the Studio since the plan was written. Never overwrite that blind.
    console.log(`  CONFLICT      ${slug}`);
    console.log(`                expected: ${JSON.stringify(from)}`);
    console.log(`                found:    ${JSON.stringify(doc.contributions)}`);
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
