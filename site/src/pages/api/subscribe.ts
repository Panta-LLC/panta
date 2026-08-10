// Newsletter subscribe — the single seam every Pulse signup goes through
// (PULSE-HOME-BUILD.md §2: "build the form against a single `subscribe` server
// action so the provider is swappable").
//
// The provider is Buttondown (§9 blocker, closed). Subscribers live there, not
// here — there is no local store and nothing to back up. Verification is
// Buttondown's own double opt-in, which hinges on one detail in `deliver()`:
// we do not send a `type` field. Read the comment there before changing the
// request body.
export const prerender = false;

import type { APIRoute } from 'astro';
import { rateLimit } from '../../lib/rate-limit';

/**
 * What the provider said, reduced to the only distinctions this endpoint acts
 * on. `invalid` is the visitor's typo (their problem, fixable); anything else
 * that goes wrong is ours and throws.
 */
type Outcome = 'pending' | 'already' | 'invalid';

type Result =
  | { ok: true; status: Exclude<Outcome, 'invalid'>; message: string }
  | { ok: false; error: string };

// Copy lives server-side because the outcome that selects it is only knowable
// here, and splitting it across the wire would let the two halves drift.
const PENDING_MSG = 'Almost done — check your inbox and click the confirmation link.';
const ALREADY_MSG =
  "You're already on the list. If you haven't confirmed yet, the link is in your inbox.";

/** Coerce Vite/Node env values to a trimmed string (empty → undefined). */
function str(value: unknown): string | undefined {
  if (value == null) return undefined;
  const s = String(value).trim();
  return s || undefined;
}

/**
 * The API key, read runtime-first.
 *
 * The order matters and is deliberately the opposite of api/contact.ts. Vite
 * replaces `import.meta.env.X` with a literal at BUILD time, which means (a) the
 * value is frozen into the deployed bundle and rotating it needs a redeploy, and
 * (b) any `?? process.env.X` written after it is constant-folded away and never
 * runs. Vercel injects the real value into `process.env` at request time, so
 * that is the source of truth in production.
 *
 * The `import.meta.env.DEV` guard is doing real work, not decoration: with it, a
 * production build compiles the whole ternary down to `undefined` and the key
 * never appears in the artifact. Without it, the literal ships. If you touch
 * this, rebuild and grep .vercel/output for the key value before deploying.
 */
function apiKey(): string | undefined {
  return str(
    process.env.BUTTONDOWN_API_KEY ??
      (import.meta.env.DEV ? import.meta.env.BUTTONDOWN_API_KEY : undefined),
  );
}

/**
 * Best-effort client IP, used for the rate limit and as Buttondown's record of
 * where the opt-in came from.
 *
 * Vercel's proxy sets x-forwarded-for and the FIRST entry is the client as the
 * edge saw it; anything after it is proxy hops. The header is client-settable in
 * principle, but Vercel overwrites rather than appends, so a spoofed value does
 * not survive. Even so, treat none of this as identity — it gates a courtesy
 * limit and records consent; it authorises nothing.
 *
 * Locally there is no proxy and no header, so every dev request shares the one
 * "local" bucket. That is convenient rather than wrong: it is what makes the
 * limiter testable from a single machine.
 */
function clientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  const first = xff?.split(',')[0]?.trim();
  return first || request.headers.get('x-real-ip')?.trim() || 'local';
}

/**
 * Whether this Buttondown account's plan allows tags. Assumed until the API
 * says otherwise; see the retry in `deliver()`. Module scope means one probe
 * per function instance, not one per signup.
 */
let tagsSupported = true;

/**
 * `source` arrives from a hidden form field, so it is visitor-controlled, and
 * one caller builds it dynamically (`pulse_${category.slug}` in
 * pulse/[slug].astro). Buttondown creates tags on first use, so passing it
 * through raw would let anyone write arbitrary tags into the account. Reduce it
 * to the character class a tag needs and drop it if nothing survives.
 *
 * Non-production deploys tag their signups so preview traffic can be found and
 * deleted later without guessing at timestamps.
 */
function tagsFor(source: string): string[] {
  const tag = source.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40);
  const tags = ['pulse', ...(tag ? [tag] : [])];
  const env = process.env.VERCEL_ENV;
  if (env && env !== 'production') tags.push('test');
  return tags;
}

/**
 * Reads the outcome off a successful create.
 *
 * The status code cannot tell us this. Buttondown answers a repeat signup with
 * 200 and the EXISTING subscriber record rather than a duplicate error, so the
 * only thing distinguishing "welcome" from "you're already here" is the `type`
 * field in the body. Verified against the live API, not inferred from docs —
 * the docs describe a 400 for duplicates, which is not what it actually does.
 *
 * `blocked` is the firewall's other mode. With auditing set to `enabled` rather
 * than rejecting outright, a filtered signup still returns 200, but the record
 * lands as `blocked` and no confirmation email is ever sent. Reporting that as
 * ordinary success is deliberate — it matches the honeypot's posture of telling
 * a suspected bot nothing — but it means the log line is the ONLY trace, so it
 * is a warning rather than an info.
 */
