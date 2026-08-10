export const prerender = false;

import type { APIRoute } from 'astro';

import { requireUser } from '../../../lib/auth/guard.ts';
import { createPulseCheck } from '../../../lib/db/queries/pulse.ts';

export const POST: APIRoute = async ({ request, redirect, locals }) => {
  requireUser(locals);

  const form = await request.formData();
  const clientId = String(form.get('clientId') ?? '').trim();
  if (!clientId) return redirect('/clients', 303);

  const check = await createPulseCheck({
    clientId,
    isRehearsal: String(form.get('isRehearsal') ?? '') === '1',
  });

  // Straight to prep: the five-minute look happens before the call, and the
  // five-second read has to be written before the answer is known.
  return redirect(`/pulse/${check.id}/prep`, 303);
};
