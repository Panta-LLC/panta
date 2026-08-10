export const prerender = false;

import type { APIRoute } from 'astro';

import { requireUser } from '../../../lib/auth/guard.ts';
import { logManualInteraction } from '../../../lib/db/queries/interactions.ts';

export const POST: APIRoute = async ({ request, redirect, locals }) => {
  requireUser(locals);

  const form = await request.formData();
  const clientId = String(form.get('clientId') ?? '').trim();
  const body = String(form.get('body') ?? '').trim();

  // An empty note is a mis-click, not an entry. Bounce silently rather than
  // writing a blank row into the record of a relationship.
  if (!clientId || !body) return redirect(`/clients/${clientId || ''}`, 303);

  const occurredRaw = String(form.get('occurredAt') ?? '').trim();
  const occurred = occurredRaw ? new Date(occurredRaw) : new Date();

  await logManualInteraction({
    clientId,
    kind: String(form.get('kind') ?? 'note'),
    subject: String(form.get('subject') ?? ''),
    body,
    // An unparseable date must not silently become 1970 and sort the entry to
    // the bottom of the timeline forever.
    occurredAt: Number.isNaN(occurred.getTime()) ? new Date() : occurred,
  });

  return redirect(`/clients/${clientId}#timeline`, 303);
};
