/**
 * Publish an instrument version into the database.
 *
 * Idempotent: re-running updates the definition for that version in place,
 * which is what you want while a version is still being drafted. Once real
 * interviews have been conducted against a version, bump the version number
 * instead — a pulse_check pins its instrument, and rewriting a published one
 * silently changes what a past interview claims to have asked.
 */
// Must come first: fills process.env from .env.local before the db client's
// module body reads DATABASE_URL. See the note in scripts/env.ts.
import './env.ts';

import { eq, and, ne } from 'drizzle-orm';

import { db } from '../src/lib/db/client.ts';
import { instruments, pulseChecks } from '../src/lib/db/schema.ts';
import { pulseCheckV1 } from '../src/lib/instrument/pulse-check.v1.ts';

const def = pulseCheckV1;

const existing = await db
  .select({ id: instruments.id })
  .from(instruments)
  .where(and(eq(instruments.key, def.key), eq(instruments.version, def.version)))
  .limit(1);

let id: string;

if (existing[0]) {
  // Refuse to rewrite a version that interviews already point at.
  const used = await db
    .select({ id: pulseChecks.id })
    .from(pulseChecks)
    .where(eq(pulseChecks.instrumentId, existing[0].id))
    .limit(1);

  if (used[0]) {
    console.error(
      `Refusing to overwrite ${def.key} v${def.version}: pulse checks already reference it.\n` +
        `Bump the version in the definition file and seed that instead.`,
    );
    process.exit(1);
  }

  await db
    .update(instruments)
    .set({ label: def.label, definition: def, publishedAt: new Date() })
    .where(eq(instruments.id, existing[0].id));
  id = existing[0].id;
  console.log(`Updated ${def.key} v${def.version}`);
} else {
  const inserted = await db
    .insert(instruments)
    .values({
      key: def.key,
      version: def.version,
      label: def.label,
      definition: def,
      publishedAt: new Date(),
    })
    .returning({ id: instruments.id });
  id = inserted[0]!.id;
  console.log(`Inserted ${def.key} v${def.version}`);
}

// Exactly one current version per key — the partial unique index enforces it,
// so clear the others first.
await db
  .update(instruments)
  .set({ isCurrent: false })
  .where(and(eq(instruments.key, def.key), ne(instruments.id, id)));

await db.update(instruments).set({ isCurrent: true }).where(eq(instruments.id, id));

// A quick shape report, so a transcription slip shows up here rather than
// halfway through a client call.
const numbered = def.segments.flatMap((s) => s.questions).filter((q) => q.n);
const unnumbered = def.segments.flatMap((s) => s.questions).filter((q) => !q.n);
const moduleQs = def.modules.flatMap((m) => m.questions);

console.log(`  numbered questions:   ${numbered.length} (expect 22)`);
console.log(`  unnumbered questions: ${unnumbered.length} (one_thing + q_last)`);
console.log(`  modules:              ${def.modules.length} (expect 5), ${moduleQs.length} questions`);
console.log(`  prep:                 ${def.prep.items.length} checks, ${def.prep.fields.length} fields`);
console.log(`  segments:             ${def.segments.map((s) => s.key).join(', ')}`);

const numbers = numbered.map((q) => q.n!).sort((a, b) => a - b);
const missing = Array.from({ length: 22 }, (_, i) => i + 1).filter((n) => !numbers.includes(n));
if (missing.length) {
  console.error(`  ✗ missing question numbers: ${missing.join(', ')}`);
  process.exit(1);
}

const dupes = new Set<string>();
const seen = new Set<string>();
for (const q of [...def.prep.fields, ...def.segments.flatMap((s) => s.questions), ...moduleQs]) {
  if (seen.has(q.key)) dupes.add(q.key);
  seen.add(q.key);
}
if (dupes.size) {
  console.error(`  ✗ duplicate question keys: ${[...dupes].join(', ')}`);
  process.exit(1);
}

console.log('  ✓ all 22 numbered questions present, no duplicate keys');
process.exit(0);
