/**
 * Opaque server-side sessions.
 *
 * The cookie carries 32 random bytes and nothing else — no JWT, no claims, no
 * signature to verify. The database stores only sha256(token), so a leaked
 * dump or a stray `select * from sessions` yields nothing replayable. Logging
 * out everywhere is a DELETE, which is the entire incident-response plan for a
 * lost phone.
 */
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { eq, and, gt, lt } from 'drizzle-orm';

import { db } from '../db/client.ts';
import { sessions, appUser } from '../db/schema.ts';

export const SESSION_COOKIE = 'panta_crm_session';

/** 30 days. Rolling — see touchSession below. */
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
/** Only extend the expiry when the session is more than an hour stale. */
const TOUCH_AFTER_MS = 60 * 60 * 1000;

/** The stored id for a raw cookie token. */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export type SessionUser = {
  id: string;
  email: string;
  displayName: string | null;
};

/**
 * Mint a session and return the raw token to put in the cookie. The raw token
 * is never stored and never logged — this return value is the only time it
 * exists.
 */
export async function createSession(
  userId: string,
  meta: { userAgent?: string | null; ip?: string | null } = {},
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.insert(sessions).values({
    id: hashToken(token),
    userId,
    expiresAt,
    userAgent: meta.userAgent?.slice(0, 500) ?? null,
    // `inet` rejects a malformed address, and a bad X-Forwarded-For should not
    // be able to fail a login.
    ip: meta.ip && /^[0-9a-fA-F:.]+$/.test(meta.ip) ? meta.ip : null,
  });

  return { token, expiresAt };
}

/**
 * Resolve a cookie token to a user, or null. Expired rows never resolve, even
 * if the sweep below has not run.
 */
export async function resolveSession(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;

  const id = hashToken(token);
  const rows = await db
    .select({
      sessionId: sessions.id,
      lastSeenAt: sessions.lastSeenAt,
      userId: appUser.id,
      email: appUser.email,
      displayName: appUser.displayName,
    })
    .from(sessions)
    .innerJoin(appUser, eq(sessions.userId, appUser.id))
    .where(and(eq(sessions.id, id), gt(sessions.expiresAt, new Date())))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  // Rolling expiry, but only once an hour — otherwise every request on a page
  // with a few subrequests writes to the database for no reason.
  if (Date.now() - row.lastSeenAt.getTime() > TOUCH_AFTER_MS) {
    await db
      .update(sessions)
      .set({ lastSeenAt: new Date(), expiresAt: new Date(Date.now() + SESSION_TTL_MS) })
      .where(eq(sessions.id, row.sessionId));
  }

  return { id: row.userId, email: row.email, displayName: row.displayName };
}

/** Sign out this device. */
export async function destroySession(token: string | undefined): Promise<void> {
  if (!token) return;
  await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
}

/** Sign out everywhere. The one-button answer to a lost or stolen device. */
export async function destroyAllSessions(userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

/** Housekeeping; safe to call whenever. */
export async function sweepExpiredSessions(): Promise<void> {
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}

/**
 * Constant-time string compare for the OAuth `state` nonce and the cron bearer
 * token. Both are short secrets compared on every request, which is exactly
 * where a byte-by-byte `===` leaks length and prefix information.
 */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Cookie attributes, in one place so the flags cannot drift between routes. */
export function sessionCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    // Lax, not Strict: the OAuth callback is a cross-site redirect back from
    // accounts.google.com, and Strict would withhold the cookie on arrival.
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  };
}
