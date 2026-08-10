// In-memory sliding-window rate limiter. Deliberately has no backing service:
// a Map in the function instance, nothing to provision, nothing to pay for.
//
// What that buys and what it does not. Vercel gives each warm Lambda instance
// its own module scope, so this Map is per-instance and starts empty on every
// cold start. Under concurrency the effective ceiling is (limit × instances),
// and a genuinely distributed flood defeats it outright. It exists to stop the
// cheap case — one script hammering an endpoint from one address — which is the
// case that actually happens. The provider's own abuse handling is the real
// backstop; this is the speed bump in front of it.
//
// Read the numbers callers pass in as courtesy limits, never as guarantees.

type Bucket = number[]; // hit timestamps, ascending, newest last

const buckets = new Map<string, Bucket>();

// Cap on distinct keys held at once. A rotating-IP flood would otherwise grow
// the Map without bound inside a single warm instance, and an OOM'd function is
// a worse outcome than a dropped counter. On overflow we sweep, then clear
// wholesale if that was not enough: the data is best-effort already, and a
// simple rule that always terminates beats an LRU nobody will maintain.
const MAX_KEYS = 5_000;

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfter: number }; // whole seconds, for the Retry-After header

/**
 * Records a hit against `key` and reports whether it is within the window.
 *
 * Counts on check — there is no separate "consume" step, so a caller cannot
 * forget to record a request it went on to serve. Call it immediately before
 * the work being protected, not at the top of a handler: attempts that fail
 * validation cost us nothing and should not spend anyone's budget.
 */
export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;

  // Prune this key first, so a long-lived instance never accumulates stale
  // timestamps on a hot key.
  const hits = (buckets.get(key) ?? []).filter((t) => t > cutoff);

  if (hits.length >= limit) {
    // The oldest surviving hit is the one whose expiry frees a slot. Never
    // report 0 — a Retry-After of 0 invites an immediate retry.
    const retryAfter = Math.max(1, Math.ceil((hits[0] + windowMs - now) / 1000));
    buckets.set(key, hits); // persist the prune even on the reject path
    return { ok: false, retryAfter };
  }

  hits.push(now);
  buckets.set(key, hits);

  // Global sweep, amortised: only once the Map has grown past the cap, so the
  // common path stays O(hits-for-one-key).
  //
  // The sweep uses the *calling* window, so a sweep triggered by a short-window
  // rule can drop long-window buckets early. That only happens above MAX_KEYS —
  // i.e. already under attack — and the failure mode is "limiter forgets and
  // allows more through", never "blocks a legitimate visitor". Storing each
  // bucket's own window would fix it at the cost of making this module carry
  // per-entry metadata; not worth it for a best-effort counter.
  if (buckets.size > MAX_KEYS) {
    for (const [k, v] of buckets) {
      if (!v.length || v[v.length - 1] <= cutoff) buckets.delete(k);
    }
    if (buckets.size > MAX_KEYS) buckets.clear();
  }

  return { ok: true };
}
