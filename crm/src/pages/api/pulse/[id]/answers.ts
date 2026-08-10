export const prerender = false;

import type { APIRoute } from 'astro';
import { z } from 'zod';

import { requireUser } from '../../../../lib/auth/guard.ts';
import { patchPulseAnswers } from '../../../../lib/db/queries/pulse.ts';

/**
 * Autosave during a live interview.
 *
 * Takes only the keys that changed since the client's last ack, and merges
 * them server-side with JSONB `||`. Two requests in flight that touch
 * different questions therefore both survive; a read-modify-write here would
 * silently drop one, during the single activity where losing data is
 * unacceptable.
 *
 * Always returns JSON, never a redirect — the caller is a fetch() from the
 * wizard island, and a redirect would be parsed as a successful save.
 */
const AnswerValue = z.object({
  v: z.union([z.string(), z.number(), z.null()]),
  at: z.string().optional(),
});

const TrackTwoValue = z.object({
  checked: z.boolean().optional(),
  note: z.string().optional(),
});

const Body = z.object({
  answers: z.record(z.string(), AnswerValue).optional(),
  trackTwo: z.record(z.string(), TrackTwoValue).optional(),
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export const PATCH: APIRoute = async ({ request, params, locals }) => {
  requireUser(locals);

  const id = params.id;
  if (!id) return json({ ok: false, error: 'missing id' }, 400);

  let parsed;
  try {
    parsed = Body.parse(await request.json());
  } catch {
    return json({ ok: false, error: 'bad payload' }, 400);
  }

  if (!parsed.answers && !parsed.trackTwo) {
    return json({ ok: false, error: 'nothing to save' }, 400);
  }

  const result = await patchPulseAnswers(id, parsed);
  if (!result) return json({ ok: false, error: 'not found' }, 404);

  return json({ ok: true, rev: result.rev, savedAt: result.updatedAt });
};

/**
 * sendBeacon cannot issue a PATCH, so the pagehide flush arrives as a POST.
 * Same handler — losing the last few seconds of an interview because the tab
 * was closed is exactly the failure this endpoint exists to prevent.
 */
export const POST: APIRoute = (ctx) => PATCH(ctx);
