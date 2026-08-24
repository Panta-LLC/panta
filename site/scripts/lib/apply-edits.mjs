/**
 * Shared engine for applying content edits to Sanity from a checked-in list.
 *
 * Exists because the Sanity MCP server has been unreachable (net::ERR_FAILED on
 * every call, including whoami). Each batch script supplies its own edits and
 * calls run() — the safety behaviour lives here so every batch gets it.
 *
 * Safety contract:
 *   - dry run unless --apply is passed
 *   - re-running a batch is a no-op: values are compared structurally, so an
 *     already-applied array or object edit reports "already done" rather than
 *     as a conflict
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
 * Value equality for the expected-old / already-done checks.
 *
 * `===` is right for the scalars every early batch dealt in, and wrong the
 * moment a batch sets an ARRAY or an OBJECT — two structurally identical arrays
 * are never `===`, so an already-applied array edit reports as a CONFLICT and
 * aborts the run. That breaks the one property these scripts are supposed to
 * have: re-running a batch is a no-op.
 *
 * Order-INSENSITIVE on object keys, and it has to be: Sanity returns documents
 * with keys normalised (roughly alphabetical), so a reference written here as
 * `{_type, _ref, _key}` comes back as `{_key, _ref, _type}`. A JSON.stringify
 * comparison calls those two different and re-reports every applied array edit
 * as a conflict — which is exactly the bug this replaced.
 *
 * Array order IS significant, because it is content: `featuredProjects[0]` is
 * the case study a service page leads with.
 */
const same = (a, b) => {
  if (a === b) return true;
  if (a === undefined || b === undefined || a === null || b === null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    return a.length === b.length && a.every((item, i) => same(item, b[i]));
  }
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  return ak.length === bk.length && ak.every((k) => k in b && same(a[k], b[k]));
};

/**
 * @param {object} batch
 * @param {string} batch.name              label for the run
 * @param {Array}  [batch.sets]            [docId, path, expectedOld, newValue].
 *   `expectedOld` of `undefined` means "this field should not exist yet", which
 *   is how a batch adds a new field. `newValue` of `undefined` means "remove
 *   it" and is routed to unset() — a literal set-to-undefined is dropped when
 *   the patch is serialised, so it would commit successfully and change nothing.
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

  /**
   * Queued operations, per document, as DATA rather than as composed calls on a
   * patch builder.
   *
   * The builder cannot be used as an accumulator, which is the trap this shape
   * exists to close. A Sanity patch is one object with one key per operation
   * kind, and the client's methods assign rather than merge: `.unset(['a'])`
   * followed by `.unset(['b'])` unsets only `b`, and two `.insert()` calls keep
   * only the second. Both failures are silent — the mutation commits, the run
   * reports success, and one of the two edits simply never happened.
   *
   * Collecting the operations here and building the patch once at commit time
   * means the merge is explicit and a batch touching one document five ways
   * still lands all five.
   */
  const patches = new Map();
  const ops = (id) => {
    if (!patches.has(id)) patches.set(id, { set: {}, unset: [], inserts: [] });
    return patches.get(id);
  };
  const queueSet = (id, path, value) => {
    ops(id).set[path] = value;
  };
  const queueUnset = (id, path) => {
    const u = ops(id).unset;
    if (!u.includes(path)) u.push(path);
  };
  const queueInsert = (id, anchor, item) => {
    ops(id).inserts.push({ anchor, item });
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
    if (same(current, to)) {
      console.log(`  already done  ${id}.${path}`);
      done++;
    } else if (same(current, from)) {
      /* `set({field: undefined})` is not "clear this field" — the value is
         dropped when the patch is serialised, so the mutation is a no-op and the
         edit re-reports as pending on every subsequent run. A batch that means
         to remove a field writes `undefined` as its `to` quite naturally, so
         route that to unset() here rather than making every caller remember. */
      const clearing = to === undefined;
      console.log(`  WILL ${clearing ? 'UNSET' : 'SET  '}       ${id}.${path}`);
      if (clearing) queueUnset(id, path);
      else queueSet(id, path, to);
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
    } else if (same(current, from)) {
      console.log(`  WILL UNSET    ${id}.${path}`);
      queueUnset(id, path);
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
      queueInsert(id, anchor, item);
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
      queueSet(id, `${field}[_key=="${item._key}"]`, { ...existing, ...item });
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

  /**
   * One patch per document for sets and unsets, plus one more per insert.
   *
   * The inserts have to be separate patches rather than separate keys: `insert`
   * is a single key on a patch, so two inserts into one document cannot be
   * expressed in one. A transaction may hold several patches for the same
   * document and applies them in order, which is exactly what is wanted — two
   * FAQs inserted after the same anchor land in the order they were queued.
   */
  const tx = client.transaction();
  for (const [id, { set, unset, inserts }] of patches) {
    if (Object.keys(set).length || unset.length) {
      let patch = client.patch(id);
      if (Object.keys(set).length) patch = patch.set(set);
      if (unset.length) patch = patch.unset(unset);
      tx.patch(patch);
    }
    for (const { anchor, item } of inserts) {
      tx.patch(client.patch(id).insert('after', anchor, [item]));
    }
  }
  await tx.commit();
  console.log('\nApplied. Rebuild and redeploy for this to reach the live site.');
}
