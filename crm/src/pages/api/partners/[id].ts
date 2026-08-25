export const prerender = false;

import type { APIRoute } from 'astro';

import { requireUser } from '../../../lib/auth/guard.ts';
import { setPartnerStatus, rotatePartnerToken } from '../../../lib/db/queries/partners.ts';

/**
 * Link management. Three actions, all irreversible in the sense that matters:
 * a link, once retired, is gone from every email it was ever pasted into.
 *
 * There is no delete. Deleting a partner would set `partnerId` to null on
 * every lead they ever sent, silently erasing who the referral came from —
 * which is the whole record worth keeping. Revoke instead.
 */
export const POST: APIRoute = async ({ request, params, redirect, locals }) => {
  requireUser(locals);

  const id = params.id;
  if (!id) return new Response('missing id', { status: 400 });

  const action = String((await request.formData()).get('action') ?? '');

  if (action === 'revoke') {
    await setPartnerStatus(id, 'revoked');
    return redirect(`/partners/${id}`, 303);
  }

  if (action === 'reactivate') {
    await setPartnerStatus(id, 'active');
    return redirect(`/partners/${id}`, 303);
  }

  if (action === 'rotate') {
    await rotatePartnerToken(id);
    // ?rotated=1 so the page can say plainly that the old link is dead —
    // the failure mode here is quietly issuing a new link and leaving someone
    // believing the one in their inbox still works.
    return redirect(`/partners/${id}?rotated=1`, 303);
  }

  return new Response('unknown action', { status: 400 });
};
