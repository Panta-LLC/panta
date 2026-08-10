export const prerender = false;

import type { APIRoute } from 'astro';

import {
  destroyAllSessions,
  destroySession,
  SESSION_COOKIE,
} from '../../../lib/auth/session.ts';

/**
 * Sign out. `all=1` drops every session for the user — the one-button answer
 * to a lost or stolen phone, and the only incident response this app needs.
 */
export const POST: APIRoute = async ({ cookies, redirect, request, locals }) => {
  const token = cookies.get(SESSION_COOKIE)?.value;

  const form = await request.formData().catch(() => null);
  const all = String(form?.get('all') ?? '') === '1';

  if (all && locals.user) {
    await destroyAllSessions(locals.user.id);
  } else {
    await destroySession(token);
  }

  cookies.delete(SESSION_COOKIE, { path: '/' });
  return redirect('/login', 303);
};
