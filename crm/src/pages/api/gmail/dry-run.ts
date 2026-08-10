export const prerender = false;

import type { APIRoute } from 'astro';

import { requireUser } from '../../../lib/auth/guard.ts';
import { getGoogleAccount } from '../../../lib/db/queries/gmail.ts';
import { runSync } from '../../../lib/mail/gmail/sync.ts';
import { listClients } from '../../../lib/db/queries/clients.ts';

/**
 * What the sync *would* do, writing nothing.
 *
 * Run this before the first real sync and read every line. A matcher that
 * files four hundred messages onto the wrong client's timeline is tedious to
 * unpick, and this costs nothing but a few API calls to find out first.
 */
export const POST: APIRoute = async ({ locals, url }) => {
  const user = requireUser(locals);

  const account = await getGoogleAccount(user.id);
  if (!account) {
    return new Response(JSON.stringify({ ok: false, reason: 'not_connected' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  const limit = Number(url.searchParams.get('limit') ?? '40');
  const report = await runSync(account, { dryRun: true, limit: Math.min(limit, 100) });

  // Resolve client ids to names once, here, so the report reads as prose
  // rather than as a wall of uuids.
  const names = new Map((await listClients()).map((c) => [c.id, c.name]));
  const named = {
    ...report,
    filed: report.filed.map((f) => ({ ...f, client: names.get(f.client) ?? f.client })),
    queued: report.queued.map((q) => ({
      ...q,
      client: q.client ? names.get(q.client) ?? q.client : null,
    })),
  };

  return new Response(JSON.stringify({ ok: true, report: named }, null, 2), {
    headers: { 'content-type': 'application/json' },
  });
};