function classify(body: string, email: string): Outcome {
  let type: unknown;
  try {
    type = JSON.parse(body)?.type;
  } catch {
    // Not JSON. The create succeeded, so treat it as a normal pending signup
    // rather than inventing a failure the visitor would have to act on.
    return 'pending';
  }

  if (type === 'blocked') {
    console.warn(
      `subscribe: Buttondown firewall marked ${email} as blocked — reported to the visitor ` +
        'as success, but no confirmation email will be sent and they will never receive Pulse.',
    );
    return 'pending';
  }

  // Already confirmed on a previous visit. Anything else — `unactivated` above
  // all, which is the normal double opt-in state — is a pending signup.
  if (type === 'regular' || type === 'premium') return 'already';

  return 'pending';
}

/**
 * Duplicate detection. A wrong answer here is the difference between "you're
 * already subscribed" and a red error on a form that actually worked, so this
 * is deliberately broad.
 *
 * Buttondown's error bodies are not one shape. A validation failure comes back
 * FastAPI-style — `{"detail":[{"type":"string_pattern_mismatch",...}]}`, with
 * no top-level `code` — while other failures are documented to carry a `code`.
 * Rather than bet on one, scan the whole raw body: every shape observed so far
 * spells the reason out in text somewhere, and a substring scan cannot be
 * broken by a nesting change. `code` is still checked first because an exact
 * field match beats a regex when it is there.
 *
 * Parses defensively — an HTML error page during an outage must not throw
 * inside the error handler.
 */
function isDuplicate(body: string): boolean {
  try {
    const code = JSON.parse(body)?.code;
    if (typeof code === 'string' && /exist|duplicat|already/i.test(code)) return true;
  } catch {
    /* not JSON — fall through to the text scan */
  }
  return /already[\s_-]*(subscrib|exist)|duplicat|is[\s_-]*already/i.test(body);
}

/**
 * The swap point. Buttondown today; changing providers means changing this
 * function body and nothing else.
 *
 * Contract: resolve with an outcome on success, throw on failure. Never leak
 * provider errors to the client — the caller maps everything to a generic
 * message.
 *
 * Double opt-in hinges on ONE thing: we do not send a `type` field. Buttondown
 * treats a typeless creation as unconfirmed, parks the subscriber in
 * `unactivated`, and sends its own confirmation email from its own template.
 * Passing `type: "regular"` would silently bypass all of that and add people to
 * the list without consent. If you edit this body, do not add a `type`.
 */
