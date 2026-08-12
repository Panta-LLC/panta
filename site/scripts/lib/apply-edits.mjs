/**
 * Shared engine for applying content edits to Sanity from a checked-in list.
 *
 * Exists because the Sanity MCP server has been unreachable (net::ERR_FAILED on
 * every call, including whoami). Each batch script supplies its own edits and
 * calls run() — the safety behaviour lives here so every batch gets it.
 *
 * Safety contract:
 *   - dry run unless --apply is passed
 *   - every set() declares the value it expects to find; a field holding
 *     neither the expected old value nor the new one is a CONFLICT, reported
 *     and never overwritten
 *   - conflicts abort the whole run before anything is written
 *   - array inserts are keyed, so a re-run is a no-op rather than a duplicate
 *   - all edits for a run commit in ONE transaction: all or nothing
 *
 * Writes to PUBLISHED documents, because the site reads published content at
 * build time. Edits only reach the live site after a rebuild + redeploy.
 */
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';

const PROJECT_ID = 'tdi9ql1j';
const DATASET = 'pantaco';

/** .env.local isn't auto-loaded outside Astro, so read it directly. */
function tokenFromEnvFile() {
  try {
    const line = readFileSync(new URL('../../.env.local', import.meta.url), 'utf8')
      .split('\n')
      .find((l) => l.trim().startsWith('SANITY_WRITE_TOKEN='));
    return line?.split('=').slice(1).join('=').trim().replace(/^["']|["']$/g, '');
  } catch {
    return undefined;
  }
}

/**
 * Resolve a Sanity patch path against a fetched document. Supports the three
 * shapes the edit batches use: `field`, `field[_key=="k"]` (keyed array item),
 * and `field[0]` (positional array item, for arrays of plain strings that have
 * no _key to address).
 */
export function readPath(doc, path) {
  let node = doc;
  for (const part of path.split('.')) {
    if (node === undefined || node === null) return undefined;
    const keyed = part.match(/^(\w+)\[_key=="([^"]+)"\]$/);
    const indexed = part.match(/^(\w+)\[(\d+)\]$/);
    if (keyed) {
      node = (node[keyed[1]] ?? []).find((item) => item._key === keyed[2]);
    } else if (indexed) {
      node = (node[indexed[1]] ?? [])[Number(indexed[2])];
    } else {
      node = node[part];
    }
  }
  return node;
}

/**
 * @param {object} batch
 * @param {string} batch.name              label for the run
 * @param {Array}  [batch.sets]            [docId, path, expectedOld, newValue]
 * @param {Array}  [batch.inserts]         [docId, arrayField, item, afterKey]
 * @param {Array}  [batch.replacements]    [docId, arrayField, item] — replace by _key
 * @param {Array}  [batch.unsets]          [docId, path, expectedOld] — remove a field
 */
export async function run({ name, sets = [], inserts = [], replacements = [], unsets = [] }) {
  const apply = process.argv.includes('--apply');
  const token = process.env.SANITY_WRITE_TOKEN || tokenFromEnvFile();

  const client = createClient({
    projectId: PROJECT_ID,
    dataset: DATASET,
    apiVersion: '2024-01-01',
    useCdn: false,
    token,
  });

  const ids = [
    ...new Set([
      ...sets.map((s) => s[0]),
      ...inserts.map((i) => i[0]),
      ...replacements.map((r) => r[0]),
      ...unsets.map((u) => u[0]),
    ]),
  ];
  const docs = Object.fromEntries(
    (await client.fetch('*[_id in $ids]', { ids })).map((d) => [d._id, d]),
  );

  const patches = new Map();
  const queue = (id, fn) => {
    if (!patches.has(id)) patches.set(id, []);
    patches.get(id).push(fn);
  };

  let changes = 0;
  let done = 0;
  let conflicts = 0;

  console.log(`\n${name}\n`);

  for (const [id, path, from, to] of sets) {
    const doc = docs[id];
    if (!doc) {
      console.log(`  MISSING DOC   ${id}`);
      conflicts++;
      continue;
    }
    const current = readPath(doc, path);
    if (current === to) {
      console.log(`  already done  ${id}.${path}`);
      done++;
    } else if (current === from) {
      console.log(`  WILL SET      ${id}.${path}`);
      queue(id, (p) => p.set({ [path]: to }));
      changes++;
    } else {
      console.log(
        `  CONFLICT      ${id}.${path}\n                expected: ${JSON.stringify(from)}\n                found:    ${JSON.stringify(current)}`,
      );
      conflicts++;
    }
  }

  /* Same expected-value contract as set(): a field holding something other
     than what the batch says it holds is a conflict, because "remove it" was
     written about the value we knew about. Already-absent is done, not a
     conflict — that is what a re-run looks like. */
  for (const [id, path, from] of unsets) {
    const doc = docs[id];
    if (!doc) {
      console.log(`  MISSING DOC   ${id}`);
      conflicts++;
      continue;
    }
    const current = readPath(doc, path);
    if (current === undefined) {
      console.log(`  already done  ${id}.${path}`);
      done++;
    } else if (current === from) {
      console.log(`  WILL UNSET    ${id}.${path}`);
      queue(id, (p) => p.unset([path]));
      changes++;
    } else {
      console.log(
        `  CONFLICT      ${id}.${path}\n                expected: ${JSON.stringify(from)}\n                found:    ${JSON.stringify(current)}`,
      );
      conflicts++;
    }
  }

  for (const [id, field, item, afterKey] of inserts) {
    const doc = docs[id];
    if (!doc) {
      console.log(`  MISSING DOC   ${id}`);
      conflicts++;
      continue;
    }
    const arr = doc[field] ?? [];
    if (arr.some((e) => e._key === item._key)) {
      console.log(`  already done  ${id}.${field}[_key=="${item._key}"]`);
      done++;
    } else if (afterKey && !arr.some((e) => e._key === afterKey)) {
      console.log(`  CONFLICT      ${id}.${field} has no anchor _key=="${afterKey}"`);
      conflicts++;
    } else {
      console.log(`  WILL INSERT   ${id}.${field}[_key=="${item._key}"]`);
      const anchor = afterKey ? `${field}[_key=="${afterKey}"]` : `${field}[-1]`;
      queue(id, (p) => p.insert('after', anchor, [item]));
      changes++;
    }
  }

  for (const [id, field, item] of replacements) {
    const doc = docs[id];
    if (!doc) {
      console.log(`  MISSING DOC   ${id}`);
      conflicts++;
      continue;
    }
    const existing = (doc[field] ?? []).find((e) => e._key === item._key);
    if (!existing) {
      console.log(`  CONFLICT      ${id}.${field}[_key=="${item._key}"] does not exist`);
      conflicts++;
    } else if (JSON.stringify({ ...existing }) === JSON.stringify({ ...existing, ...item })) {
      console.log(`  already done  ${id}.${field}[_key=="${item._key}"]`);
      done++;
    } else {
      console.log(`  WILL REPLACE  ${id}.${field}[_key=="${item._key}"]`);
      queue(id, (p) => p.set({ [`${field}[_key=="${item._key}"]`]: { ...existing, ...item } }));
      changes++;
    }
  }

  console.log(
    `\n${changes} to change · ${done} already done · ${conflicts} conflict${conflicts === 1 ? '' : 's'}`,
  );

  if (conflicts > 0) {
    console.log('\nRefusing to write — resolve conflicts first.');
    process.exit(1);
  }
  if (!apply) {
    console.log('\nDry run. Re-run with --apply to write.');
    return;
  }
  if (!token) {
    console.error('\nNo SANITY_WRITE_TOKEN found — cannot write.');
    process.exit(1);
  }
  if (changes === 0) {
    console.log('\nNothing to do.');
    return;
  }

  const tx = client.transaction();
  for (const [id, fns] of patches) {
    let patch = client.patch(id);
    for (const fn of fns) patch = fn(patch);
    tx.patch(patch);
  }
  await tx.commit();
  console.log('\nApplied. Rebuild and redeploy for this to reach the live site.');
}
