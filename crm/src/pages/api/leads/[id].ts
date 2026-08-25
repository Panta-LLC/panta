export const prerender = false;

import type { APIRoute } from 'astro';

import { requireUser } from '../../../lib/auth/guard.ts';
import { setLeadStatus, updateLeadNotes } from '../../../lib/db/queries/leads.ts';

/**
 * Triage actions, posted as ordinary forms from the lead page.
 *
 * Forms rather than fetch(), and 303 rather than JSON, because there is no
 * React island on this page and adding one to change a status would be a
 * hydration boundary bought for nothing. Everything here works with
 * JavaScript off.
 *
 * `convert` is deliberately NOT one of these actions — it writes to four
 * tables and has its own route.
 */
export const POST: APIRoute = async ({ request, params, redirect, locals }) => {
  requireUser(locals);

  const id = params.id;
  if (!id) return new Response('missing id', { status: 400 });

  const form = await request.formData();
  const action = String(form.get('action') ?? '');

  if (action === 'status') {
    const status = String(form.get('status') ?? '');
    // 'converted' can only be reached through the convert route, which is what
    // actually creates the client. Setting it by hand here would leave a lead
    // marked converted with no client behind it.
    if (status === 'converted') return new Response('use /convert', { status: 400 });

    try {
      await setLeadStatus(id, status, String(form.get('dispositionReason') ?? ''));
    } catch {
      return redirect(`/leads/${id}?error=status`, 303);
    }
    return redirect(`/leads/${id}`, 303);
  }

  if (action === 'notes') {
    await updateLeadNotes(id, String(form.get('internalNotes') ?? ''));
    return redirect(`/leads/${id}#notes`, 303);
  }

  return new Response('unknown action', { status: 400 });
};
