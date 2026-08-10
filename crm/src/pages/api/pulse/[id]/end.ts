export const prerender = false;

import type { APIRoute } from 'astro';

import { requireUser } from '../../../../lib/auth/guard.ts';
import {
  endCall,
  getPulseCheck,
  logInteraction,
  savePromoted,
} from '../../../../lib/db/queries/pulse.ts';
import { updateClientStatus } from '../../../../lib/db/queries/clients.ts';
import { resolveInstrument, promotedValues } from '../../../../lib/instrument/resolve.ts';
import { fmtDateTime } from '../../../../lib/format.ts';

/** Columns the instrument's `promoteTo` keys are allowed to write. */
const PROMOTABLE = new Set([
  'triggerText',
  'goalInTheirWords',
  'fiveSecondRead',
  'whatTheyActuallyDo',
  'findNoticed',
  'trustNoticed',
  'chooseNoticed',
  'stepsToContact',
  'honestReplyTime',
  'lockedAssets',
  'capacity',
  'decisionMaker',
  'oneThingSaidOutLoud',
  'planShapedNotAnswered',
]);

/**
 * End the call and promote the capture-sheet fields.
 *
 * Promotion is driven by `promoteTo` in the instrument definition, filtered
 * through the allowlist above — so revising which answer feeds which column is
 * a data change, but a typo'd or hostile key can never reach an arbitrary
 * column.
 */
export const POST: APIRoute = async ({ params, locals, redirect }) => {
  requireUser(locals);

  const id = params.id;
  if (!id) return new Response('missing id', { status: 400 });

  const check = await getPulseCheck(id);
  if (!check) return new Response('not found', { status: 404 });

  const resolved = resolveInstrument(
    check.instrumentDefinition,
    check.pulse.modulesEnabled ?? [],
  );

  const promoted = promotedValues(
    resolved,
    (check.pulse.answers ?? {}) as Record<string, { v?: unknown }>,
    (check.pulse.prep ?? {}) as Record<string, { v?: unknown }>,
  );

  const safe = Object.fromEntries(
    Object.entries(promoted).filter(([k]) => PROMOTABLE.has(k)),
  );
  await savePromoted(id, safe);

  const result = await endCall(id);

  // The client's stage moves on its own; forgetting to do it by hand is how a
  // pipeline stops reflecting reality.
  await updateClientStatus(check.client.id, 'pulse_done');

  // Written now even though the timeline UI is Phase 2, so that when it ships
  // it opens with real history rather than starting empty.
  await logInteraction({
    clientId: check.client.id,
    source: 'pulse_check',
    kind: 'pulse_check',
    subject: 'Pulse Check held',
    body: result?.readoutDueAt
      ? `Readout due ${fmtDateTime(result.readoutDueAt)}.`
      : null,
    entityType: 'pulse_check',
    entityId: id,
  });

  return redirect(`/pulse/${id}/capture`, 303);
};
