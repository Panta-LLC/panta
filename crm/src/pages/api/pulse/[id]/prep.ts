export const prerender = false;

import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';

import { requireUser } from '../../../../lib/auth/guard.ts';
import { db } from '../../../../lib/db/client.ts';
import { pulseChecks } from '../../../../lib/db/schema.ts';
import { getPulseCheck, patchPulsePrep } from '../../../../lib/db/queries/pulse.ts';

/**
 * Save the pre-call checklist.
 *
 * Field names are prefixed (`check:` / `field:`) so a checklist item and a
 * text field can share a key without colliding, and so the handler never has
 * to guess which of the two a form key refers to.
 */
export const POST: APIRoute = async ({ request, params, redirect, locals }) => {
  requireUser(locals);

  const id = params.id;
  if (!id) return new Response('missing id', { status: 400 });

  const check = await getPulseCheck(id);
  if (!check) return new Response('not found', { status: 404 });

  const form = await request.formData();
  const patch: Record<string, { v: string | null }> = {};

  const knownChecks = new Set(check.instrumentDefinition.prep.items.map((i) => i.key));
  const knownFields = new Map(
    check.instrumentDefinition.prep.fields.map((f) => [f.key, f]),
  );
  const locked = Boolean(check.pulse.fiveSecondReadLockedAt);

  for (const key of knownChecks) {
    patch[key] = { v: form.get(`check:${key}`) ? 'yes' : null };
  }

  for (const [key, field] of knownFields) {
    // A locked field is not merely disabled in the markup — the server refuses
    // it too. A disabled input is a suggestion; this is the actual rule.
    if (field.lockOnCallStart && locked) continue;
    const raw = String(form.get(`field:${key}`) ?? '').trim();
    patch[key] = { v: raw || null };
  }

  await patchPulsePrep(id, patch);

  const fiveSecond = patch['five_second_read']?.v ?? null;

  await db
    .update(pulseChecks)
    .set({
      // Only advance the status; never walk it backwards from in_call.
      status: check.pulse.status === 'scheduled' ? 'prepped' : check.pulse.status,
      prepCompletedAt: check.pulse.prepCompletedAt ?? new Date(),
      // Mirror onto the promoted column now so the capture sheet and the
      // readout have it even if the call is never formally started.
      fiveSecondRead: locked ? check.pulse.fiveSecondRead : fiveSecond,
      updatedAt: new Date(),
    })
    .where(eq(pulseChecks.id, id));

  const action = String(form.get('action') ?? 'save');
  return redirect(action === 'start' ? `/pulse/${id}/run` : `/pulse/${id}/prep`, 303);
};
