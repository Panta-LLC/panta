export const prerender = false;

import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';

import { requireUser } from '../../../../lib/auth/guard.ts';
import { db } from '../../../../lib/db/client.ts';
import { pulseChecks, readouts } from '../../../../lib/db/schema.ts';
import { CAPACITIES } from '../../../../lib/db/schema.ts';

/** Text columns editable from the capture sheet. */
const TEXT_FIELDS = [
  'triggerText',
  'goalInTheirWords',
  'fiveSecondRead',
  'whatTheyActuallyDo',
  'findNoticed',
  'trustNoticed',
  'chooseNoticed',
  'honestReplyTime',
  'lockedAssets',
  'decisionMaker',
  'oneThingSaidOutLoud',
  'planShapedNotAnswered',
] as const;

export const POST: APIRoute = async ({ request, params, redirect, locals }) => {
  requireUser(locals);

  const id = params.id;
  if (!id) return new Response('missing id', { status: 400 });

  const form = await request.formData();
  const values: Record<string, unknown> = {};

  for (const field of TEXT_FIELDS) {
    values[field] = String(form.get(field) ?? '').trim() || null;
  }

  const steps = String(form.get('stepsToContact') ?? '').trim();
  const parsedSteps = Number.parseInt(steps, 10);
  values.stepsToContact = Number.isFinite(parsedSteps) ? parsedSteps : null;

  // Only a value the instrument actually offers. A hand-edited select must not
  // be able to put an unknown string into a column the readout reasons over.
  const capacity = String(form.get('capacity') ?? '');
  values.capacity = (CAPACITIES as readonly string[]).includes(capacity) ? capacity : null;

  values.updatedAt = new Date();

  await db.update(pulseChecks).set(values).where(eq(pulseChecks.id, id));

  const action = String(form.get('action') ?? 'save');
  if (action !== 'readout') return redirect(`/pulse/${id}/capture`, 303);

  // One readout per pulse check; opening it twice must not create a second.
  const existing = await db
    .select({ id: readouts.id })
    .from(readouts)
    .where(eq(readouts.pulseCheckId, id))
    .limit(1);

  if (!existing[0]) {
    await db.insert(readouts).values({
      pulseCheckId: id,
      // Three empty slots, so the shape of the document is the default rather
      // than something to remember to create.
      observations: [
        { artifact: '', body: '', quoteRefs: [] },
        { artifact: '', body: '', quoteRefs: [] },
        { artifact: '', body: '', quoteRefs: [] },
      ],
    });
    await db
      .update(pulseChecks)
      .set({ status: 'readout_drafted' })
      .where(eq(pulseChecks.id, id));
  }

  return redirect(`/readouts/${id}`, 303);
};