async function deliver(email: string, source: string, ip: string): Promise<Outcome> {
  const key = apiKey();

  if (!key) {
    // A dev machine normally has no Buttondown key, and hard-failing there makes
    // the success path untestable without a deploy. Log and succeed in dev only.
    // Production falls through and fails loudly: this endpoint used to return
    // silent success with no provider configured, which was right when there was
    // no provider and is wrong now — it would produce a visitor who believes
    // they subscribed, no confirmation email ever, and no error anywhere.
    if (import.meta.env.DEV) {
      console.info(`subscribe (no Buttondown key in dev): ${email} via ${source}`);
      return 'pending';
    }
    console.error('subscribe: BUTTONDOWN_API_KEY is not configured');
    throw new Error('no provider configured');
  }

  const create = (withTags: boolean) =>
    fetch('https://api.buttondown.com/v1/subscribers', {
      method: 'POST',
      headers: {
        // Token, not Bearer. Buttondown answers 401 to a Bearer prefix.
        authorization: `Token ${key}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        // `email_address`, not `email` — the obvious guess is a 400.
        email_address: email,
        // No `type` key. See the note above; its absence is the feature.
        ...(withTags ? { tags: tagsFor(source) } : {}),
        // Stored as the record of where the opt-in came from.
        ip_address: ip === 'local' ? undefined : ip,
      }),
    });

  let res = await create(tagsSupported);
  let body = await res.text().catch(() => '');

  // Tags are a paid feature: on the free plan Buttondown answers
  // 403 `feature_disabled` and the signup fails outright. Hard-coding which
  // plan this account is on would silently break the day it changes, in either
  // direction — a free account losing every signup, or a upgraded one never
  // regaining attribution. So: try with tags, and on that specific refusal drop
  // them and retry once.
  //
  // `tagsSupported` is remembered per instance, so the extra round-trip is paid
  // at most once per cold start rather than on every signup. Same per-instance
  // caveat as src/lib/rate-limit.ts, and harmless for the same reason: the
  // worst case is one wasted request, never a lost subscriber.
  if (
    !res.ok &&
    res.status === 403 &&
    tagsSupported &&
    /feature_disabled/i.test(body) &&
    /tag/i.test(body)
  ) {
    tagsSupported = false;
    console.warn(
      'subscribe: Buttondown plan does not support tags — retrying without them. ' +
        'Signups will succeed but lose per-surface attribution until the account is on Basic or higher.',
    );
    res = await create(false);
    body = await res.text().catch(() => '');
  }

  if (res.ok) return classify(body, email);

  // "Already here" is a success from the visitor's side, just with different
  // copy. Accept it on either status: 400 is documented, 409 is what a REST API
  // conventionally uses for a collision, and guessing wrong costs a returning
  // subscriber a red error on a form that worked.
  if ((res.status === 400 || res.status === 409) && isDuplicate(body)) return 'already';

  // Buttondown's own firewall — the provider-side half of the spam filtering,
  // and the reason this endpoint gets away without a captcha. When it refuses
  // someone, treat it exactly like the honeypot above: return the ordinary
  // success shape and send nothing. A bot learns nothing it can tune against,
  // and the refusal is logged so a false positive shows up in our logs rather
  // than as a broken form for a real person.
  //
  // If false positives do become real, the fix is in Buttondown, not here:
  // Settings → Firewall → "Accept and mark as blocked" parks risky signups for
  // manual review instead of rejecting them outright.
  if (res.status === 400 && /subscriber_blocked/i.test(body)) {
    console.warn(`subscribe: Buttondown firewall blocked ${email} — reported as success`);
    return 'pending';
  }

  // Buttondown validates addresses more strictly than the regex above does —
  // its local part is `[a-zA-Z0-9.'_%+\-!]+`, so an address containing, say,
  // `&` clears our check and fails theirs with a 422. That is the visitor's
  // typo, not an outage, and telling them "something went wrong" would send
  // them away believing our form is broken. Hand it back as a correctable
  // validation error instead.
  //
  // The looser regex upstream stays deliberately: it is a cheap filter for
  // obvious nonsense, and mirroring the provider's exact pattern here would
  // silently rot the next time they change it. This is the authoritative check.
  if (res.status === 422) {
    console.info(`subscribe: Buttondown rejected address as invalid: ${email}`);
    return 'invalid';
  }

  // Everything else is ours to deal with, not the visitor's. Status and body go
  // to the log; the caller returns a generic message.
  console.error(`subscribe: Buttondown responded ${res.status}: ${body.slice(0, 500)}`);
  throw new Error(`provider responded ${res.status}`);
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

  // Honeypot: real visitors never fill this. Pretend success — and return the
  // exact shape and copy a real signup gets, so a bot cannot tell the two apart
  // by diffing the response body.
  if (String(form.get('company') ?? '').trim()) {
    console.info('subscribe: honeypot tripped — skipping provider call');
    return json({ ok: true, status: 'pending', message: PENDING_MSG });
  }

  const email = String(form.get('email') ?? '').trim();
  const source = String(form.get('source') ?? 'unknown').slice(0, 40);

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json({ ok: false, error: 'Enter a valid email address.' }, 400);
  }

  // Limits are checked here and not at the top of the handler: a malformed
  // address or a honeypot hit costs us nothing, and spending someone's budget on
  // their own typo would be a worse bug than the one this prevents.
  //
  // The two rules cover opposite attacks. Per-IP stops one script working
  // through a list of addresses. Per-email protects the victim of the reverse —
  // many IPs pointed at one person's address, where every attempt would make
  // Buttondown send them another confirmation email. A composite ip+email key
  // would catch neither. See src/lib/rate-limit.ts for the per-instance caveat.
  const ip = clientIp(request);
  const limited =
    reject(rateLimit(`ip:${ip}`, { limit: 5, windowMs: 10 * 60_000 })) ??
    reject(rateLimit(`email:${email.toLowerCase()}`, { limit: 3, windowMs: 60 * 60_000 }));
  if (limited) return limited;

  try {
    const status = await deliver(email, source, ip);
    // The provider's address rules are stricter than ours, so this is the
    // second place a typo can surface. Same copy as the regex check above, so
    // the visitor cannot tell which layer caught it — they just fix the address.
    if (status === 'invalid') {
      return json({ ok: false, error: 'Enter a valid email address.' }, 400);
    }
    return json({
      ok: true,
      status,
      message: status === 'already' ? ALREADY_MSG : PENDING_MSG,
    });
  } catch (err) {
    console.error('subscribe failed:', err);
    return json({ ok: false, error: 'Something went wrong. Try again in a moment.' }, 502);
  }
};

/** A 429 with Retry-After, or null if the check passed. */
function reject(result: ReturnType<typeof rateLimit>) {
  if (result.ok) return null;
  return json(
    { ok: false, error: "That's a few too many tries. Give it a minute and try again." },
    429,
    { 'retry-after': String(result.retryAfter) },
  );
}

function json(body: Result, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}
