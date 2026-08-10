/**
 * Google OAuth 2.0 with PKCE — sign-in only.
 *
 * Day-one scopes are `openid email profile`, which are NOT restricted scopes
 * and need no Google verification. That is deliberate: Phase 3b adds
 * `gmail.readonly` (which IS restricted) by incremental authorization on this
 * same client, so the verification question is deferred to the phase that
 * actually needs it rather than blocking sign-in today.
 *
 * There is no account creation. One address is allowed; everyone else gets a
 * 403 and a log line.
 */
import { randomBytes, createHash } from 'node:crypto';

const AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

export const SIGNIN_SCOPES = ['openid', 'email', 'profile'];

/** The transient cookie carrying `state` and the PKCE verifier across the redirect. */
export const OAUTH_STATE_COOKIE = 'panta_crm_oauth';

function env(key: string): string | undefined {
  const fromVite = (import.meta as { env?: Record<string, string | undefined> }).env?.[key];
  return fromVite ?? process.env[key];
}

export function googleConfig() {
  const clientId = env('GOOGLE_CLIENT_ID');
  const clientSecret = env('GOOGLE_CLIENT_SECRET');
  const origin = env('PUBLIC_APP_ORIGIN') ?? 'http://localhost:4390';
  const allowedEmail = env('ALLOWED_EMAIL');

  return {
    clientId,
    clientSecret,
    allowedEmail: allowedEmail?.trim().toLowerCase(),
    redirectUri: `${origin.replace(/\/$/, '')}/api/auth/google/callback`,
    /** True once the Cloud Console setup is done. Login page reads this. */
    configured: Boolean(clientId && clientSecret && allowedEmail),
  };
}

/** A fresh state nonce + PKCE pair for one sign-in attempt. */
export function createAuthRequest() {
  const state = randomBytes(16).toString('base64url');
  const codeVerifier = randomBytes(32).toString('base64url');
  const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
  return { state, codeVerifier, codeChallenge };
}

export function buildAuthorizeUrl(opts: {
  state: string;
  codeChallenge: string;
  scopes?: string[];
  /** Phase 3b passes true to obtain a refresh token for Gmail. */
  offline?: boolean;
}): string {
  const { clientId, redirectUri, allowedEmail } = googleConfig();

  const params = new URLSearchParams({
    client_id: clientId!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: (opts.scopes ?? SIGNIN_SCOPES).join(' '),
    state: opts.state,
    code_challenge: opts.codeChallenge,
    code_challenge_method: 'S256',
    // Pre-fills the account chooser. Cosmetic, not a security control — the
    // callback still checks the returned email.
    login_hint: allowedEmail ?? '',
    include_granted_scopes: 'true',
  });

  if (opts.offline) {
    // Only the Gmail upgrade needs a refresh token, and `prompt=consent` is
    // what forces Google to re-issue one. Plain sign-in asking for offline
    // access would be requesting a capability it never uses.
    params.set('access_type', 'offline');
    params.set('prompt', 'consent');
  }

  return `${AUTHORIZE_URL}?${params}`;
}

export type GoogleTokens = {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token: string;
  refresh_token?: string;
};

export async function exchangeCode(code: string, codeVerifier: string): Promise<GoogleTokens> {
  const { clientId, clientSecret, redirectUri } = googleConfig();

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId!,
      client_secret: clientSecret!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code_verifier: codeVerifier,
    }),
  });

  if (!res.ok) {
    // Never include the response body in a thrown error that might be rendered
    // — it can contain the client secret echoed back in some failure modes.
    throw new Error(`Google token exchange failed (${res.status})`);
  }
  return (await res.json()) as GoogleTokens;
}

export type GoogleIdentity = {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
};

/**
 * Read the identity out of the id_token.
 *
 * The signature is not verified here, and that is defensible in this one case:
 * the token came directly from Google's token endpoint over TLS in response to
 * our own authenticated request, not from the browser. That is the same
 * reasoning Google's own documentation uses for skipping local validation on
 * the server-side flow.
 */
export function decodeIdToken(idToken: string): GoogleIdentity {
  const parts = idToken.split('.');
  if (parts.length !== 3) throw new Error('Malformed id_token');

  const payload = JSON.parse(Buffer.from(parts[1]!, 'base64url').toString('utf8')) as {
    sub?: string;
    email?: string;
    email_verified?: boolean | string;
    name?: string;
  };

  if (!payload.sub || !payload.email) throw new Error('id_token missing sub or email');

  return {
    sub: payload.sub,
    email: payload.email.toLowerCase(),
    // Google sends this as a boolean, but has historically sent the string
    // "true" on some paths.
    emailVerified: payload.email_verified === true || payload.email_verified === 'true',
    name: payload.name ?? null,
  };
}
