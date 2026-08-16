import { eq, and, desc, asc, sql, inArray, isNotNull } from 'drizzle-orm';

import { db } from '../client.ts';
import { clients, instruments, interactions, projects, pulseChecks, readouts } from '../schema.ts';
import type { InstrumentDefinition } from '../../instrument/types.ts';

/** Start a Pulse Check against the current instrument version. */
export async function createPulseCheck(input: {
  clientId: string;
  scheduledAt?: Date | null;
  isRehearsal?: boolean;
}) {
  const current = await db
    .select({ id: instruments.id })
    .from(instruments)
    .where(and(eq(instruments.key, 'pulse_check'), eq(instruments.isCurrent, true)))
    .limit(1);

  if (!current[0]) {
    throw new Error('No current pulse_check instrument. Run `pnpm db:seed`.');
  }

  const rows = await db
    .insert(pulseChecks)
    .values({
      clientId: input.clientId,
      // Pinned here and never updated — a later instrument revision must not
      // change what this interview claims to have asked.
      instrumentId: current[0].id,
      scheduledAt: input.scheduledAt ?? null,
      isRehearsal: input.isRehearsal ?? false,
    })
    .returning();

  return rows[0]!;
}

export type PulseCheckWithContext = Awaited<ReturnType<typeof getPulseCheck>>;

export async function getPulseCheck(id: string) {
  const rows = await db
    .select({
      pulse: pulseChecks,
      client: clients,
      instrumentDefinition: instruments.definition,
      instrumentLabel: instruments.label,
    })
    .from(pulseChecks)
    .innerJoin(clients, eq(pulseChecks.clientId, clients.id))
    .innerJoin(instruments, eq(pulseChecks.instrumentId, instruments.id))
    .where(eq(pulseChecks.id, id))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    ...row,
    instrumentDefinition: row.instrumentDefinition as InstrumentDefinition,
  };
}

export async function listPulseChecks() {
  return db
    .select({
      id: pulseChecks.id,
      status: pulseChecks.status,
      isRehearsal: pulseChecks.isRehearsal,
      scheduledAt: pulseChecks.scheduledAt,
      startedAt: pulseChecks.startedAt,
      endedAt: pulseChecks.endedAt,
      readoutDueAt: pulseChecks.readoutDueAt,
      clientId: clients.id,
      clientName: clients.name,
      createdAt: pulseChecks.createdAt,
    })
    .from(pulseChecks)
    .innerJoin(clients, eq(pulseChecks.clientId, clients.id))
    .orderBy(desc(pulseChecks.createdAt));
}

export async function listPulseChecksForClient(clientId: string) {
  return db
    .select()
    .from(pulseChecks)
    .where(eq(pulseChecks.clientId, clientId))
    .orderBy(desc(pulseChecks.createdAt));
}

/**
 * Readouts that are owed, soonest first.
 *
 * This is the dashboard's headline query because the 48-hour readout is the
 * only unconditional promise the offer makes — /consultation/ states it in
 * public, so it is a commitment rather than an intention. Rehearsals are
 * excluded; a practice run does not owe anybody a document.
 */
export async function listReadoutsDue() {
  return db
    .select({
      id: pulseChecks.id,
      clientName: clients.name,
      clientId: clients.id,
      endedAt: pulseChecks.endedAt,
      readoutDueAt: pulseChecks.readoutDueAt,
      status: pulseChecks.status,
      readoutStatus: readouts.status,
    })
    .from(pulseChecks)
    .innerJoin(clients, eq(pulseChecks.clientId, clients.id))
    .leftJoin(readouts, eq(readouts.pulseCheckId, pulseChecks.id))
    .where(
      and(
        eq(pulseChecks.isRehearsal, false),
        isNotNull(pulseChecks.readoutDueAt),
        inArray(pulseChecks.status, ['captured', 'readout_drafted']),
      ),
    )
    .orderBy(asc(pulseChecks.readoutDueAt));
}

export async function listUpcoming() {
  return db
    .select({
      id: pulseChecks.id,
      clientName: clients.name,
      scheduledAt: pulseChecks.scheduledAt,
      status: pulseChecks.status,
      prepCompletedAt: pulseChecks.prepCompletedAt,
    })
    .from(pulseChecks)
    .innerJoin(clients, eq(pulseChecks.clientId, clients.id))
    .where(inArray(pulseChecks.status, ['scheduled', 'prepped', 'in_call']))
    .orderBy(asc(sql`coalesce(${pulseChecks.scheduledAt}, ${pulseChecks.createdAt})`));
}

