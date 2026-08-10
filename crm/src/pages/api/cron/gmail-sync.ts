export const prerender = false;

import type { APIRoute } from 'astro';
import { isNull } from 'drizzle-orm';

import { db } from '../../../lib/db/client.ts';
import { googleAccounts } from '../../../lib/db/schema.ts';
import { runSync } from '../../../lib/mail/gmail/sync.ts';
import { safeEqual } from '../../../lib/auth/session.ts';

function env(key: string): string | undefined {
  const fromVite = (import.meta as { env?: Record<string, string | undefined> }).env?.[key];
  return fromVite ?? process.env[key];
}

/**
 * The daily backstop.
 *
 * Sync-on-open covers every day the app is used; this covers the weeks it is
 * not, so the timeline is not missing a fortnight when you next look. Vercel's
 * Hobby plan allows one cron run per day, which is exactly the right cadence
 * for a backstop.
 *
 * This route is in the middleware's public allowlist because Vercel's
 * scheduler has no session cookie, so it authenticates itself here with a
 * bearer token compared in constant time.
 */
export const GET: APIRoute = async ({ request }) => {
  const secret = env('CRON_SECRET');
  if (!secret) return new Response('CRON_SECRET not configured', { status: 500 });

  const auth = request.headers.get('authorization') ?? '';
  const presented = auth.replace(/^Bearer\s+/i, '');
  if (!presented || !safeEqual(presented, secret)) {
    // No detail in the response — an unauthenticated caller learns nothing
    // about whether the secret was close.
    return new Response('Forbidden', { status: 403 });
  }

  const accounts = await db
    .select()
    .from(googleAccounts)
    .where(isNull(googleAccounts.revokedAt));

  const results: unknown[] = [];
  for (const account of accounts) {
    try {
      const report = await runSync(account, { dryRun: false });
      results.push({
        account: account.email,
        mode: report.mode,
        examined: report.examined,
        filed: report.filed.length,
        queued: report.queued.length,
        error: report.error,
      });
    } catch (err) {
      results.push({
        account: account.email,
        error: err instanceof Error ? err.message : 'failed',
      });
    }
  }

  return new Response(JSON.stringify({ ok: true, results }), {
    headers: { 'content-type': 'application/json' },
  });
};
