/**
 * Turning raw mail headers into things that can be matched.
 *
 * Everything here is pure, because the matcher built on top of it decides
 * whose timeline a message lands on — and getting that wrong is not a cosmetic
 * bug, it is one client's correspondence showing up under another's name.
 */

/**
 * Free mailbox providers.
 *
 * Domain matching is a useful fallback for `@theirorg.com`, and a catastrophe
 * for `@gmail.com`: one client with a Gmail address would claim every personal
 * message in the mailbox. Any domain in this set is never matched on.
 */
export const FREE_PROVIDERS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'ymail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
  'pm.me',
  'gmx.com',
  'mail.com',
  'zoho.com',
  'fastmail.com',
  'hey.com',
]);

/** Local parts that are machines, not people. */
const NOREPLY = /^(no-?reply|donotreply|do-not-reply|bounce|mailer-daemon|postmaster|notifications?|automated|noreply-)/i;

export type Address = { name: string | null; email: string; domain: string };

/**
 * Parse one address out of a header value.
 *
 * Handles `Name <a@b.com>`, `"Last, First" <a@b.com>` and a bare `a@b.com`.
 * Deliberately not a full RFC 5322 parser — group syntax and comments do not
 * appear in practice, and a simpler function that is obviously correct beats a
 * thorough one nobody can check.
 */
export function parseAddress(raw: string): Address | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const angled = /<([^>]+)>\s*$/.exec(trimmed);
  const email = (angled ? angled[1]! : trimmed).trim().toLowerCase();

  if (!email.includes('@') || /\s/.test(email)) return null;

  let name: string | null = null;
  if (angled) {
    name = trimmed.slice(0, angled.index).trim().replace(/^"|"$/g, '').trim() || null;
  }

  const domain = email.slice(email.lastIndexOf('@') + 1);
  if (!domain) return null;

  return { name, email, domain };
}

/** Split a To/Cc header, respecting quoted display names containing commas. */
export function parseAddressList(raw: string | null | undefined): Address[] {
  if (!raw) return [];

  const parts: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const ch of raw) {
    if (ch === '"') inQuotes = !inQuotes;
    if (ch === ',' && !inQuotes) {
      parts.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  parts.push(current);

  return parts
    .map(parseAddress)
    .filter((a): a is Address => a !== null);
}

/**
 * Canonical form for comparison.
 *
 * Strips `+tags`, and strips dots from the local part for Gmail-family
 * domains only — Google treats `d.hastings@` and `dhastings@` as the same
 * mailbox, but most other providers do not, and applying that rule everywhere
 * would merge genuinely different people.
 */
export function canonicalize(email: string): string {
  const lower = email.trim().toLowerCase();
  const at = lower.lastIndexOf('@');
  if (at === -1) return lower;

  let local = lower.slice(0, at);
  const domain = lower.slice(at + 1);

  const plus = local.indexOf('+');
  if (plus !== -1) local = local.slice(0, plus);

  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    local = local.replace(/\./g, '');
  }

  return `${local}@${domain}`;
}

export function isFreeProvider(domain: string): boolean {
  return FREE_PROVIDERS.has(domain.toLowerCase().replace(/^www\./, ''));
}

export function isNoReply(email: string): boolean {
  return NOREPLY.test(email.slice(0, email.indexOf('@')));
}

/** Hostname of a website URL, for seeding a client's matchable domains. */
export function domainFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const host = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    const clean = host.replace(/^www\./, '').toLowerCase();
    return isFreeProvider(clean) ? null : clean;
  } catch {
    return null;
  }
}

/**
 * Should this message be ignored entirely?
 *
 * Newsletters and automated senders are the bulk of any real mailbox, and
 * filing them onto a client's timeline would bury the handful of messages that
 * actually record the relationship.
 */
export function shouldSkip(input: {
  labelIds?: string[];
  from: Address | null;
  headers: Record<string, string>;
}): string | null {
  const labels = input.labelIds ?? [];
  if (labels.includes('SPAM')) return 'spam';
  if (labels.includes('TRASH')) return 'trash';
  if (labels.includes('DRAFT')) return 'draft';

  if (input.headers['list-unsubscribe'] || input.headers['list-id']) return 'bulk';
  if (input.headers['precedence']?.toLowerCase() === 'bulk') return 'bulk';
  if (input.headers['auto-submitted'] && input.headers['auto-submitted'] !== 'no') {
    return 'auto';
  }

  if (input.from && isNoReply(input.from.email)) return 'noreply';

  return null;
}
