// Content screen for the public contact forms.
//
// The honeypot in LeadForm.astro / contact.astro catches the bot that fills
// every input it finds. It does nothing about the bot that fills only the real
// ones, which is what actually got through: a payload whose `name` field was a
// paragraph of Russian promo copy ending in a link, posted straight at
// /api/contact. That submission was well-formed by every rule the route had —
// a name, an address with an @ in it — so it was relayed, put in a Subject
// line, and bounced by the receiving host as spam.
//
// So this is a second gate, and it reads content rather than structure.
//
// It is a SCORE, not a rule list, because most individual signals here have a
// legitimate submission behind them. A link in the message is how someone
// shows you the site they want looked at. A missing Origin header is how some
// privacy tooling posts a form. Non-Latin text is how a person with a
// non-Latin name writes their name. Any of those alone must not cost a lead —
// the whole business is inbound, and a false positive is silent and
// unrecoverable, which makes it far more expensive than a spam email. Only the
// handful of signals with no honest explanation at all (a URL in the name
// field, a name longer than a name) are weighted to block on their own.
//
// Tuning note for later: every block is logged with its reasons (see
// api/contact.ts). If a real person is ever caught, the log says which signal
// did it — start there rather than lowering the threshold wholesale.

export type SpamVerdict = {
  spam: boolean;
  score: number;
  /** Signal names, for the log line. Never shown to the submitter. */
  reasons: string[];
};

/** At or above this, the submission is dropped. Single signals worth 3 block alone. */
const THRESHOLD = 3;

/** A name is a name. Anything past this is a payload wearing one. */
const MAX_NAME = 80;

/**
 * Scripts this business does not receive honest mail in. Panta sells local
 * digital-presence work to US small businesses; the inbound is English.
 *
 * Weighted 2 rather than 3 on purpose — it is the one signal here that could
 * plausibly describe a real person (a name written in its own script), so it
 * needs a second signal to block. It never blocks alone.
 */
const NON_LATIN =
  /[Ѐ-ӿ֐-׿؀-ۿऀ-ॿ฀-๿぀-ヿ一-鿿가-힯]/;

/** Anything that reads as a link, including the schemeless forms bots favour. */
const LINK =
  /(?:https?:\/\/|www\.)[^\s<>"']+|\b[a-z0-9][a-z0-9-]*\.(?:com|net|org|ru|cn|xyz|top|click|info|biz|shop|online|site|link|icu|live|store|google)\b/gi;

/** Markup for a link, which no plain-text form field has a reason to contain. */
const LINK_MARKUP = /\[url[=\]]|<a\s+href|\[link[=\]]/i;

/**
 * Words that show up in the payloads and essentially nowhere in a real note.
 * Deliberately short and specific: "seo" and "marketing" are things clients
 * write to us about, so they are not on it.
 */
const KEYWORDS = [
  'casino',
  'crypto wallet',
  'bitcoin',
  'binary option',
  'viagra',
  'backlink',
  'guest post',
  'porn',
  'розыгрыш',
  'рублей',
  'приглашен',
  'маркетплейс',
];

/** Control characters, which only appear when someone is probing mail headers. */
const CONTROL = /[\u0000-\u001F\u007F]/;

function countLinks(text: string): number {
  return text.match(LINK)?.length ?? 0;
}

/**
 * Screens one submission.
 *
 * `org` is exempt from the link signal by design: that field literally asks for
 * "Website, Social Account, or Business Profile URL", so a URL there is the
 * field working. It is still screened for script, keywords and control chars.
 *
 * `hasOrigin` is whether the request carried an Origin or Referer naming our
 * own host. Browsers send Origin on every form POST, so its absence means the
 * request did not come from a page — but it is only worth 1, because that is a
 * claim about the client rather than about the content, and some clients strip
 * it. It tips a borderline submission; it does not decide one.
 */
export function screenSubmission({
  name,
  email,
  org = '',
  message = '',
  hasOrigin = true,
}: {
  name: string;
  email: string;
  org?: string;
  message?: string;
  hasOrigin?: boolean;
}): SpamVerdict {
  const reasons: string[] = [];
  let score = 0;
  const add = (points: number, reason: string) => {
    score += points;
    reasons.push(reason);
  };

  // --- signals with no honest explanation ------------------------------
  // A person's name never contains a link, and a form that puts the pitch in
  // the name field is the single most reliable tell in the payloads we get:
  // the name is what lands in the Subject line, so that is where it goes.
  if (countLinks(name) > 0) add(3, 'link_in_name');
  if (name.length > MAX_NAME) add(3, 'name_too_long');
  if (CONTROL.test(name) || CONTROL.test(email) || CONTROL.test(org)) {
    add(3, 'control_chars');
  }
  if (LINK_MARKUP.test(`${name} ${message}`)) add(3, 'link_markup');

  const messageLinks = countLinks(message);
  if (messageLinks >= 3) add(3, 'link_farm');

  // --- signals that need company ---------------------------------------
  if (NON_LATIN.test(`${name} ${org} ${message}`)) add(2, 'non_latin_script');
  if (messageLinks > 0 && messageLinks < 3) add(Math.min(messageLinks, 2), 'links_in_message');

  const hay = `${name} ${org} ${message}`.toLowerCase();
  const hits = KEYWORDS.filter((word) => hay.includes(word));
  if (hits.length) add(Math.min(hits.length, 2), `keywords:${hits.slice(0, 3).join(',')}`);

  if (!hasOrigin) add(1, 'no_origin');

  // The name pasted verbatim into the message is one blob filling every field.
  // Length-gated so "Dan" appearing inside a note Dan wrote does not count.
  if (name.length > 40 && message.includes(name)) add(1, 'name_echoed_in_message');

  return { spam: score >= THRESHOLD, score, reasons };
}

/**
 * Strips anything that could break out of a mail header, and truncates.
 *
 * Applies to every submitted value that reaches a header (Subject, Reply-To).
 * nodemailer encodes headers itself, so this is belt-and-braces rather than the
 * only guard — but the truncation is load-bearing on its own: a 200-character
 * "name" in a Subject line is what got our mail flagged in the first place.
 */
export function headerSafe(value: string, max = 60): string {
  const flat = value
    .replace(/[\u0000-\u001F\u007F]+/g, ' ')
    .replace(/"/g, '')
    .trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}
