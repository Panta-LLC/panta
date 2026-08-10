import { eq, desc, sql } from 'drizzle-orm';

import { db } from '../client.ts';
import { clients, contacts, pulseChecks } from '../schema.ts';

/**
 * URL-safe handle from an organization name. Collisions are resolved by
 * suffixing, because two clients genuinely can share a name and failing an
 * insert during a booking rush is worse than an ugly slug.
 */
export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFKD')
      // Strip the combining marks NFKD just split off, so "Café" → "cafe"
      // rather than "caf-".
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'client'
  );
}

async function uniqueSlug(base: string): Promise<string> {
  const taken = await db
    .select({ slug: clients.slug })
    .from(clients)
    .where(sql`${clients.slug} = ${base} or ${clients.slug} like ${base + '-%'}`);

  if (!taken.some((r) => r.slug === base)) return base;

  const used = new Set(taken.map((r) => r.slug));
  for (let n = 2; n < 200; n += 1) {
    const candidate = `${base}-${n}`;
    if (!used.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

/**
 * Domains a client's email is likely to come from — the seed for Gmail
 * matching in Phase 3b. Free providers are excluded there, not here; this only
 * records what the website hostname is.
 */
function domainsFor(websiteUrl: string | null): string[] {
  if (!websiteUrl) return [];
  try {
    const host = new URL(
      websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`,
    ).hostname;
    return [host.replace(/^www\./, '')];
  } catch {
    return [];
  }
}

export type NewClient = {
  name: string;
  websiteUrl?: string | null;
  sector?: string | null;
  city?: string | null;
  state?: string | null;
  source?: string | null;
  notes?: string | null;
};

export async function createClient(input: NewClient) {
  const slug = await uniqueSlug(slugify(input.name));
  const websiteUrl = input.websiteUrl?.trim() || null;

  const rows = await db
    .insert(clients)
    .values({
      name: input.name.trim(),
      slug,
      websiteUrl,
      domains: domainsFor(websiteUrl),
      sector: input.sector || null,
      city: input.city?.trim() || null,
      state: input.state?.trim() || null,
      source: input.source || null,
      notes: input.notes?.trim() || null,
    })
    .returning();

  return rows[0]!;
}

export async function listClients() {
  return db
    .select({
      id: clients.id,
      name: clients.name,
      slug: clients.slug,
      sector: clients.sector,
      websiteUrl: clients.websiteUrl,
      status: clients.status,
      createdAt: clients.createdAt,
      pulseCount: sql<number>`(
        select count(*) from ${pulseChecks}
        where ${pulseChecks.clientId} = ${clients.id}
          and ${pulseChecks.isRehearsal} = false
      )`.mapWith(Number),
    })
    .from(clients)
    .orderBy(desc(clients.createdAt));
}

export async function getClient(id: string) {
  const rows = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getClientContacts(clientId: string) {
  return db.select().from(contacts).where(eq(contacts.clientId, clientId));
}

export async function updateClientStatus(id: string, status: string) {
  await db
    .update(clients)
    .set({ status, updatedAt: new Date() })
    .where(eq(clients.id, id));
}
