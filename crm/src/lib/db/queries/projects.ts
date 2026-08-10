import { eq, desc, sql } from 'drizzle-orm';

import { db } from '../client.ts';
import { clients, projects, pulseChecks } from '../schema.ts';

/**
 * Project kinds, from digital-presence-service-definition.md §6 — the offers
 * that sit downstream of a Pulse Check. Kept as a closed list so the pipeline
 * describes the same five things every time rather than drifting into
 * free text.
 */
export const PROJECT_KIND_LABELS: Record<string, string> = {
  digital_presence_plan: 'Digital Presence Plan',
  brand_foundation: 'Brand Foundation',
  web_presence_build: 'Web Presence Build',
  custom_tool_build: 'Custom Tool Build',
  growth_retainer: 'Growth Retainer',
  other: 'Other',
};

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  proposed: 'Proposed',
  active: 'Active',
  paused: 'Paused',
  delivered: 'Delivered',
  closed: 'Closed',
  lost: 'Lost',
};

/** Statuses that still represent live work, for the dashboard and filters. */
export const OPEN_STATUSES = ['proposed', 'active', 'paused'] as const;

export async function listProjects() {
  return db
    .select({
      id: projects.id,
      name: projects.name,
      kind: projects.kind,
      status: projects.status,
      priceCents: projects.priceCents,
      dueOn: projects.dueOn,
      startedOn: projects.startedOn,
      clientId: clients.id,
      clientName: clients.name,
    })
    .from(projects)
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .orderBy(desc(projects.createdAt));
}

export async function listProjectsForClient(clientId: string) {
  return db
    .select()
    .from(projects)
    .where(eq(projects.clientId, clientId))
    .orderBy(desc(projects.createdAt));
}

export async function getProject(id: string) {
  const rows = await db
    .select({ project: projects, client: clients })
    .from(projects)
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(projects.id, id))
    .limit(1);

  return rows[0] ?? null;
}

export async function createProject(input: {
  clientId: string;
  name: string;
  kind?: string | null;
  status?: string;
  originatingPulseCheckId?: string | null;
  priceCents?: number | null;
  dueOn?: Date | null;
  summary?: string | null;
}) {
  const rows = await db
    .insert(projects)
    .values({
      clientId: input.clientId,
      name: input.name.trim(),
      kind: input.kind || null,
      status: input.status || 'proposed',
      // Recording which Pulse Check led here gives the conversion view for
      // free — how often a free review turns into paid work, and which of the
      // priority-ladder rules preceded the ones that did.
      originatingPulseCheckId: input.originatingPulseCheckId || null,
      priceCents: input.priceCents ?? null,
      dueOn: input.dueOn ?? null,
      summary: input.summary?.trim() || null,
    })
    .returning();

  return rows[0]!;
}

export async function updateProject(
  id: string,
  values: Partial<{
    name: string;
    kind: string | null;
    status: string;
    priceCents: number | null;
    startedOn: Date | null;
    dueOn: Date | null;
    closedOn: Date | null;
    summary: string | null;
    notes: string | null;
  }>,
) {
  await db
    .update(projects)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(projects.id, id));
}

/**
 * Pulse Checks for a client that have no project yet — the candidates when
 * creating one, so the link back is a choice rather than something to
 * remember.
 */
export async function unlinkedPulseChecks(clientId: string) {
  return db
    .select({
      id: pulseChecks.id,
      endedAt: pulseChecks.endedAt,
      oneThing: pulseChecks.oneThingSaidOutLoud,
    })
    .from(pulseChecks)
    .where(
      sql`${pulseChecks.clientId} = ${clientId}
        and ${pulseChecks.isRehearsal} = false
        and not exists (
          select 1 from ${projects}
          where ${projects.originatingPulseCheckId} = ${pulseChecks.id}
        )`,
    )
    .orderBy(desc(pulseChecks.createdAt));
}

/** Money in, formatted. Stored as cents so nothing is ever a float. */
export function fmtPrice(cents: number | null | undefined): string {
  if (cents == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
