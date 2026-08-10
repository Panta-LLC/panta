export const prerender = false;

import type { APIRoute } from 'astro';
import { z } from 'zod';

import { requireUser } from '../../../../lib/auth/guard.ts';
import { getPulseCheck, setModules } from '../../../../lib/db/queries/pulse.ts';

const Body = z.object({ modules: z.array(z.string()) });

/**
 * Toggle conditional modules mid-interview.
 *
 * Only keys the pinned instrument actually defines are accepted. Turning a
 * module off hides its questions but never deletes the answers — you find out
 * at minute 20 that the ads tangent mattered after all.
 */
export const PUT: APIRoute = async ({ request, params, locals }) => {
  requireUser(locals);

  const id = params.id;
  if (!id) return new Response('missing id', { status: 400 });

  const check = await getPulseCheck(id);
  if (!check) return new Response('not found', { status: 404 });

  let parsed;
  try {
    parsed = Body.parse(await request.json());
  } catch {
    return new Response('bad payload', { status: 400 });
  }

  const known = new Set(check.instrumentDefinition.modules.map((m) => m.key));
  const modules = parsed.modules.filter((k) => known.has(k));

  await setModules(id, modules);

  return new Response(JSON.stringify({ ok: true, modules }), {
    headers: { 'content-type': 'application/json' },
  });
};
