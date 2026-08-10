/**
 * The sync engine.
 *
 * Two modes sharing one processing path:
 *
 *  - Backfill: on first connect, walk the last 90 days in pages, remembering a
 *    cursor so it can resume across invocations rather than trying to finish
 *    inside one function timeout.
 *  - Incremental: thereafter, ask Gmail what changed since the stored
 *    historyId. Cheap and exact.
 *
 * `dryRun` runs everything except the writes and returns what it *would* have
 * done. Run that first. A matcher that files four hundred messages onto the
 * wrong timeline is tedious to unpick, and the report costs one API call more
 * than the real thing.
 */
import {
  getMessage,
  getProfile,
  listHistory,
  listMessages,
  GmailAuthError,
  HistoryExpiredError,
  type MessageRef,
} from './client.ts';
import { buildIndex, matchMessage, describe, type ContactIndex } from '../match.ts';
import { shouldSkip } from '../normalize.ts';
import {
  bumpThread,
  fileMessage,
  getSyncState,
  loadMatchIndexData,
  queueForReview,
  saveSyncState,
  threadAlreadyFiled,
} from '../../db/queries/gmail.ts';

/** How far back the first sync reaches. */
const BACKFILL_QUERY = 'newer_than:90d';
/** Messages per invocation. Keeps a run well inside the function timeout. */
const BATCH = 60;

export type SyncReport = {
  mode: 'backfill' | 'incremental' | 'noop';
  examined: number;
  filed: { client: string; summary: string }[];
  threaded: number;
  queued: { client: string | null; summary: string; reason: string }[];
  skipped: Record<string, number>;
  unmatched: string[];
  backfillDone: boolean;
  error?: string;
};

type Account = Parameters<typeof getProfile>[0] & { id: string; email: string };

function emptyReport(mode: SyncReport['mode']): SyncReport {
  return {
    mode,
    examined: 0,
    filed: [],
    threaded: 0,
    queued: [],
    skipped: {},
    unmatched: [],
    backfillDone: false,
  };
}

export async function runSync(
  account: Account,
  opts: { dryRun?: boolean; limit?: number } = {},
): Promise<SyncReport> {
  const dryRun = opts.dryRun ?? false;
  const state = await getSyncState(account.id);
  if (!state) throw new Error('No sync state row');

  const { contacts, clients } = await loadMatchIndexData();
  const index = buildIndex({
    contacts,
    clients,
    // The mailbox owner. Used to decide direction and to ignore notes to self.
    selfAddresses: [account.email],
  });

  try {
    if (!state.backfillDone) {
      return await backfill(account, index, state, { dryRun, limit: opts.limit });
    }
    return await incremental(account, index, state, { dryRun });
  } catch (err) {
    if (err instanceof HistoryExpiredError) {
      // The cursor aged out. Fall back to a bounded re-scan; the unique index
      // on (source, external_id) makes the overlap harmless.
      const report = await rescan(account, index, { dryRun });
      report.error = 'History cursor expired — re-scanned the last 7 days instead.';
      return report;
    }
    if (err instanceof GmailAuthError) {
      const report = emptyReport('noop');
      report.error = err.message;
      return report;
    }
    throw err;
  }
}

async function backfill(
  account: Account,
  index: ContactIndex,
  state: { backfillCursor: string | null },
  opts: { dryRun: boolean; limit?: number },
): Promise<SyncReport> {
  const report = emptyReport('backfill');

  const page = await listMessages(account, {
    query: BACKFILL_QUERY,
    pageToken: state.backfillCursor ?? undefined,
    max: opts.limit ?? BATCH,
  });

  await processAll(account, page.messages, index, report, opts);

  if (!opts.dryRun) {
    if (page.nextPageToken) {
      await saveSyncState(account.id, {
        backfillCursor: page.nextPageToken,
        lastRunAt: new Date(),
      });
    } else {
      // Backfill complete. Anchor the incremental cursor at the mailbox's
      // current historyId so nothing between the two is missed.
      const profile = await getProfile(account);
      await saveSyncState(account.id, {
        backfillCursor: null,
        backfillDone: true,
        lastHistoryId: profile.historyId,
        lastFullSyncAt: new Date(),
        lastRunAt: new Date(),
        lastError: null,
      });
      report.backfillDone = true;
    }
  }

  return report;
}

