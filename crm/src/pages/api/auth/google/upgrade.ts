export const prerender = false;

import type { APIRoute } from 'astro';

import { requireUser } from '../../../../lib/auth/guard.ts';
import {
  buildAuthorizeUrl,
  createAuthRequest,
  googleConfig,
  SIGNIN_SCOPES,
  OAUTH_STATE_COOKIE,
} from '../../../../lib/auth/google.ts';
import { GMAIL_SCOPE } from '../../../../lib/mail/gmail/client.ts';
import { encryptionConfigured } from '../../../../lib/crypto.ts';

/**
 * Incremental authorization: add gmail.readonly to the consent already given.
 *
 * Same OAuth client as sign-in, so this is one credential and one consent
 * screen rather than a second integration. `offline` is set here and only
 * here — sign-in never needs a refresh token, but a background sync does.
 *
 * The `mode` in the state cookie is what tells the shared callback to store a
 * Gmail connection rather than just start a session.
 */
export const GET: APIRoute = async ({ cookies, redirect, url, locals }) => {
  requireUser(locals);

  const { configured } = googleConfig();
  if (!configured) return redirect('/settings/google?error=not_configured', 302);

  // Refuse before sending the user to Google: without a key we could complete
  // the consent and then be unable to store the token we were granted.
  if (!encryptionConfigured()) {
    return redirect('/settings/google?error=no_key', 302);
  }

  const { state, codeVerifier, codeChallenge } = createAuthRequest();

  cookies.set(
    OAUTH_STATE_COOKIE,
    JSON.stringify({ state, codeVerifier, next: '/settings/google', mode: 'gmail' }),
    {
      httpOnly: true,
      secure: url.protocol === 'https:',
      sameSite: 'lax',
      path: '/',
      maxAge: 600,
    },
  );

  return redirect(
    buildAuthorizeUrl({
      state,
      codeChallenge,
      scopes: [...SIGNIN_SCOPES, GMAIL_SCOPE],
      offline: true,
    }),
    302,
  );
};
