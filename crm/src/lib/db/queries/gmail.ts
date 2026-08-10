import { eq, sql, isNotNull, and, isNull } from 'drizzle-orm';

import { db } from '../client.ts';
import {
  clients,
  contacts,
  emailMatchQueue,
  gmailSyncState,
  googleAccounts,
  interactions,
} from '../schema.ts';
import { seal, open } from '../../crypto.ts';

// ── connected account ──────────────────────────────────────────────────────

export async function getGoogleAccount(userId: string) {
  const rows = await db
    .select()
    .from(googleAccounts)
    .where(and(eq(googleAccounts.userId, userId), isNull(googleAccounts.revokedAt)))
    .limit(1);
  return rows[0] ?? null;
}

/** Store or replace the connection. The refresh token is sealed before it lands. */
export async function upsertGoogleAccount(input: {
  userId: string;
  googleSub: string;
  email: string;
  scopes: string[];
  refreshToken: string;
  accessToken?: string | null;
  accessTokenExpiresAt?: Date | null;
}) {
  const refresh = seal(input.refreshToken);
  const access = input.accessToken ? seal(input.accessToken) : null;

  const values = {
    userId: input.userId,
    googleSub: input.googleSub,
    email: input.email.toLowerCase(),
    scopes: input.scopes,
    refreshTokenCt: refresh.ct,
    refreshTokenIv: refresh.iv,
    refreshTokenTag: refresh.tag,
    accessTokenCt: access?.ct ?? null,
    accessTokenIv: access?.iv ?? null,
    accessTokenTag: access?.tag ?? null,
    accessTokenExpiresAt: input.accessTokenExpiresAt ?? null,
    revokedAt: null,
    updatedAt: new Date(),
  };

  const rows = await db
    .insert(googleAccounts)
    .values(values)
    .onConflictDoUpdate({ target: googleAccounts.googleSub, set: values })
    .returning({ id: googleAccounts.id });

  return rows[0]!;
}

export function readRefreshToken(account: {
  refreshTokenCt: Buffer;
  refreshTokenIv: Buffer;
  refreshTokenTag: Buffer;
}): string {
  return open({
    ct: account.refreshTokenCt,
    iv: account.refreshTokenIv,
    tag: account.refreshTokenTag,
  });
}

export function readAccessToken(account: {
  accessTokenCt: Buffer | null;
  accessTokenIv: Buffer | null;
  accessTokenTag: Buffer | null;
}): string | null {
  if (!account.accessTokenCt || !account.accessTokenIv || !account.accessTokenTag) return null;
  return open({
    ct: account.accessTokenCt,
    iv: account.accessTokenIv,
    tag: account.accessTokenTag,
  });
}

