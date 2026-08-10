import { eq, desc, and, sql } from 'drizzle-orm';

import { db } from '../client.ts';
import { contacts, interactions } from '../schema.ts';

/**
 * A client's timeline.
 *
 * Reads only the `interactions` table, because Phase 1 has been writing
 * `pulse_check` and `readout_sent` rows into it since the day the wizard
 * shipped. That is why this view opens with real history instead of starting
 * empty on the day the feature landed.
 */
export async function listTimeline(clientId: string, limit = 200) {
  return db
    .select({
      id: interactions.id,
      source: interactions.source,
      kind: interactions.kind,
      direction: interactions.direction,
      occurredAt: interactions.occurredAt,
      subject: interactions.subject,
      body: interactions.body,
      messageCount: interactions.messageCount,
      entityType: interactions.entityType,
      entityId: interactions.entityId,
      externalThreadId: interactions.externalThreadId,
      contactName: contacts.name,
      contactEmail: contacts.email,
    })
    .from(interactions)
    .leftJoin(contacts, eq(interactions.contactId, contacts.id))
    .where(eq(interactions.clientId, clientId))
    .orderBy(desc(interactions.occurredAt))
    .limit(limit);
}

export type TimelineEntry = Awaited<ReturnType<typeof listTimeline>>[number];

/** Kinds a human can log by hand. Gmail-sourced rows are never created here. */
export const MANUAL_KINDS = ['note', 'call', 'meeting', 'email'] as const;

export async function logManualInteraction(input: {
  clientId: string;
  kind: string;
  body: string;
  subject?: string | null;
  occurredAt?: Date;
  direction?: string | null;
  contactId?: string | null;
}) {
  const kind = (MANUAL_KINDS as readonly string[]).includes(input.kind) ? input.kind : 'note';

  const rows = await db
    .insert(interactions)
    .values({
      clientId: input.clientId,
      // 'manual' from day one, so Phase 3b's Gmail rows are distinguishable
      // without a migration and without guessing from the shape of the row.
      source: 'manual',
      kind,
      direction: input.direction ?? null,
      occurredAt: input.occurredAt ?? new Date(),
      subject: input.subject?.trim() || null,
      body: input.body.trim(),
      contactId: input.contactId ?? null,
    })
    .returning({ id: interactions.id });

  return rows[0]!;
}

export async function deleteInteraction(id: string) {
  // Only hand-written rows are deletable. A pulse_check or readout_sent entry
  // is a record of something that actually happened, and removing it would
  // make the timeline disagree with the pulse_checks table.
  await db
    .delete(interactions)
    .where(and(eq(interactions.id, id), eq(interactions.source, 'manual')));
}

/** Counts per client for the clients index, in one query rather than N. */
export async function interactionCounts() {
  const rows = await db
    .select({
      clientId: interactions.clientId,
      total: sql<number>`count(*)`.mapWith(Number),
      lastAt: sql<Date>`max(${interactions.occurredAt})`,
    })
    .from(interactions)
    .groupBy(interactions.clientId);

  return new Map(rows.map((r) => [r.clientId, r]));
}
