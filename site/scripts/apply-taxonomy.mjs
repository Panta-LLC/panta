/**
 * Applies the practice taxonomy content edits to Sanity.
 *
 * This exists because the Sanity MCP server was unreachable (net::ERR_FAILED on
 * every call, including whoami) when the taxonomy landed in code. It encodes
 * exactly the checklist in SANITY-EDITS-TAXONOMY.md — nothing more.
 *
 * Safe to re-run: every edit checks the current value first. An edit whose
 * target already holds the new value is skipped; one holding neither the old nor
 * the new value is reported and skipped, never overwritten.
 *
 *   node scripts/apply-taxonomy.mjs            # dry run, prints the plan
 *   node scripts/apply-taxonomy.mjs --apply    # writes
 *
 * Needs a token with write access to the `pantaco` dataset:
 *   SANITY_WRITE_TOKEN=... node scripts/apply-taxonomy.mjs --apply
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

const token = process.env.SANITY_WRITE_TOKEN || tokenFromEnvFile();

const client = createClient({
  projectId: 'tdi9ql1j',
  dataset: 'pantaco',
  apiVersion: '2024-01-01',
  useCdn: false,
  token,
});

/** Scalar renames: [documentId, path, expectedOldValue, newValue] */
const SETS = [
  // --- the live practice renames ---
  [
    'webStrategyPage',
    'heroLabel',
    'Web Strategy & Development',
    'Build · Web & Systems',
  ],
  [
    'webStrategyPage',
    'heroLede',
    "Panta's web practice for small businesses, nonprofits, and independent practices: a clear plan for how the world finds, trusts, and chooses you — then the websites, channels, and support to make it happen, all from the same hands.",
    "Panta's client practice for small businesses, nonprofits, and independent practices: a clear plan for how the world finds, trusts, and chooses you — then the websites, channels, and systems to make it happen, all from the same hands.",
  ],
  [
    'websitesPage',
    'heroLabel',
    'Websites · a Web Strategy & Development service',
    'Websites · a Web & Systems service',
  ],
  [
    'missionPage',
    'practices[_key=="web"].title',
    'Web Strategy & Development',
    'Web & Systems',
  ],
  [
    'missionPage',
    'practices[_key=="community"].title',
    'Community Program Development',
    'Community Programs & Content',
  ],
  [
    'aboutPage',
    'doItems[_key=="d1"].body',
    'The Digital Presence Plan: a graded read on where you stand and a 90-day roadmap forward — the front door to Web Strategy & Development.',
    'The Digital Presence Plan: a graded read on where you stand and a 90-day roadmap forward — the front door to Web & Systems.',
  ],
  [
    'aboutPage',
    'doNote',
    "That's our web practice. Two more are taking root: Community Program Development and Product Development.",
    "That's our client practice. Two more are taking root:",
  ],
  ['homePage', 'practiceTitle', 'Web Strategy & Development', 'Web & Systems'],
  [
    'homePage',
    'verbCards[_key=="build"].linkLabel',
    'Web Strategy & Development',
    'Web & Systems',
  ],
  [
    'homePage',
    'verbCards[_key=="connect"].linkLabel',
    'Community Program Development',
    'Community Programs & Content',
  ],
  [
    'homePage',
    'comingCards[_key=="community"].title',
    'Community Program Development',
    'Community Programs & Content',
  ],

  // --- Connect absorbs content ---
  [
    'communityProgramsPage',
    'heroLabel',
    'Community Program Development · Taking root',
    'Connect · Community Programs & Content · Taking root',
  ],
  [
    'communityProgramsPage',
    'gridTitle',
    'Programs that put people in touch with what moves them forward.',
    'Programs and content that put people in touch with what moves them forward.',
  ],

  // --- Create admits physical products ---
  [
    'productDevelopmentPage',
    'heroLabel',
    'Product Development · Taking root',
    'Create · Product Development · Taking root',
  ],
  [
    'productDevelopmentPage',
    'gridTitle',
    'Products with a community-sized purpose.',
    'Digital and physical products with a community-sized purpose.',
  ],
];

