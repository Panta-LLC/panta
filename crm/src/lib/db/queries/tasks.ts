import { eq, and, or, isNull, asc, sql, inArray } from 'drizzle-orm';

import { db } from '../client.ts';
import { clients, projects, tasks } from '../schema.ts';

export const TASK_STATUSES = ['open', 'doing', 'blocked', 'done', 'dropped'] as const;

export const TASK_STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  doing: 'Doing',
  blocked: 'Blocked',
  done: 'Done',
  dropped: 'Dropped',
};

/** Statuses that still want attention. Everything else is history. */
export const LIVE_STATUSES = ['open', 'doing', 'blocked'] as const;

export const PRIORITY_LABELS: Record<number, string> = {
  0: 'Now',
  1: 'Next',
  2: 'Soon',
  3: 'Someday',
};

export type TaskRow = {
  id: string;
  title: string;
  detail: string | null;
  status: string;
  priority: number;
  dueAt: Date | null;
  doneAt: Date | null;
  createdFrom: string;
  clientId: string | null;
  clientName: string | null;
  projectId: string | null;
  projectName: string | null;
};

const selection = {
  id: tasks.id,
  title: tasks.title,
  detail: tasks.detail,
  status: tasks.status,
  priority: tasks.priority,
  dueAt: tasks.dueAt,
  doneAt: tasks.doneAt,
  createdFrom: tasks.createdFrom,
  clientId: tasks.clientId,
  clientName: clients.name,
  projectId: tasks.projectId,
  projectName: projects.name,
};

/**
 * Ordering is deliberate and the same everywhere: overdue and dated work
 * first, then by priority, then oldest. Sorting by creation date alone would
 * bury the thing with a deadline under whatever you thought of most recently.
 */
const ordering = [
  sql`case when ${tasks.dueAt} is null then 1 else 0 end`,
  asc(tasks.dueAt),
  asc(tasks.priority),
  asc(tasks.createdAt),
];

export async function listTasks(opts: { includeDone?: boolean } = {}) {
  const statuses = opts.includeDone
    ? [...LIVE_STATUSES, 'done', 'dropped']
    : [...LIVE_STATUSES];

  return db
    .select(selection)
    .from(tasks)
    .leftJoin(clients, eq(tasks.clientId, clients.id))
    .leftJoin(projects, eq(tasks.projectId, projects.id))
    .where(inArray(tasks.status, statuses))
    .orderBy(...ordering);
}

/**
 * Tasks for a project — including any attached to the client but not to a
 * specific project, since during delivery the distinction is rarely how you
 * think about the work.
 */
export async function listTasksForProject(projectId: string, clientId: string) {
  return db
    .select(selection)
    .from(tasks)
    .leftJoin(clients, eq(tasks.clientId, clients.id))
    .leftJoin(projects, eq(tasks.projectId, projects.id))
    .where(
      or(
        eq(tasks.projectId, projectId),
        and(eq(tasks.clientId, clientId), isNull(tasks.projectId)),
      ),
    )
    .orderBy(...ordering);
}

export async function createTask(input: {
  title: string;
  detail?: string | null;
  clientId?: string | null;
  projectId?: string | null;
  pulseCheckId?: string | null;
  priority?: number;
  dueAt?: Date | null;
  createdFrom?: string;
}) {
  const rows = await db
    .insert(tasks)
    .values({
      title: input.title.trim(),
      detail: input.detail?.trim() || null,
      clientId: input.clientId || null,
      projectId: input.projectId || null,
      pulseCheckId: input.pulseCheckId || null,
      priority: input.priority ?? 2,
      dueAt: input.dueAt ?? null,
      createdFrom: input.createdFrom ?? 'manual',
    })
    .returning({ id: tasks.id });

  return rows[0]!;
}

export async function updateTask(
  id: string,
  values: Partial<{
    title: string;
    detail: string | null;
    status: string;
    priority: number;
    dueAt: Date | null;
  }>,
) {
  const patch: Record<string, unknown> = { ...values, updatedAt: new Date() };

  // doneAt is derived from status rather than passed in, so the two can never
  // disagree about whether something is finished.
  if (values.status === 'done') patch.doneAt = new Date();
  else if (values.status && values.status !== 'done') patch.doneAt = null;

  await db.update(tasks).set(patch).where(eq(tasks.id, id));
}

export async function deleteTask(id: string) {
  await db.delete(tasks).where(eq(tasks.id, id));
}

/** Counts for the nav badge and dashboard. Overdue is what actually matters. */
export async function taskCounts() {
  const rows = await db
    .select({
      live: sql<number>`count(*) filter (where ${tasks.status} in ('open','doing','blocked'))`.mapWith(Number),
      overdue: sql<number>`count(*) filter (
        where ${tasks.status} in ('open','doing','blocked')
          and ${tasks.dueAt} is not null
          and ${tasks.dueAt} < now()
      )`.mapWith(Number),
    })
    .from(tasks);

  return rows[0] ?? { live: 0, overdue: 0 };
}
