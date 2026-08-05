// Newsletter subscribe — the single seam every Pulse signup goes through
// (PULSE-HOME-BUILD.md §2: "build the form against a single `subscribe` server
// action so the provider is swappable").
//
// The provider is still undecided (§9 launch blocker). Until one is chosen this
// records the address and returns success, so the form is real and the UI is
// final; only the body of `deliver()` changes when the decision lands.
export const prerender = false;

import type { APIRoute } from 'astro';

type Result = { ok: true } | { ok: false; error: string };

/**
 * The swap point. Implement against Buttondown/ConvertKit here and nothing
 * else in the app has to change.
 *
 * Contract: resolve on success, throw on failure. Never leak provider errors
 * to the client — the caller maps everything to a generic message.
 */
async function deliver(email: string, source: string): Promise<void> {
  const endpoint = process.env.NEWSLETTER_ENDPOINT;
  const key = process.env.NEWSLETTER_API_KEY;

  if (!endpoint || !key) {
    // No provider yet. Log so signups during this window aren't lost silently —
    // Vercel keeps function logs, so these can be replayed once a provider exists.
    console.info(`subscribe (no provider configured): ${email} via ${source}`);
    return;
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({ email, tags: ['pulse', source] }),
  });
  if (!res.ok) throw new Error(`provider responded ${res.status}`);
}

export const POST: APIRoute = async ({ request }) => {
  // Same-origin check, matching api/contact.ts: Vercel's proxy rewrites the
  // request URL, so compare Origin against the forwarded Host.
  const origin = request.headers.get('origin');
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (origin && host && new URL(origin).host !== host) {
    return json({ ok: false, error: 'Forbidden' }, 403);
  }

  const form = await request.formData();

  // Honeypot: real visitors never fill this. Pretend success.
  if (String(form.get('company') ?? '').trim()) return json({ ok: true });

  const email = String(form.get('email') ?? '').trim();
  const source = String(form.get('source') ?? 'unknown').slice(0, 40);

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json({ ok: false, error: 'Enter a valid email address.' }, 400);
  }

  try {
    await deliver(email, source);
    return json({ ok: true });
  } catch (err) {
    console.error('subscribe failed:', err);
    return json({ ok: false, error: 'Something went wrong. Try again in a moment.' }, 502);
  }
};

function json(body: Result, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