/** New array items: [documentId, arrayField, newItem] — keyed, so re-runs no-op. */
const INSERTS = [
  [
    'webStrategyPage',
    'services',
    {
      _key: 'systems',
      _type: 'object',
      title: 'Systems & Custom Software',
      body: "The processes behind the presence: intake, scheduling, records, and reporting. We map what's costing you hours, fix what off-the-shelf tools can fix, and build custom where nothing fits.",
      href: '/contact/',
      linkLabel: 'Ask about systems work',
    },
    // Insert after this key so reading order matches the taxonomy spec. The
    // page picks icons by _key, so order is presentational only.
    'web',
  ],
  [
    'communityProgramsPage',
    'cards',
    {
      _key: 'c4',
      _type: 'object',
      kicker: 'Content',
      title: 'Something worth passing on',
      body: "Writing, guides, and stories that make what we learn useful to people we'll never invoice — published for the community, not for a client.",
    },
    'c3',
  ],
];

/** Resolve `field` or `field[_key=="k"].sub` against a fetched document. */
function readPath(doc, path) {
  const parts = path.split('.');
  let node = doc;
  for (const part of parts) {
    if (node === undefined || node === null) return undefined;
    const keyed = part.match(/^(\w+)\[_key=="([^"]+)"\]$/);
    if (keyed) {
      node = (node[keyed[1]] ?? []).find((item) => item._key === keyed[2]);
    } else {
      node = node[part];
    }
  }
  return node;
}

const ids = [...new Set([...SETS.map((s) => s[0]), ...INSERTS.map((i) => i[0])])];
const docs = Object.fromEntries(
  (await client.fetch('*[_id in $ids]', { ids })).map((d) => [d._id, d]),
);

const patches = new Map();
const queue = (id, patch) => {
  if (!patches.has(id)) patches.set(id, { set: {}, insert: [] });
  const entry = patches.get(id);
  if (patch.set) Object.assign(entry.set, patch.set);
  if (patch.insert) entry.insert.push(patch.insert);
};

let applied = 0;
let skipped = 0;
let conflicts = 0;

for (const [id, path, from, to] of SETS) {
  const doc = docs[id];
  if (!doc) {
    console.log(`  MISSING DOC  ${id}`);
    conflicts++;
    continue;
  }
  const current = readPath(doc, path);
  if (current === to) {
    console.log(`  already done  ${id}.${path}`);
    skipped++;
  } else if (current === from) {
    console.log(`  WILL SET      ${id}.${path}`);
    queue(id, { set: { [path]: to } });
    applied++;
  } else {
    console.log(
      `  CONFLICT      ${id}.${path}\n                expected: ${JSON.stringify(from)}\n                found:    ${JSON.stringify(current)}`,
    );
    conflicts++;
  }
}

for (const [id, field, item, afterKey] of INSERTS) {
  const doc = docs[id];
  if (!doc) {
    console.log(`  MISSING DOC  ${id}`);
    conflicts++;
    continue;
  }
  const arr = doc[field] ?? [];
  if (arr.some((existing) => existing._key === item._key)) {
    console.log(`  already done  ${id}.${field}[_key=="${item._key}"]`);
    skipped++;
  } else if (!arr.some((existing) => existing._key === afterKey)) {
    console.log(`  CONFLICT      ${id}.${field} has no anchor _key=="${afterKey}"`);
    conflicts++;
  } else {
    console.log(`  WILL INSERT   ${id}.${field}[_key=="${item._key}"] after "${afterKey}"`);
    queue(id, { insert: { after: `${field}[_key=="${afterKey}"]`, items: [item] } });
    applied++;
  }
}

console.log(
  `\n${applied} to change · ${skipped} already done · ${conflicts} conflict${conflicts === 1 ? '' : 's'}`,
);

if (conflicts > 0) {
  console.log('\nResolve conflicts before applying — refusing to guess at unexpected values.');
  process.exit(1);
}

if (!APPLY) {
  console.log('\nDry run. Re-run with --apply to write.');
  process.exit(0);
}

if (!token) {
  console.error('\nNo SANITY_WRITE_TOKEN found — cannot write.');
  process.exit(1);
}

if (applied === 0) {
  console.log('\nNothing to do.');
  process.exit(0);
}

const tx = client.transaction();
for (const [id, { set, insert }] of patches) {
  let patch = client.patch(id);
  if (Object.keys(set).length) patch = patch.set(set);
  for (const ins of insert) patch = patch.insert('after', ins.after, ins.items);
  tx.patch(patch);
}
await tx.commit();
console.log('\nApplied. Rebuild and redeploy for this to reach the live site.');
