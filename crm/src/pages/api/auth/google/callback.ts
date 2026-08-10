export const prerender = false;

import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';

import { db } from '../../../../lib/db/client.ts';
import { appUser } from '../../../../lib/db/schema.ts';
import {
  decodeIdToken,
  exchangeCode,
  googleConfig,
  OAUTH_STATE_COOKIE,
} from '../../../../lib/auth/google.ts';
import {
  createSession,
  safeEqual,
  SESSION_COOKIE,
  sessionCookieOptions,
} from '../../../../lib/auth/session.ts';

/**
 * Finish sign-in.
 *
 * The allowlist check is the whole access-control model: one address, checked
 * against the *verified* email in Google's id_token. There is no account
 * creation path, so a stranger who completes Google's flow perfectly still
 * gets nothing.
 */
export const GET: APIRoute = async ({ url, cookies, redirect, request, clientAddress }) => {
  const fail = (reason: string) => {
    cookies.delete(OAUTH_STATE_COOKIE, { path: '/' });
    return redirect(`/login?error=${reason}`, 302);
  };

  const stash = cookies.get(OAUTH_STATE_COOKIE)?.value;
  if (!stash) return fail('state');

  let expected: { state: string; codeVerifier: string; next: string };
  try {
    expected = JSON.parse(stash);
  } catch {
    return fail('state');
  }

  const returnedState = url.searchParams.get('state');
  const code = url.searchParams.get('code');
  if (!returnedState || !code || !safeEqual(returnedState, expected.state)) {
    return fail('state');
  }

  let identity;
  try {
    const tokens = await exchangeCode(code, expected.codeVerifier);
    identity = decodeIdToken(tokens.id_token);
  } catch (err) {
    console.error('auth: token exchange failed', err instanceof Error ? err.message : err);
    return fail('exchange');
  }

  if (!identity.emailVerified) return fail('unverified');

  const { allowedEmail } = googleConfig();
  if (!allowedEmail || identity.email !== allowedEmail) {
    // Worth a log line: on a private tool, a rejected sign-in is the only
    // signal that someone found the URL.
    console.warn(`auth: rejected sign-in for ${identity.email}`);
    return fail('not_allowed');
  }

  // Upsert on google_sub rather than email — the sub is stable if the address
  // ever changes, and it is what Google guarantees is unique.
  const existing = await db
    .select({ id: appUser.id })
    .from(appUser)
    .where(eq(appUser.googleSub, identity.sub))
    .limit(1);

  let userId = existing[0]?.id;
  if (userId) {
    await db
      .update(appUser)
      .set({ email: identity.email, displayName: identity.name, lastLoginAt: new Date() })
      .where(eq(appUser.id, userId));
  } else {
    const inserted = await db
      .insert(appUser)
      .values({
        email: identity.email,
        displayName: identity.name,
        googleSub: identity.sub,
        lastLoginAt: new Date(),
      })
      .returning({ id: appUser.id });
    userId = inserted[0]!.id;
  }

  const { token } = await createSession(userId, {
    userAgent: request.headers.get('user-agent'),
    ip: clientAddress,
  });

  cookies.set(SESSION_COOKIE, token, sessionCookieOptions(url.protocol === 'https:'));
  cookies.delete(OAUTH_STATE_COOKIE, { path: '/' });

  return redirect(expected.next || '/', 302);
};