async function incremental(
  account: Account,
  index: ContactIndex,
  state: { lastHistoryId: string | null },
  opts: { dryRun: boolean },
): Promise<SyncReport> {
  const report = emptyReport('incremental');
  if (!state.lastHistoryId) throw new HistoryExpiredError('No stored history id');

  const seen = new Map<string, MessageRef>();
  let pageToken: string | undefined;
  let newestHistoryId = state.lastHistoryId;

  do {
    const page = await listHistory(account, state.lastHistoryId, pageToken);
    // The same message can appear in several history records; de-duplicate
    // before spending an API call per message.
    for (const m of page.added) seen.set(m.id, m);
    if (page.historyId) newestHistoryId = page.historyId;
    pageToken = page.nextPageToken;
  } while (pageToken && seen.size < 500);

  await processAll(account, [...seen.values()], index, report, opts);

  if (!opts.dryRun) {
    await saveSyncState(account.id, {
      lastHistoryId: newestHistoryId,
      lastRunAt: new Date(),
      lastError: null,
    });
  }

  return report;
}

async function rescan(
  account: Account,
  index: ContactIndex,
  opts: { dryRun: boolean },
): Promise<SyncReport> {
  const report = emptyReport('incremental');
  const page = await listMessages(account, { query: 'newer_than:7d', max: BATCH });
  await processAll(account, page.messages, index, report, opts);

  if (!opts.dryRun) {
    const profile = await getProfile(account);
    await saveSyncState(account.id, {
      lastHistoryId: profile.historyId,
      lastRunAt: new Date(),
    });
  }
  return report;
}

async function processAll(
  account: Account,
  refs: MessageRef[],
  index: ContactIndex,
  report: SyncReport,
  opts: { dryRun: boolean },
) {
  for (const ref of refs) {
    report.examined += 1;

    const { parsed, labelIds, headers } = await getMessage(account, ref.id);

    const skip = shouldSkip({ labelIds, from: parsed.from, headers });
    if (skip) {
      report.skipped[skip] = (report.skipped[skip] ?? 0) + 1;
      continue;
    }

    const result = matchMessage(parsed, index);

    if (result.kind === 'none') {
      if (report.unmatched.length < 25) report.unmatched.push(describe(parsed));
      continue;
    }

    if (result.kind === 'domain') {
      report.queued.push({
        client: result.clientId,
        summary: describe(parsed),
        reason: result.reason,
      });
      if (!opts.dryRun) {
        await queueForReview({
          gmailMessageId: parsed.id,
          gmailThreadId: parsed.threadId,
          fromEmail: parsed.from?.email ?? null,
          toEmails: parsed.to.map((a) => a.email),
          subject: parsed.subject,
          snippet: parsed.snippet,
          occurredAt: parsed.occurredAt,
          suggestedClientId: result.clientId,
          matchReason: 'domain',
        });
      }
      continue;
    }

    // An exact contact match. If the thread is already on the timeline this is
    // a reply, so bump the existing row rather than adding another.
    const existing = opts.dryRun ? null : await threadAlreadyFiled(parsed.threadId);

    if (existing && existing.clientId === result.clientId) {
      const bumped = await bumpThread({
        clientId: result.clientId,
        threadId: parsed.threadId,
        occurredAt: parsed.occurredAt,
        snippet: parsed.snippet,
      });
      if (bumped) report.threaded += 1;
      continue;
    }

    if (opts.dryRun) {
      report.filed.push({ client: result.clientId, summary: describe(parsed) });
      continue;
    }

    const created = await fileMessage({
      clientId: result.clientId,
      contactId: result.contactId,
      externalId: parsed.id,
      threadId: parsed.threadId,
      direction: result.direction,
      occurredAt: parsed.occurredAt,
      subject: parsed.subject,
      snippet: parsed.snippet,
    });

    if (created) report.filed.push({ client: result.clientId, summary: describe(parsed) });
  }
}
