/**
 * Partner-submitted leads: the queue in front of `clients`.
 *
 * A lead is NOT a client. It is a claim someone made about an organization,
 * arriving from an unauthenticated form, possibly duplicated, possibly never
 * going anywhere. `clients` is the list of organizations you actually deal
 * with — it seeds slugs, Gmail domain matching, and every page named after a
 * real person — and letting raw submissions into it would quietly turn that
 * list into an inbox.
 *
 * So leads live here and reach `clients` exactly one way: `convertLead`.
 */
import { eq, and, or, ne, desc, sql } from 'drizzle-orm';

import { db } from '../client.ts';
import { leads, partners, clients, contacts, interactions } from '../schema.ts';
import { LEAD_STATUSES } from '../schema.ts';
import { canonicalize, domainFromUrl } from '../../mail/normalize.ts';
import { slugify, createClient } from './clients.ts';

export type NewLead = {
  partnerId?: string | null;
  orgName: string;
  websiteUrl?: string | null;
  sector?: string | null;
  city?: string | null;
  state?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactRole?: string | null;
  whatTheyNeed?: string | null;
  urgency?: string | null;
  permissionToContact?: boolean;
  referrerNote?: string | null;
  submittedVia?: 'partner_link' | 'internal';
  submittedIp?: string | null;
};

/** Trimmed, or null. Never the empty string in the database. */
function clean(v: string | null | undefined): string | null {
  const s = v?.trim();
  return s || null;
}

/**
 * Cap the free-text fields on the way in.
 *
 * These arrive from an unauthenticated form, so "the partner would never" is
 * not a size limit. Generous enough that no honest submission is ever cut —
 * the referrer note is the field people actually use, and 4000 characters is
 * several paragraphs.
 */
const LIMITS = { short: 200, note: 4000 } as const;

function capped(v: string | null | undefined, max: number): string | null {
  const s = clean(v);
  return s ? s.slice(0, max) : null;
}

export async function createLead(input: NewLead) {
  const rows = await db
    .insert(leads)
    .values({
      partnerId: input.partnerId ?? null,
      orgName: capped(input.orgName, LIMITS.short)!,
      websiteUrl: capped(input.websiteUrl, LIMITS.short),
      sector: clean(input.sector),
      city: capped(input.city, LIMITS.short),
      state: capped(input.state, LIMITS.short),
      contactName: capped(input.contactName, LIMITS.short),
      // Normalized the same way `contacts.email` is, so the duplicate check
      // below and Gmail matching later agree on what "the same address" means.
      contactEmail: input.contactEmail?.trim()
        ? canonicalize(input.contactEmail.trim()).slice(0, LIMITS.short)
        : null,
      contactPhone: capped(input.contactPhone, LIMITS.short),
      contactRole: capped(input.contactRole, LIMITS.short),
      whatTheyNeed: capped(input.whatTheyNeed, LIMITS.note),
      urgency: clean(input.urgency) ?? 'unknown',
      permissionToContact: input.permissionToContact ?? false,
      referrerNote: capped(input.referrerNote, LIMITS.note),
      submittedVia: input.submittedVia ?? 'partner_link',
      // `inet` rejects a malformed address, and a spoofed X-Forwarded-For must
      // never be able to fail an honest submission. Same guard as createSession.
      submittedIp:
        input.submittedIp && /^[0-9a-fA-F:.]+$/.test(input.submittedIp)
          ? input.submittedIp
          : null,
    })
    .returning();

  return rows[0]!;
}

/**
 * The triage queue.
 *
 * Ordered newest-first within status rather than by any notion of importance:
 * there is no lead score in this system, and the only ordering that is
 * defensible is the one that says which arrived first.
 */