/**
 * The Sales row of the funnel dashboard — §4 of docs/FUNNEL-MEASUREMENT.md.
 *
 * The four rows above it (Awareness, Trust, Intent, Conversion) come from
 * Plausible and are not reproduced here: this returns only what analytics
 * physically cannot see, which is everything that happens after a booking.
 *
 * Quarterly, because the plan is explicit that monthly volume is too low to be
 * signal, and a number reported monthly gets reacted to monthly.
 *
 * Bucketed by `bookedAt`, not by when the outcome landed, so every row of a
 * quarter describes the same cohort of bookings. Bucketing by outcome date
 * would make the close rate a ratio between two different populations —
 * flattering in a slow quarter that finally closed last quarter's proposals.
 */
export async function getFunnelSummary(from: Date, to: Date) {
  const inQuarter = and(
    eq(pulseChecks.isRehearsal, false),
    sql`${pulseChecks.bookedAt} >= ${from}`,
    sql`${pulseChecks.bookedAt} < ${to}`,
  );

  const [totals] = await db
    .select({
      booked: sql<number>`count(*)::int`,
      // Held means the call actually ran. `endedAt` rather than `startedAt`:
      // a call opened and abandoned in the first minute is not a held call.
      held: sql<number>`count(*) filter (where ${pulseChecks.endedAt} is not null)::int`,
      noShow: sql<number>`count(*) filter (where ${pulseChecks.salesOutcome} = 'no_show')::int`,
      proposals: sql<number>`count(*) filter (where ${pulseChecks.salesOutcome} in ('proposal_sent', 'closed_won', 'closed_lost'))::int`,
      won: sql<number>`count(*) filter (where ${pulseChecks.salesOutcome} = 'closed_won')::int`,
      // Outcome still open. Watch this one: a quarter where most bookings sit
      // unresolved has ratios built on a handful of rows, and every number
      // below is noise until it drains.
      unresolved: sql<number>`count(*) filter (where ${pulseChecks.salesOutcome} is null and ${pulseChecks.endedAt} is not null)::int`,
    })
    .from(pulseChecks)
    .where(inQuarter);

  // Engagement value comes from the project, never from a copy of its price on
  // the pulse check — see the note in the schema. Joined through
  // originatingPulseCheckId so only work this quarter's calls produced counts.
  const [value] = await db
    .select({
      cents: sql<number>`coalesce(sum(${projects.priceCents}), 0)::int`,
      projectCount: sql<number>`count(${projects.id})::int`,
    })
    .from(pulseChecks)
    .innerJoin(projects, eq(projects.originatingPulseCheckId, pulseChecks.id))
    .where(inQuarter);

  // The verbatim answers. The plan calls this column the best marketing input
  // there is, and it is the reason the whole quarter is worth reading rather
  // than glancing at — so it is returned with the numbers, not behind a click.
  const answers = await db
    .select({
      id: pulseChecks.id,
      clientName: clients.name,
      bookedAt: pulseChecks.bookedAt,
      sourceVerbatim: pulseChecks.sourceVerbatim,
      sourceCategory: pulseChecks.sourceCategory,
      triggerText: pulseChecks.triggerText,
      serviceInterest: pulseChecks.serviceInterest,
      salesOutcome: pulseChecks.salesOutcome,
    })
    .from(pulseChecks)
    .innerJoin(clients, eq(pulseChecks.clientId, clients.id))
    .where(inQuarter)
    .orderBy(desc(pulseChecks.bookedAt));

  const bySource = await db
    .select({
      category: sql<string>`coalesce(${pulseChecks.sourceCategory}, '(not asked)')`,
      count: sql<number>`count(*)::int`,
    })
    .from(pulseChecks)
    .where(inQuarter)
    .groupBy(sql`coalesce(${pulseChecks.sourceCategory}, '(not asked)')`)
    .orderBy(desc(sql`count(*)`));

  return {
    from,
    to,
    booked: totals?.booked ?? 0,
    held: totals?.held ?? 0,
    noShow: totals?.noShow ?? 0,
    proposals: totals?.proposals ?? 0,
    won: totals?.won ?? 0,
    unresolved: totals?.unresolved ?? 0,
    valueCents: value?.cents ?? 0,
    projectCount: value?.projectCount ?? 0,
    bySource,
    answers,
  };
}

/**
 * Merge a patch into `answers` / `track_two` without reading first.
 *
 * `||` is a shallow merge on a flat JSONB object, so two autosave requests
 * that touch different questions both survive. A read-modify-write here would
 * silently drop whichever landed first — during a live interview, which is the
 * one place data loss is unacceptable.
 */
