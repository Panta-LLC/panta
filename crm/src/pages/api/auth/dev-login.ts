export const prerender = false;

import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';

import { db } from '../../../lib/db/client.ts';
import { appUser } from '../../../lib/db/schema.ts';
import {
  createSession,
  SESSION_COOKIE,
  sessionCookieOptions,
} from '../../../lib/auth/session.ts';

/**
 * Local-only sign-in, so the app can be exercised end to end before the Google
 * Cloud Console setup exists.
 *
 * This is the one place worth being paranoid about, because a dev auth bypass
 * that survives into production is a total compromise. Two independent gates:
 *
 *  1. `import.meta.env.DEV` is statically replaced by Vite with `false` in any
 *     production build, so everything below it is dead-code-eliminated — the
 *     handler does not exist in the deployed bundle, regardless of env vars.
 *  2. `CRM_DEV_LOGIN=1` must also be set, so it does not fire by accident just
 *     because someone ran `astro dev`.
 *
 * DELETE THIS FILE once Google sign-in is configured. It has no other purpose.
 */
export const POST: APIRoute = async ({ cookies, redirect, url, request }) => {
  if (!import.meta.env.DEV || import.meta.env.CRM_DEV_LOGIN !== '1') {
    return new Response('Not found', { status: 404 });
  }

  const email = (import.meta.env.ALLOWED_EMAIL ?? 'dev@localhost').toLowerCase();

  const existing = await db
    .select({ id: appUser.id })
    .from(appUser)
    .where(eq(appUser.googleSub, 'dev-local'))
    .limit(1);

  const userId =
    existing[0]?.id ??
    (
      await db
        .insert(appUser)
        .values({
          email,
          displayName: 'Local dev',
          googleSub: 'dev-local',
          lastLoginAt: new Date(),
        })
        .returning({ id: appUser.id })
    )[0]!.id;

  const { token } = await createSession(userId, {
    userAgent: request.headers.get('user-agent'),
  });
  cookies.set(SESSION_COOKIE, token, sessionCookieOptions(url.protocol === 'https:'));

  console.warn('auth: DEV SIGN-IN USED — this endpoint does not exist in production builds');

  const form = await request.formData().catch(() => null);
  const requested = String(form?.get('next') ?? '/');
  const next = requested.startsWith('/') && !requested.startsWith('//') ? requested : '/';

  return redirect(next, 303);
};
