export const prerender = false;

import type { APIRoute } from 'astro';

import { requireUser } from '../../../lib/auth/guard.ts';
import { createProject, PROJECT_KIND_LABELS } from '../../../lib/db/queries/projects.ts';
import { updateClientStatus } from '../../../lib/db/queries/clients.ts';
import { logInteraction } from '../../../lib/db/queries/pulse.ts';

/** Dollars in the form, cents in the database — never a float. */
function priceToCents(raw: string): number | null {
  const cleaned = raw.replace(/[$,\s]/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

export const POST: APIRoute = async ({ request, redirect, locals }) => {
  requireUser(locals);

  const form = await request.formData();
  const clientId = String(form.get('clientId') ?? '').trim();
  const name = String(form.get('name') ?? '').trim();
  if (!clientId || !name) return redirect(`/clients/${clientId || ''}`, 303);

  const kindRaw = String(form.get('kind') ?? '');
  const kind = kindRaw in PROJECT_KIND_LABELS ? kindRaw : null;

  const dueRaw = String(form.get('dueOn') ?? '').trim();
  const dueOn = dueRaw ? new Date(dueRaw) : null;

  const project = await createProject({
    clientId,
    name,
    kind,
    status: String(form.get('status') ?? 'proposed'),
    originatingPulseCheckId: String(form.get('originatingPulseCheckId') ?? '') || null,
    priceCents: priceToCents(String(form.get('price') ?? '')),
    dueOn: dueOn && !Number.isNaN(dueOn.getTime()) ? dueOn : null,
    summary: String(form.get('summary') ?? ''),
  });

  // A project starting is the moment a lead becomes work, so the client's
  // stage moves with it rather than waiting to be remembered.
  await updateClientStatus(clientId, 'active');

  await logInteraction({
    clientId,
    source: 'system',
    kind: 'proposal',
    subject: `Project created: ${project.name}`,
    body: project.summary,
    entityType: 'project',
    entityId: project.id,
  });

  return redirect(`/projects/${project.id}`, 303);
};
