export const prerender = false;

import type { APIRoute } from 'astro';

import { requireUser } from '../../../lib/auth/guard.ts';
import { getGoogleAccount, getSyncState } from '../../../lib/db/queries/gmail.ts';
import { runSync } from '../../../lib/mail/gmail/sync.ts';

/**
 * Sync now.
 *
 * This is the primary trigger, not the cron. Vercel's Hobby plan caps
 * scheduled jobs at once per day, so an every-fifteen-minutes cron expression
 * would silently not run at that rate — but more importantly, syncing when the
 * app is opened means the timeline is freshest exactly when it is being looked
 * at, which is better than a schedule regardless of plan.
 *
 * Debounced server-side so opening three pages in a row does not mean three
 * passes over the mailbox.
 */
const DEBOUNCE_MS = 10 * 60 * 1000;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ locals, url }) => {
  const user = requireUser(locals);

  const account = await getGoogleAccount(user.id);
  if (!account) return json({ ok: false, reason: 'not_connected' });

  const force = url.searchParams.get('force') === '1';
  const state = await getSyncState(account.id);

  if (!force && state?.lastRunAt && Date.now() - state.lastRunAt.getTime() < DEBOUNCE_MS) {
    return json({ ok: true, skipped: 'debounced', lastRunAt: state.lastRunAt });
  }

  try {
    const report = await runSync(account, { dryRun: false });
    return json({ ok: true, report });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'sync failed';
    console.error('gmail sync failed:', message);
    return json({ ok: false, error: message }, 500);
  }
};
