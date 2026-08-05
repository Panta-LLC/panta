/**
 * Date formatting for Pulse.
 *
 * Always formats in UTC. Sanity datetimes arrive as ISO strings, and a
 * date-only value ("2026-07-20") parses as UTC midnight — formatting that in a
 * negative-offset zone (the whole US) renders the PREVIOUS day. Publishing a
 * post dated the 20th and seeing "July 19" on the page is the bug this exists
 * to prevent.
 */
const opts = { timeZone: 'UTC' };

/** "July 20, 2026" — article headers. */
export const formatLong = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { ...opts, month: 'long', day: 'numeric', year: 'numeric' });

/** "Jul 20, 2026" — cards, rails, lists. */
export const formatShort = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { ...opts, month: 'short', day: 'numeric', year: 'numeric' });

/**
 * Card/rail metadata. Guides never show a date and show nothing in its place
 * (PULSE-HOME-BUILD.md §5b), so this returns just the read time for them.
 */
export const postMeta = (post, { long = false } = {}) =>
  [
    post.contentType === 'guide' ? null : (long ? formatLong : formatShort)(post.publishedAt),
    post.readTime ? `${post.readTime} min read` : null,
  ]
    .filter(Boolean)
    .join(' · ');