export async function listLeads(filter?: { status?: string; partnerId?: string }) {
  const conditions = [];
  if (filter?.status && (LEAD_STATUSES as readonly string[]).includes(filter.status)) {
    conditions.push(eq(leads.status, filter.status));
  }
  if (filter?.partnerId) conditions.push(eq(leads.partnerId, filter.partnerId));

  return db
    .select({
      id: leads.id,
      orgName: leads.orgName,
      websiteUrl: leads.websiteUrl,
      contactName: leads.contactName,
      contactEmail: leads.contactEmail,
      urgency: leads.urgency,
      permissionToContact: leads.permissionToContact,
      status: leads.status,
      createdAt: leads.createdAt,
      clientId: leads.clientId,
      partnerId: leads.partnerId,
      partnerName: partners.name,
      partnerStatus: partners.status,
    })
    .from(leads)
    .leftJoin(partners, eq(leads.partnerId, partners.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(leads.createdAt));
}

/** Counts per status, for the queue's filter tabs and the dashboard badge. */
export async function countLeadsByStatus(): Promise<Record<string, number>> {
  const rows = await db
    .select({ status: leads.status, n: sql<number>`count(*)`.mapWith(Number) })
    .from(leads)
    .groupBy(leads.status);

  const out: Record<string, number> = {};
  for (const r of rows) out[r.status] = r.n;
  return out;
}

export async function getLead(id: string) {
  const rows = await db
    .select({
      lead: leads,
      partnerName: partners.name,
      partnerStatus: partners.status,
      partnerEmail: partners.email,
      clientName: clients.name,
      clientSlug: clients.slug,
    })
    .from(leads)
    .leftJoin(partners, eq(leads.partnerId, partners.id))
    .leftJoin(clients, eq(leads.clientId, clients.id))
    .where(eq(leads.id, id))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Things this lead might already be.
 *
 * Run when you open a lead, not when it arrives. Rejecting a submission at the
 * form because it looked like a duplicate would mean a partner being told
 * their referral was unwanted on the strength of a fuzzy name match — the same
 * organization genuinely can be referred twice, and that is worth knowing
 * rather than suppressing.
 *
 * Three signals, in descending order of how much they mean:
 *   1. an existing CONTACT with this email — near-certain, `contacts.email` is
 *      globally unique
 *   2. a CLIENT whose matchable domain is this lead's website host
 *   3. a client or earlier lead whose slugified name is identical
 */
export async function findPossibleMatches(lead: {
  id: string;
  orgName: string;
  websiteUrl: string | null;
  contactEmail: string | null;
}) {
  const domain = domainFromUrl(lead.websiteUrl);
  const nameSlug = slugify(lead.orgName);

  const clientConds = [eq(clients.slug, nameSlug)];
  if (domain) clientConds.push(sql`${domain} = any(${clients.domains})`);
  if (lead.contactEmail) {
    // `"clients"."id"` is literal text, not an interpolation: drizzle would
    // render it as a bare `"id"` that binds to `contacts` inside this
    // subquery, and the strongest of the three signals would silently never
    // fire. See the note on listClients() in queries/clients.ts.
    clientConds.push(
      sql`exists (
        select 1 from ${contacts} ct
        where ct.client_id = "clients"."id"
          and lower(ct.email) = ${lead.contactEmail}
      )`,
    );
  }

  const [matchingClients, priorLeads] = await Promise.all([
    db
      .select({
        id: clients.id,
        name: clients.name,
        status: clients.status,
        websiteUrl: clients.websiteUrl,
        // Why it surfaced, so you are never guessing what the tool noticed.
        viaContact: sql<boolean>`exists (
          select 1 from ${contacts} ct
          where ct.client_id = "clients"."id"
            and lower(ct.email) = ${lead.contactEmail ?? ''}
        )`.mapWith(Boolean),
        viaDomain: domain
          ? sql<boolean>`${domain} = any(${clients.domains})`.mapWith(Boolean)
          : sql<boolean>`false`.mapWith(Boolean),
      })
      .from(clients)
      .where(or(...clientConds))
      .limit(5),

    db
      .select({
        id: leads.id,
        orgName: leads.orgName,
        status: leads.status,
        createdAt: leads.createdAt,
        partnerName: partners.name,
      })
      .from(leads)
      .leftJoin(partners, eq(leads.partnerId, partners.id))
      .where(
        and(
          ne(leads.id, lead.id),
          lead.contactEmail
            ? or(
                eq(sql`lower(${leads.contactEmail})`, lead.contactEmail),
                eq(sql`lower(${leads.orgName})`, lead.orgName.toLowerCase()),
              )
            : eq(sql`lower(${leads.orgName})`, lead.orgName.toLowerCase()),
        ),
      )
      .orderBy(desc(leads.createdAt))
      .limit(5),
  ]);

  return { clients: matchingClients, leads: priorLeads };
}

/**
 * Move a lead through triage without converting it.
 *
 * `triagedAt` is stamped once, the first time it leaves 'new', and never
 * moved again — it answers "how long did this sit before anyone looked at
 * it", which is the only number the queue is genuinely accountable for.
 */
export async function setLeadStatus(
  id: string,
  status: string,
  dispositionReason?: string | null,
) {
  if (!(LEAD_STATUSES as readonly string[]).includes(status)) {
    throw new Error(`unknown lead status: ${status}`);
  }

  await db
    .update(leads)
    .set({
      status,
      dispositionReason: clean(dispositionReason),
      triagedAt: sql`coalesce(${leads.triagedAt}, now())`,
      updatedAt: new Date(),
    })
    .where(eq(leads.id, id));
}

export async function updateLeadNotes(id: string, internalNotes: string | null) {
  await db
    .update(leads)
    .set({ internalNotes: clean(internalNotes), updatedAt: new Date() })
    .where(eq(leads.id, id));
}

export type ConvertResult = { clientId: string; created: boolean };

/**
 * The one door from `leads` into `clients`.
 *
 * Does four things, and the order matters — the client must exist before
 * anything can reference it:
 *   1. finds or creates the client
 *   2. adds the referred person as a contact, if there is one and the address
 *      is not already taken
 *   3. writes a `referral` row onto the client's timeline naming the partner
 *   4. stamps the lead converted and links it to the client
 *
 * Not wrapped in a transaction, deliberately. The production driver is Neon's
 * serverless HTTP client, which has no interactive transaction — and the
 * failure modes here are all benign and visible: a client with no contact, or
 * a client with no timeline row, both of which you can see and fix. A silent
 * partial write into the *middle* of this sequence is not possible, because
 * each step only depends on the one before it.
 */
export async function convertLead(
  leadId: string,
  options: { attachToClientId?: string | null } = {},
): Promise<ConvertResult> {
  const row = await getLead(leadId);
  if (!row) throw new Error(`lead not found: ${leadId}`);
  const lead = row.lead;

  if (lead.status === 'converted' && lead.clientId) {
    // Idempotent: a double-submitted form must not create a second client.
    return { clientId: lead.clientId, created: false };
  }

  // ── 1. the client ──────────────────────────────────────────────────────
  let clientId = options.attachToClientId ?? null;
  let created = false;

  if (!clientId) {
    const client = await createClient({
      name: lead.orgName,
      websiteUrl: lead.websiteUrl,
      sector: lead.sector,
      city: lead.city,
      state: lead.state,
      // `clients.source` records how the RELATIONSHIP started, and this is it.
      // Kept coarse on purpose — which partner is on the lead row, and
      // duplicating their name here would give two answers that drift apart
      // the first time a partner is renamed.
      source: row.partnerName ? 'partner_referral' : 'referral',
      // The partner's own words, carried across so the client page opens with
      // the reason this organization is in the system at all.
      notes: lead.whatTheyNeed,
    });
    clientId = client.id;
    created = true;
  }

  // ── 2. the contact ─────────────────────────────────────────────────────
  // `contacts.email` is globally unique, so an address already on file would
  // fail the insert. Skipping is right: that address belongs to a real contact
  // somewhere, and this lead has just told you the two are connected — which
  // findPossibleMatches surfaces on the lead page before you ever get here.
  if (lead.contactName || lead.contactEmail) {
    const taken = lead.contactEmail
      ? await db
          .select({ id: contacts.id })
          .from(contacts)
          .where(eq(sql`lower(${contacts.email})`, lead.contactEmail))
          .limit(1)
      : [];

    if (taken.length === 0) {
      await db.insert(contacts).values({
        clientId,
        name: lead.contactName ?? lead.contactEmail ?? 'Unnamed contact',
        email: lead.contactEmail,
        phone: lead.contactPhone,
        role: lead.contactRole,
        // First contact on a brand-new client is the primary one. On a client
        // that already existed, it is not — someone there already is.
        isPrimary: created,
      });
    }
  }

  // ── 3. the timeline ────────────────────────────────────────────────────
  // Written as `source: 'system'` because nobody typed it, and pointed back at
  // the lead so the client page can always answer "where did this come from?"
  await db.insert(interactions).values({
    clientId,
    source: 'system',
    kind: 'referral',
    occurredAt: lead.createdAt,
    subject: row.partnerName
      ? `Referred by ${row.partnerName}`
      : 'Added from a lead',
    body: [lead.whatTheyNeed, lead.referrerNote].filter(Boolean).join('\n\n') || null,
    entityType: 'lead',
    entityId: lead.id,
    metadata: {
      partnerId: lead.partnerId,
      partnerName: row.partnerName,
      permissionToContact: lead.permissionToContact,
      urgency: lead.urgency,
    },
  });

  // ── 4. the lead ────────────────────────────────────────────────────────
  await db
    .update(leads)
    .set({
      status: 'converted',
      clientId,
      convertedAt: new Date(),
      triagedAt: sql`coalesce(${leads.triagedAt}, now())`,
      updatedAt: new Date(),
    })
    .where(eq(leads.id, leadId));

  return { clientId, created };
}

/**
 * Leads that produced this client. Shown on the client page so an
 * organization's origin is visible from the record itself rather than only
 * from the queue it came through.
 */
export async function listLeadsForClient(clientId: string) {
  return db
    .select({
      id: leads.id,
      createdAt: leads.createdAt,
      convertedAt: leads.convertedAt,
      urgency: leads.urgency,
      permissionToContact: leads.permissionToContact,
      whatTheyNeed: leads.whatTheyNeed,
      referrerNote: leads.referrerNote,
      partnerId: leads.partnerId,
      partnerName: partners.name,
    })
    .from(leads)
    .leftJoin(partners, eq(leads.partnerId, partners.id))
    .where(eq(leads.clientId, clientId))
    .orderBy(desc(leads.createdAt));
}

// ── display labels, in one place so the queue and the form cannot disagree ──

export const URGENCY_LABELS: Record<string, string> = {
  now: 'Needs something now',
  few_months: 'In the next few months',
  exploring: 'Just exploring',
  unknown: 'Not sure',
};

export const LEAD_STATUS_LABELS: Record<string, string> = {
  new: 'New',
  qualified: 'Qualified',
  converted: 'Converted',
  declined: 'Declined',
  duplicate: 'Duplicate',
};
