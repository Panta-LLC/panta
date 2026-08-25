/**
 * Referral partners and their private links.
 *
 * A partner is someone who sends work this way and has no reason to hold an
 * account: a past client, an adjacent freelancer, the accountant who keeps
 * meeting nonprofits with a broken website. Each gets a URL, not a password.
 */
import { randomBytes } from 'node:crypto';
import { eq, and, desc, sql, gte } from 'drizzle-orm';

import { db } from '../client.ts';
import { partners, leads } from '../schema.ts';

/**
 * How many leads one link may submit per hour.
 *
 * Counted from the `leads` table rather than held in memory, because this runs
 * on Vercel's serverless functions where there is no shared process to hold a
 * counter — two requests can land on two different instances and a
 * module-level Map would let both through. The database is the only thing both
 * instances can see.
 *
 * Twelve is set well above any honest use (a partner referring a dozen
 * organizations in an hour is a story you would want to hear about) and well
 * below what makes a leaked link useful to anyone.
 */
export const SUBMISSIONS_PER_HOUR = 12;

/**
 * The token in /refer/{token}.
 *
 * 24 bytes rather than the 32 used for session cookies: this one gets pasted
 * into emails and read over the phone, and it protects a write-only form
 * rather than a login. base64url keeps it URL-safe with no escaping.
 */
function mintToken(): string {
  return randomBytes(24).toString('base64url');
}

/**
 * The link to hand a partner.
 *
 * PUBLIC_APP_ORIGIN is already set for the OAuth redirect (it is what builds
 * `redirectUri` in lib/auth/google.ts), so there is no new configuration here.
 *
 * Both sources are read, in production as well as dev, and that is a departure
 * from the pattern in site/src/pages/api/contact.ts — which deliberately gates
 * `import.meta.env` behind `import.meta.env.DEV` so that no literal reaches the
 * built artifact. That gate exists there because the values are SMTP
 * credentials, and Vite inlining one at build time both leaks it into the
 * bundle and makes rotating it require a rebuild.
 *
 * Neither concern applies to this variable. It is the site's own origin, it
 * carries the PUBLIC_ prefix precisely to say so, and Astro already inlines it
 * into the client bundle. So the build-time value is a free belt-and-braces
 * rather than a leak — and it matters here because the failure it prevents is
 * silent: with no origin this returns a RELATIVE path, which renders as a
 * perfectly innocuous-looking link that is broken the moment it is pasted into
 * an email. Reading both sources means the link is correct if EITHER is.
 *
 * The relative path is still the last resort, rather than guessing a host. A
 * half-right absolute URL that quietly points at localhost is worse than an
 * obviously incomplete one.
 */
export function referralUrl(token: string): string {
  // Runtime first. On Vercel this is always populated, and it is the only
  // source that reflects an env change without a rebuild.
  let origin = process.env.PUBLIC_APP_ORIGIN;

  // Build-time second, and only when it is not a loopback address.
  //
  // That guard is the whole point of this branch. `vercel deploy` builds
  // remotely, where this inlines to the real origin — but `vercel deploy
  // --prebuilt` ships whatever a LOCAL build inlined, and .env.local sets this
  // to http://localhost:4390. Without the check, the safety net would hand you
  // a confident, absolutely-formed, completely dead link. Falling through to
  // the relative path instead fails where you can see it.
  if (!origin) {
    const built = import.meta.env.PUBLIC_APP_ORIGIN;
    if (built && !/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])/i.test(built)) {
      origin = built;
    }
  }

  return origin ? `${String(origin).replace(/\/$/, '')}/refer/${token}` : `/refer/${token}`;
}

export type NewPartner = {
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  relationship?: string | null;
  notes?: string | null;
};

export async function createPartner(input: NewPartner) {
  const rows = await db
    .insert(partners)
    .values({
      name: input.name.trim(),
      contactName: input.contactName?.trim() || null,
      email: input.email?.trim().toLowerCase() || null,
      phone: input.phone?.trim() || null,
      relationship: input.relationship?.trim() || null,
      notes: input.notes?.trim() || null,
      token: mintToken(),
    })
    .returning();

  return rows[0]!;
}

/**
 * The partner list, with the only two numbers worth showing: how many leads
 * they have sent, and how many became clients.
 *
 * Counts, not a rate or a rank — see the note at the bottom of the `partners`
 * table. A conversion *percentage* here would be a partner score wearing a
 * different hat, and at two or three referrals each it would mostly measure
 * noise anyway.
 */
export async function listPartners() {
  return db
    .select({
      id: partners.id,
      name: partners.name,
      contactName: partners.contactName,
      email: partners.email,
      status: partners.status,
      relationship: partners.relationship,
      token: partners.token,
      createdAt: partners.createdAt,
      // The outer table is spelled out as literal text on purpose — drizzle
      // renders `${partners.id}` as a bare `"id"`, which inside these
      // subqueries would bind to `leads` and make every count zero. See the
      // long note on listClients() in queries/clients.ts.
      leadCount: sql<number>`(
        select count(*) from ${leads} l where l.partner_id = "partners"."id"
      )`.mapWith(Number),
      convertedCount: sql<number>`(
        select count(*) from ${leads} l
        where l.partner_id = "partners"."id" and l.status = 'converted'
      )`.mapWith(Number),
      newCount: sql<number>`(
        select count(*) from ${leads} l
        where l.partner_id = "partners"."id" and l.status = 'new'
      )`.mapWith(Number),
    })
    .from(partners)
    .orderBy(desc(partners.createdAt));
}

export async function getPartner(id: string) {
  const rows = await db.select().from(partners).where(eq(partners.id, id)).limit(1);
  return rows[0] ?? null;
}

/**
 * Resolve a referral link. Returns null for an unknown OR a revoked token, so
 * the public route cannot tell the two apart — a revoked link that said
 * "revoked" would confirm to whoever holds it that it was once real.
 */
export async function getActivePartnerByToken(token: string) {
  if (!token || token.length > 64) return null;

  const rows = await db
    .select({
      id: partners.id,
      name: partners.name,
      contactName: partners.contactName,
      token: partners.token,
    })
    .from(partners)
    .where(and(eq(partners.token, token), eq(partners.status, 'active')))
    .limit(1);

  return rows[0] ?? null;
}

/** Leads this partner has submitted in the last hour. The rate limit reads it. */
export async function countRecentSubmissions(partnerId: string): Promise<number> {
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const rows = await db
    .select({ n: sql<number>`count(*)`.mapWith(Number) })
    .from(leads)
    .where(and(eq(leads.partnerId, partnerId), gte(leads.createdAt, since)));

  return rows[0]?.n ?? 0;
}

/**
 * Retire a link without deleting the partner.
 *
 * Deleting would orphan their leads (`on delete set null`) and lose the record
 * of who sent what, which is exactly the history worth keeping. Revoking stops
 * the link and leaves everything else standing.
 */
export async function setPartnerStatus(id: string, status: 'active' | 'revoked') {
  await db
    .update(partners)
    .set({
      status,
      revokedAt: status === 'revoked' ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(partners.id, id));
}

/**
 * Issue a new link and invalidate the old one in a single write.
 *
 * The answer to "I forwarded it to the wrong person." Also the reason the
 * token is a column rather than the primary key: rotating it must not orphan
 * the leads that already point at this partner.
 */
export async function rotatePartnerToken(id: string): Promise<string> {
  const token = mintToken();
  await db
    .update(partners)
    .set({ token, status: 'active', revokedAt: null, updatedAt: new Date() })
    .where(eq(partners.id, id));
  return token;
}