export async function patchPulseAnswers(
  id: string,
  patch: { answers?: Record<string, unknown>; trackTwo?: Record<string, unknown> },
) {
  const rows = await db
    .update(pulseChecks)
    .set({
      answers: patch.answers
        ? sql`${pulseChecks.answers} || ${JSON.stringify(patch.answers)}::jsonb`
        : sql`${pulseChecks.answers}`,
      trackTwo: patch.trackTwo
        ? sql`${pulseChecks.trackTwo} || ${JSON.stringify(patch.trackTwo)}::jsonb`
        : sql`${pulseChecks.trackTwo}`,
      rev: sql`${pulseChecks.rev} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(pulseChecks.id, id))
    .returning({ rev: pulseChecks.rev, updatedAt: pulseChecks.updatedAt });

  return rows[0] ?? null;
}

export async function patchPulsePrep(id: string, prep: Record<string, unknown>) {
  const rows = await db
    .update(pulseChecks)
    .set({
      prep: sql`${pulseChecks.prep} || ${JSON.stringify(prep)}::jsonb`,
      rev: sql`${pulseChecks.rev} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(pulseChecks.id, id))
    .returning({ rev: pulseChecks.rev, updatedAt: pulseChecks.updatedAt });

  return rows[0] ?? null;
}

export async function setModules(id: string, modules: string[]) {
  await db
    .update(pulseChecks)
    .set({ modulesEnabled: modules, updatedAt: new Date() })
    .where(eq(pulseChecks.id, id));
}

/**
 * Begin the call.
 *
 * Sets `started_at` server-side and locks the five-second read in the same
 * statement. The lock is the point: that note is only worth anything because
 * it was written before the answer was known, and an editable field would
 * decay into post-hoc rationalization within three calls.
 */
export async function startCall(id: string, fiveSecondRead: string | null) {
  const rows = await db
    .update(pulseChecks)
    .set({
      status: 'in_call',
      startedAt: sql`coalesce(${pulseChecks.startedAt}, now())`,
      fiveSecondRead: sql`coalesce(${pulseChecks.fiveSecondRead}, ${fiveSecondRead})`,
      fiveSecondReadLockedAt: sql`coalesce(${pulseChecks.fiveSecondReadLockedAt}, now())`,
      updatedAt: new Date(),
    })
    .where(eq(pulseChecks.id, id))
    .returning({
      startedAt: pulseChecks.startedAt,
      fiveSecondReadLockedAt: pulseChecks.fiveSecondReadLockedAt,
    });

  return rows[0] ?? null;
}

/**
 * End the call.
 *
 * `readout_due_at` is written in the same UPDATE as `ended_at` rather than
 * being a generated column, because Postgres rejects `timestamptz + interval`
 * as a generation expression (only STABLE, not IMMUTABLE). One statement means
 * the two still cannot drift apart.
 */
export async function endCall(id: string) {
  const rows = await db
    .update(pulseChecks)
    .set({
      status: 'captured',
      endedAt: sql`coalesce(${pulseChecks.endedAt}, now())`,
      readoutDueAt: sql`coalesce(${pulseChecks.endedAt}, now()) + interval '48 hours'`,
      updatedAt: new Date(),
    })
    .where(eq(pulseChecks.id, id))
    .returning({ endedAt: pulseChecks.endedAt, readoutDueAt: pulseChecks.readoutDueAt });

  return rows[0] ?? null;
}

/** Write the promoted capture-sheet columns. Keys are validated by the caller. */
export async function savePromoted(id: string, values: Record<string, unknown>) {
  if (!Object.keys(values).length) return;
  await db
    .update(pulseChecks)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(pulseChecks.id, id));
}

/**
 * Record something on a client's timeline.
 *
 * Called from Phase 1 even though the timeline UI does not ship until Phase 2,
 * so that when it does it opens with real history rather than starting blank
 * on the day the feature shipped.
 */
export async function logInteraction(input: {
  clientId: string;
  source: string;
  kind: string;
  subject?: string | null;
  body?: string | null;
  occurredAt?: Date;
  entityType?: string;
  entityId?: string;
}) {
  await db.insert(interactions).values({
    clientId: input.clientId,
    source: input.source,
    kind: input.kind,
    subject: input.subject ?? null,
    body: input.body ?? null,
    occurredAt: input.occurredAt ?? new Date(),
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
  });
}
