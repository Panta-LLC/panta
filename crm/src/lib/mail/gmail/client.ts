/**
 * A minimal Gmail API client — four endpoints, hand-rolled over fetch.
 *
 * `googleapis` would work and is ~40MB in the function bundle for the four
 * calls actually needed here: token refresh, messages.list, messages.get and
 * history.list. At that ratio a hundred lines of fetch is the cheaper
 * dependency.
 */
import {
  readAccessToken,
  readRefreshToken,
  revokeGoogleAccount,
  saveAccessToken,
} from '../../db/queries/gmail.ts';
import { googleConfig } from '../../auth/google.ts';
import { parseAddress, parseAddressList } from '../normalize.ts';
import type { ParsedMessage } from '../match.ts';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const API = 'https://gmail.googleapis.com/gmail/v1/users/me';

export const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';

/** Raised when the connection is dead and the caller must stop, not retry. */
export class GmailAuthError extends Error {}
/** Raised when the stored history cursor is too old to use. */
export class HistoryExpiredError extends Error {}

type Account = {
  id: string;
  accessTokenCt: Buffer | null;
  accessTokenIv: Buffer | null;
  accessTokenTag: Buffer | null;
  accessTokenExpiresAt: Date | null;
  refreshTokenCt: Buffer;
  refreshTokenIv: Buffer;
  refreshTokenTag: Buffer;
};

/**
 * A usable access token, refreshing if it is close to expiring.
 *
 * Sixty seconds of slack, because a token that expires mid-request produces a
 * confusing 401 rather than a clean refresh.
 */
async function accessTokenFor(account: Account): Promise<string> {
  const existing = readAccessToken(account);
  const expiry = account.accessTokenExpiresAt?.getTime() ?? 0;
  if (existing && expiry - Date.now() > 60_000) return existing;

  const { clientId, clientSecret } = googleConfig();
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      refresh_token: readRefreshToken(account),
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    // invalid_grant means revoked, expired, or the consent screen went back to
    // Testing. Retrying cannot fix any of those.
    if (body.error === 'invalid_grant') {
      await revokeGoogleAccount(account.id, 'Google returned invalid_grant — reconnect required');
      throw new GmailAuthError('Google connection revoked or expired. Reconnect in Settings.');
    }
    throw new Error(`Token refresh failed (${res.status})`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  const expiresAt = new Date(Date.now() + data.expires_in * 1000);
  await saveAccessToken(account.id, data.access_token, expiresAt);
  return data.access_token;
}

async function call<T>(account: Account, path: string): Promise<T> {
  const token = await accessTokenFor(account);
  const res = await fetch(`${API}${path}`, {
    headers: { authorization: `Bearer ${token}` },
  });

  if (res.status === 404) throw new HistoryExpiredError('History id too old');
  if (res.status === 401) {
    throw new GmailAuthError('Gmail rejected the access token. Reconnect in Settings.');
  }
  if (res.status === 403) {
    const body = await res.text().catch(() => '');
    // A 403 here is almost always the scope missing, not rate limiting.
    throw new GmailAuthError(
      `Gmail refused the request — the gmail.readonly scope may not be granted. ${body.slice(0, 200)}`,
    );
  }
  if (!res.ok) throw new Error(`Gmail API ${path} failed (${res.status})`);

  return (await res.json()) as T;
}

export type MessageRef = { id: string; threadId: string };

export async function listMessages(
  account: Account,
  opts: { query?: string; pageToken?: string; max?: number },
): Promise<{ messages: MessageRef[]; nextPageToken?: string }> {
  const params = new URLSearchParams({ maxResults: String(opts.max ?? 100) });
  if (opts.query) params.set('q', opts.query);
  if (opts.pageToken) params.set('pageToken', opts.pageToken);

  const data = await call<{ messages?: MessageRef[]; nextPageToken?: string }>(
    account,
    `/messages?${params}`,
  );
  return { messages: data.messages ?? [], nextPageToken: data.nextPageToken };
}

export async function listHistory(
  account: Account,
  startHistoryId: string,
  pageToken?: string,
): Promise<{ added: MessageRef[]; nextPageToken?: string; historyId?: string }> {
  const params = new URLSearchParams({
    startHistoryId,
    historyTypes: 'messageAdded',
    maxResults: '500',
  });
  if (pageToken) params.set('pageToken', pageToken);

  const data = await call<{
    history?: { messagesAdded?: { message: MessageRef }[] }[];
    nextPageToken?: string;
    historyId?: string;
  }>(account, `/history?${params}`);

  const added = (data.history ?? []).flatMap((h) =>
    (h.messagesAdded ?? []).map((m) => m.message),
  );

  return { added, nextPageToken: data.nextPageToken, historyId: data.historyId };
}

export async function getProfile(account: Account) {
  return call<{ emailAddress: string; historyId: string }>(account, '/profile');
}

type RawMessage = {
  id: string;
  threadId: string;
  labelIds?: string[];
  internalDate?: string;
  snippet?: string;
  payload?: { headers?: { name: string; value: string }[] };
};

/**
 * Fetch one message as headers plus snippet.
 *
 * `format=metadata` with an explicit header list means Gmail never sends the
 * body over the wire at all. The scope granted is broader than that, so this
 * is a restriction imposed in code — which is more reliable than a scope
 * someone will later be tempted to widen.
 */
export async function getMessage(
  account: Account,
  id: string,
): Promise<{ parsed: ParsedMessage; labelIds: string[]; headers: Record<string, string> }> {
  const params = new URLSearchParams({ format: 'metadata' });
  for (const h of [
    'From',
    'To',
    'Cc',
    'Subject',
    'Date',
    'List-Unsubscribe',
    'List-Id',
    'Precedence',
    'Auto-Submitted',
  ]) {
    params.append('metadataHeaders', h);
  }

  const raw = await call<RawMessage>(account, `/messages/${id}?${params}`);

  const headers: Record<string, string> = {};
  for (const h of raw.payload?.headers ?? []) {
    headers[h.name.toLowerCase()] = h.value;
  }

  const occurredAt = raw.internalDate
    ? new Date(Number(raw.internalDate))
    : new Date(headers['date'] ?? Date.now());

  return {
    parsed: {
      id: raw.id,
      threadId: raw.threadId,
      from: parseAddress(headers['from'] ?? ''),
      to: parseAddressList(headers['to']),
      cc: parseAddressList(headers['cc']),
      subject: headers['subject']?.trim() || null,
      snippet: raw.snippet?.trim() || null,
      occurredAt: Number.isNaN(occurredAt.getTime()) ? new Date() : occurredAt,
    },
    labelIds: raw.labelIds ?? [],
    headers,
  };
}
