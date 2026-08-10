export const prerender = false;

import type { APIRoute } from 'astro';
import { z } from 'zod';

import { requireUser } from '../../../../lib/auth/guard.ts';
import { getReadout, saveReadout } from '../../../../lib/db/queries/readouts.ts';
import { lintReadout } from '../../../../lib/readout/lint.ts';
import { resolveInstrument } from '../../../../lib/instrument/resolve.ts';

const Body = z.object({
  observations: z.array(
    z.object({
      artifact: z.string().optional(),
      body: z.string().optional(),
      quoteRefs: z.array(z.string()).optional(),
    }),
  ),
  recWhat: z.string().nullable().optional(),
  recWhyFirst: z.string().nullable().optional(),
  recEffort: z.string().nullable().optional(),
  recMode: z.enum(['diy', 'bring_someone_in']).nullable().optional(),
  didntCover: z.string().nullable().optional(),
  ladderRule: z.number().int().min(1).max(4).nullable().optional(),
  ladderRationale: z.string().nullable().optional(),
});

/**
 * Autosave the readout, and re-run the lint server-side.
 *
 * The composer lints live in the browser for feedback, but the stored
 * `lint_state` is computed here — a client that has been edited, or is simply
 * running stale JavaScript, must not be able to record a document as clean
 * when it is not.
 */
export const PATCH: APIRoute = async ({ request, params, locals }) => {
  requireUser(locals);

  const id = params.id;
  if (!id) return new Response('missing id', { status: 400 });

  const row = await getReadout(id);
  if (!row) return new Response('not found', { status: 404 });

  let doc;
  try {
    doc = Body.parse(await request.json());
  } catch {
    return new Response('bad payload', { status: 400 });
  }

  const resolved = resolveInstrument(row.definition, row.pulse.modulesEnabled ?? []);
  const answers = (row.pulse.answers ?? {}) as Record<string, { v?: unknown }>;
  const answerTexts = resolved.segments
    .flatMap((s) => s.questions)
    .map((q) => answers[q.key]?.v)
    .filter((v): v is string => typeof v === 'string');

  const lint = lintReadout(doc, {
    answerTexts,
    goalInTheirWords: row.pulse.goalInTheirWords,
    capacity: row.pulse.capacity,
  });

  await saveReadout(id, {
    ...doc,
    quotesUsed: [...new Set(doc.observations.flatMap((o) => o.quoteRefs ?? []))],
    lintState: { blocking: lint.blocking, warnings: lint.warnings },
    charCount: lint.charCount,
    status: lint.blocking.length === 0 ? 'ready' : 'draft',
  } as never);

  return new Response(
    JSON.stringify({ ok: true, blocking: lint.blocking.length, charCount: lint.charCount }),
    { headers: { 'content-type': 'application/json' } },
  );
};
