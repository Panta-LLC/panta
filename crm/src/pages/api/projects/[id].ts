export const prerender = false;

import type { APIRoute } from 'astro';

import { requireUser } from '../../../lib/auth/guard.ts';
import {
  getProject,
  updateProject,
  PROJECT_KIND_LABELS,
  PROJECT_STATUS_LABELS,
} from '../../../lib/db/queries/projects.ts';
import { logInteraction } from '../../../lib/db/queries/pulse.ts';

function priceToCents(raw: string): number | null {
  const cleaned = raw.replace(/[$,\s]/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

function date(raw: string): Date | null {
  const t = raw.trim();
  if (!t) return null;
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d;
}

export const POST: APIRoute = async ({ request, params, redirect, locals }) => {
  requireUser(locals);

  const id = params.id;
  if (!id) return new Response('missing id', { status: 400 });

  const before = await getProject(id);
  if (!before) return new Response('not found', { status: 404 });

  const form = await request.formData();

  const kindRaw = String(form.get('kind') ?? '');
  const statusRaw = String(form.get('status') ?? '');

  const status = statusRaw in PROJECT_STATUS_LABELS ? statusRaw : before.project.status;

  await updateProject(id, {
    name: String(form.get('name') ?? '').trim() || before.project.name,
    kind: kindRaw in PROJECT_KIND_LABELS ? kindRaw : null,
    status,
    priceCents: priceToCents(String(form.get('price') ?? '')),
    startedOn: date(String(form.get('startedOn') ?? '')),
    dueOn: date(String(form.get('dueOn') ?? '')),
    closedOn: date(String(form.get('closedOn') ?? '')),
    summary: String(form.get('summary') ?? '').trim() || null,
    notes: String(form.get('notes') ?? '').trim() || null,
  });

  // A status change is a real event in the relationship, so it belongs on the
  // timeline. Edits to price or notes are not — logging every keystroke-level
  // save would bury the things that actually happened.
  if (status !== before.project.status) {
    await logInteraction({
      clientId: before.client.id,
      source: 'system',
      kind: 'proposal',
      subject: `${before.project.name}: ${PROJECT_STATUS_LABELS[before.project.status] ?? before.project.status} → ${PROJECT_STATUS_LABELS[status] ?? status}`,
      entityType: 'project',
      entityId: id,
    });
  }

  return redirect(`/projects/${id}`, 303);
};
