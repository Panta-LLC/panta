export const prerender = false;

import type { APIRoute } from 'astro';

import { requireUser } from '../../../../lib/auth/guard.ts';
import { convertLead } from '../../../../lib/db/queries/leads.ts';

/**
 * Turn a lead into a client.
 *
 * `attachToClientId` is set when you picked one of the possible matches the
 * lead page offered — the organization is already in the system and this
 * referral should join its timeline rather than start a second record of it.
 * Left blank, a new client is created.
 *
 * Lands on the client, not back on the lead. The lead's job is finished at
 * this point and the next thing you want is the record you just made.
 */
export const POST: APIRoute = async ({ request, params, redirect, locals }) => {
  requireUser(locals);

  const id = params.id;
  if (!id) return new Response('missing id', { status: 400 });

  const form = await request.formData();
  const attachToClientId = String(form.get('attachToClientId') ?? '').trim() || null;

  try {
    const { clientId } = await convertLead(id, { attachToClientId });
    return redirect(`/clients/${clientId}`, 303);
  } catch (err) {
    console.error('convert lead failed', err);
    return redirect(`/leads/${id}?error=convert`, 303);
  }
};
