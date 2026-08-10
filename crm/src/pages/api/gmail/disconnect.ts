export const prerender = false;

import type { APIRoute } from 'astro';

import { requireUser } from '../../../lib/auth/guard.ts';
import { disconnectGoogleAccount, getGoogleAccount } from '../../../lib/db/queries/gmail.ts';

/**
 * Forget the Gmail connection.
 *
 * Deletes the stored tokens and, by cascade, the sync cursor — so reconnecting
 * starts a clean backfill. Already-filed interactions are left alone: they are
 * a record of correspondence that happened, not a cache of Gmail.
 *
 * This does not revoke Google's own grant. That is done at
 * myaccount.google.com/permissions, and the settings page says so.
 */
export const POST: APIRoute = async ({ locals, redirect }) => {
  const user = requireUser(locals);

  const account = await getGoogleAccount(user.id);
  if (account) await disconnectGoogleAccount(account.id);

  return redirect('/settings/google', 303);
};
