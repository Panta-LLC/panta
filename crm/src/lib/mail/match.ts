/**
 * Deciding whose timeline a message belongs on.
 *
 * Two tiers, and the distinction is the whole point:
 *
 *  - An exact match against a known contact address is a fact. File it.
 *  - A match on the client's domain alone is a guess. Queue it for review.
 *
 * Collapsing those two into one would either lose real correspondence or put
 * a stranger's message under a client's name. The review queue is what turns
 * the second kind into the first over time, because filing one offers to
 * create the contact.
 */
import { canonicalize, isFreeProvider, type Address } from './normalize.ts';

export type ContactIndex = {
  /** canonical email → { clientId, contactId } */
  byEmail: Map<string, { clientId: string; contactId: string }>;
  /** domain → clientId. Free providers are excluded when this is built. */
  byDomain: Map<string, string>;
  /** The mailbox owner's own addresses, canonicalized. */
  self: Set<string>;
};

export type ParsedMessage = {
  id: string;
  threadId: string;
  from: Address | null;
  to: Address[];
  cc: Address[];
  subject: string | null;
  snippet: string | null;
  occurredAt: Date;
};

export type MatchResult =
  | { kind: 'contact'; clientId: string; contactId: string; direction: 'in' | 'out' }
  | { kind: 'domain'; clientId: string; reason: string; direction: 'in' | 'out' }
  | { kind: 'none' };

export function buildIndex(input: {
  contacts: { id: string; clientId: string; email: string | null }[];
  clients: { id: string; domains: string[] | null }[];
  selfAddresses: string[];
}): ContactIndex {
  const byEmail = new Map<string, { clientId: string; contactId: string }>();
  for (const c of input.contacts) {
    if (!c.email) continue;
    byEmail.set(canonicalize(c.email), { clientId: c.clientId, contactId: c.id });
  }

  const byDomain = new Map<string, string>();
  for (const client of input.clients) {
    for (const raw of client.domains ?? []) {
      const domain = raw.toLowerCase().replace(/^www\./, '');
      // Never domain-match a free provider, and never let one client's domain
      // silently override another's — first registration wins, and an ambiguous
      // domain is better left unmatched than assigned to a coin flip.
      if (!domain || isFreeProvider(domain) || byDomain.has(domain)) continue;
      byDomain.set(domain, client.id);
    }
  }

  return {
    byEmail,
    byDomain,
    self: new Set(input.selfAddresses.map(canonicalize)),
  };
}

export function matchMessage(msg: ParsedMessage, index: ContactIndex): MatchResult {
  const from = msg.from;
  const counterparties: Address[] = [];

  const fromIsSelf = from ? index.self.has(canonicalize(from.email)) : false;
  const direction: 'in' | 'out' = fromIsSelf ? 'out' : 'in';

  // The other side of the conversation. On a message you sent, that is the
  // recipients; on one you received, it is the sender.
  if (fromIsSelf) {
    counterparties.push(...msg.to, ...msg.cc);
  } else if (from) {
    counterparties.push(from);
  }

  const others = counterparties.filter((a) => !index.self.has(canonicalize(a.email)));

  // A message where you are the only participant — a note to self, a calendar
  // invite you sent yourself — records nothing about a client.
  if (others.length === 0) return { kind: 'none' };

  for (const address of others) {
    const hit = index.byEmail.get(canonicalize(address.email));
    if (hit) {
      return { kind: 'contact', clientId: hit.clientId, contactId: hit.contactId, direction };
    }
  }

  for (const address of others) {
    const clientId = index.byDomain.get(address.domain);
    if (clientId) {
      return {
        kind: 'domain',
        clientId,
        reason: `matched the domain ${address.domain} via ${address.email}`,
        direction,
      };
    }
  }

  return { kind: 'none' };
}

/** A short, human-readable summary of a message for the dry-run report. */
export function describe(msg: ParsedMessage): string {
  const who = msg.from?.email ?? 'unknown sender';
  const subject = msg.subject?.trim() || '(no subject)';
  return `${who} — ${subject}`;
}
