export const prerender = false;

import type { APIRoute } from 'astro';

import { requireUser } from '../../../../lib/auth/guard.ts';
import { getPulseCheck, startCall } from '../../../../lib/db/queries/pulse.ts';

/**
 * Begin the call.
 *
 * Returns `{ startedAt, serverNow }` so the wizard can compute a clock offset
 * once and derive elapsed time from the server's start, not the browser's. A
 * refresh, a laptop sleep, or opening the run screen on a second device then
 * all show the same elapsed time — which a client-side counter starting at
 * zero would not.
 *
 * Also locks the five-second read. Both happen in one UPDATE so the note can
 * never be edited after the call has begun.
 */
export const POST: APIRoute = async ({ params, locals, request }) => {
  requireUser(locals);

  const id = params.id;
  if (!id) return new Response('missing id', { status: 400 });

  const check = await getPulseCheck(id);
  if (!check) return new Response('not found', { status: 404 });

  // The prep field may still be unsaved in the client when Start is pressed,
  // so accept it here rather than losing it. `coalesce` in the query means an
  // already-locked value always wins.
  let fiveSecondRead: string | null = null;
  try {
    const body = (await request.json()) as { fiveSecondRead?: string };
    fiveSecondRead = body.fiveSecondRead?.trim() || null;
  } catch {
    // No body is fine — Start with nothing typed is a legitimate move when the
    // call is in four minutes.
  }

  const result = await startCall(id, fiveSecondRead);

  return new Response(
    JSON.stringify({
      ok: true,
      startedAt: result?.startedAt,
      lockedAt: result?.fiveSecondReadLockedAt,
      serverNow: new Date().toISOString(),
    }),
    { headers: { 'content-type': 'application/json' } },
  );
};