export async function saveAccessToken(id: string, token: string, expiresAt: Date) {
  const sealed = seal(token);
  await db
    .update(googleAccounts)
    .set({
      accessTokenCt: sealed.ct,
      accessTokenIv: sealed.iv,
      accessTokenTag: sealed.tag,
      accessTokenExpiresAt: expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(googleAccounts.id, id));
}

/**
 * Mark the connection dead.
 *
 * Called when Google answers `invalid_grant`, which means the token was
 * revoked or expired. The right response is to stop and surface it, never to
 * retry — a loop against a revoked token is how an account gets rate-limited.
 */
export async function revokeGoogleAccount(id: string, reason: string) {
  await db
    .update(googleAccounts)
    .set({ revokedAt: new Date(), updatedAt: new Date() })
    .where(eq(googleAccounts.id, id));
  await db
    .update(gmailSyncState)
    .set({ lastError: reason })
    .where(eq(gmailSyncState.googleAccountId, id));
}

export async function disconnectGoogleAccount(id: string) {
  await db.delete(googleAccounts).where(eq(googleAccounts.id, id));
}

// ── sync state ─────────────────────────────────────────────────────────────

export async function getSyncState(googleAccountId: string) {
  const rows = await db
    .select()
    .from(gmailSyncState)
    .where(eq(gmailSyncState.googleAccountId, googleAccountId))
    .limit(1);

  if (rows[0]) return rows[0];

  const created = await db
    .insert(gmailSyncState)
    .values({ googleAccountId })
    .onConflictDoNothing()
    .returning();
  return created[0] ?? rows[0] ?? null;
}

export async function saveSyncState(
  googleAccountId: string,
  values: Partial<{
    lastHistoryId: string | null;
    lastFullSyncAt: Date | null;
    lastRunAt: Date | null;
    lastError: string | null;
    backfillCursor: string | null;
    backfillDone: boolean;
  }>,
) {
  await db
    .update(gmailSyncState)
    .set(values)
    .where(eq(gmailSyncState.googleAccountId, googleAccountId));
}

// ── the matching index ─────────────────────────────────────────────────────

export async function loadMatchIndexData() {
  const [contactRows, clientRows] = await Promise.all([
    db
      .select({ id: contacts.id, clientId: contacts.clientId, email: contacts.email })
      .from(contacts)
      .where(isNotNull(contacts.email)),
    db.select({ id: clients.id, domains: clients.domains }).from(clients),
  ]);

  return { contacts: contactRows, clients: clientRows };
}

// ── writing results ────────────────────────────────────────────────────────

/**
 * File a matched message onto a timeline.
 *
 * `ON CONFLICT DO NOTHING` against the unique (source, external_id) index is
 * what makes the whole sync idempotent: re-running after a crash, or after the
 * history cursor expires and forces a re-scan, inserts nothing twice.
 *
 * Returns true when a row was actually created.
 */
export async function fileMessage(input: {
  clientId: string;
  contactId?: string | null;
  externalId: string;
  threadId: string;
  direction: 'in' | 'out';
  occurredAt: Date;
  subject: string | null;
  snippet: string | null;
}): Promise<boolean> {
  const inserted = await db
    .insert(interactions)
    .values({
      clientId: input.clientId,
      contactId: input.contactId ?? null,
      source: 'gmail',
      kind: 'email',
      direction: input.direction,
      occurredAt: input.occurredAt,
      subject: input.subject,
      // Snippet only, never the body. Less to leak, and a timeline only needs
      // to jog memory — the message itself is one click away in Gmail.
      body: input.snippet,
      externalId: input.externalId,
      externalThreadId: input.threadId,
    })
    .onConflictDoNothing()
    .returning({ id: interactions.id });

  return inserted.length > 0;
}

/**
 * Collapse a reply into the thread's existing row rather than adding another.
 *
 * A fourteen-message thread rendered as fourteen timeline entries is noise;
 * one entry that says "14 messages" and links out is what you actually want.
 */
export async function bumpThread(input: {
  clientId: string;
  threadId: string;
  occurredAt: Date;
  snippet: string | null;
}): Promise<boolean> {
  const updated = await db
    .update(interactions)
    .set({
      messageCount: sql`${interactions.messageCount} + 1`,
      occurredAt: input.occurredAt,
      body: input.snippet,
    })
    .where(
      and(
        eq(interactions.source, 'gmail'),
        eq(interactions.externalThreadId, input.threadId),
        eq(interactions.clientId, input.clientId),
      ),
    )
    .returning({ id: interactions.id });

  return updated.length > 0;
}

export async function threadAlreadyFiled(threadId: string) {
  const rows = await db
    .select({ id: interactions.id, clientId: interactions.clientId })
    .from(interactions)
    .where(
      and(eq(interactions.source, 'gmail'), eq(interactions.externalThreadId, threadId)),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function queueForReview(input: {
  gmailMessageId: string;
  gmailThreadId: string;
  fromEmail: string | null;
  toEmails: string[];
  subject: string | null;
  snippet: string | null;
  occurredAt: Date;
  suggestedClientId: string | null;
  matchReason: string;
}) {
  await db
    .insert(emailMatchQueue)
    .values({ ...input })
    .onConflictDoNothing();
}

export async function listReviewQueue() {
  return db
    .select({
      id: emailMatchQueue.id,
      gmailMessageId: emailMatchQueue.gmailMessageId,
      gmailThreadId: emailMatchQueue.gmailThreadId,
      fromEmail: emailMatchQueue.fromEmail,
      subject: emailMatchQueue.subject,
      snippet: emailMatchQueue.snippet,
      occurredAt: emailMatchQueue.occurredAt,
      matchReason: emailMatchQueue.matchReason,
      suggestedClientId: emailMatchQueue.suggestedClientId,
      suggestedClientName: clients.name,
    })
    .from(emailMatchQueue)
    .leftJoin(clients, eq(emailMatchQueue.suggestedClientId, clients.id))
    .where(isNull(emailMatchQueue.resolvedAt))
    .orderBy(sql`${emailMatchQueue.occurredAt} desc`);
}

export async function resolveQueueItem(id: string, action: string) {
  await db
    .update(emailMatchQueue)
    .set({ resolvedAction: action, resolvedAt: new Date() })
    .where(eq(emailMatchQueue.id, id));
}

export async function getQueueItem(id: string) {
  const rows = await db
    .select()
    .from(emailMatchQueue)
    .where(eq(emailMatchQueue.id, id))
    .limit(1);
  return rows[0] ?? null;
}

/** Add a contact discovered by filing a queued message. */
export async function addContact(input: {
  clientId: string;
  name: string;
  email: string;
}) {
  const rows = await db
    .insert(contacts)
    .values({
      clientId: input.clientId,
      name: input.name,
      email: input.email.toLowerCase(),
    })
    .onConflictDoNothing()
    .returning({ id: contacts.id });
  return rows[0] ?? null;
}
