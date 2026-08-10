export const prerender = false;

import type { APIRoute } from 'astro';
import { z } from 'zod';

import { requireUser } from '../../../lib/auth/guard.ts';
import { createTask, listTasks } from '../../../lib/db/queries/tasks.ts';

const Body = z.object({
  title: z.string().min(1),
  detail: z.string().nullable().optional(),
  clientId: z.uuid().nullable().optional(),
  projectId: z.uuid().nullable().optional(),
  priority: z.number().int().min(0).max(3).optional(),
  dueAt: z.string().nullable().optional(),
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, locals }) => {
  requireUser(locals);

  let input;
  try {
    input = Body.parse(await request.json());
  } catch {
    return json({ ok: false, error: 'bad payload' }, 400);
  }

  // A bare date from <input type="date"> parses as UTC midnight, which shows
  // as the previous day in Pacific. Pin it to end-of-day local so "due the
  // 14th" is not overdue on the morning of the 14th.
  let dueAt: Date | null = null;
  if (input.dueAt) {
    const d = new Date(`${input.dueAt}T23:59:00`);
    dueAt = Number.isNaN(d.getTime()) ? null : d;
  }

  const { id } = await createTask({ ...input, dueAt });

  // Return the row as the list query shapes it, so the island can insert it
  // without re-fetching or guessing at the joined names.
  const all = await listTasks({ includeDone: true });
  const task = all.find((t) => t.id === id);

  return json({ ok: true, task });
};
