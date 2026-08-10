export const prerender = false;

import type { APIRoute } from 'astro';

import {
  buildAuthorizeUrl,
  createAuthRequest,
  googleConfig,
  OAUTH_STATE_COOKIE,
} from '../../../../lib/auth/google.ts';

/**
 * Begin sign-in. Stashes the CSRF nonce and the PKCE verifier in a short-lived
 * cookie, then hands off to Google.
 */
export const GET: APIRoute = async ({ cookies, redirect, url }) => {
  const { configured } = googleConfig();
  if (!configured) return redirect('/login', 302);

  const { state, codeVerifier, codeChallenge } = createAuthRequest();

  // Only a path is stored, and only one starting with a single slash —
  // otherwise `?next=https://evil.example` turns the login into an open
  // redirect once the callback honours it.
  const requested = url.searchParams.get('next') ?? '/';
  const next = requested.startsWith('/') && !requested.startsWith('//') ? requested : '/';

  cookies.set(OAUTH_STATE_COOKIE, JSON.stringify({ state, codeVerifier, next }), {
    httpOnly: true,
    secure: url.protocol === 'https:',
    sameSite: 'lax',
    path: '/',
    maxAge: 600, // ten minutes is a generous ceiling on a redirect round trip
  });

  return redirect(buildAuthorizeUrl({ state, codeChallenge }), 302);
};
