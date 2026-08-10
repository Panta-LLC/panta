export const prerender = false;

import type { APIRoute } from 'astro';
import { z } from 'zod';

import { requireUser } from '../../../lib/auth/guard.ts';
import { deleteTask, updateTask, TASK_STATUSES } from '../../../lib/db/queries/tasks.ts';

const Body = z.object({
  title: z.string().min(1).optional(),
  detail: z.string().nullable().optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.number().int().min(0).max(3).optional(),
  dueAt: z.string().nullable().optional(),
});

export const PATCH: APIRoute = async ({ request, params, locals }) => {
  requireUser(locals);

  const id = params.id;
  if (!id) return new Response('missing id', { status: 400 });

  let input;
  try {
    input = Body.parse(await request.json());
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'bad payload' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const { dueAt, ...rest } = input;
  await updateTask(id, {
    ...rest,
    ...(dueAt !== undefined
      ? { dueAt: dueAt ? new Date(`${dueAt}T23:59:00`) : null }
      : {}),
  });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'content-type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  requireUser(locals);

  const id = params.id;
  if (!id) return new Response('missing id', { status: 400 });

  await deleteTask(id);
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'content-type': 'application/json' },
  });
};
