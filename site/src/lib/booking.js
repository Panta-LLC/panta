/**
 * The booking scheduler: Google Calendar appointment schedules.
 *
 * This replaced Koalendar, which was briefly the scheduler because it could
 * redirect the invitee on completion and Google cannot — see the note in
 * thanks.astro and docs/FUNNEL-MEASUREMENT.md for what going back costs in
 * measurement. Nothing else about the booking flow changes: the same one URL
 * feeds the embed and the fallback link.
 *
 * There is still only ONE URL to configure. Google's embeddable form of an
 * appointment schedule is the same booking link with `gv=true` on it, so the
 * embed URL is derived here rather than being a second field in the Studio for
 * someone to keep in sync, paste the plain link into, or forget the parameter
 * on. (`calEmbedUrl` is that second field, from the first time round. It is
 * retired and no longer read.)
 */

/** Google's short share links. They redirect, and they do not frame. */
const SHORT_LINK_HOST = 'calendar.app.google';

/**
 * The booking page URL as an embeddable one.
 *
 * Returns null rather than a broken string when the setting is empty, is not a
 * URL, or is a share link that cannot be framed, so the pages that use it can
 * render their "open in a new tab" fallback instead of an iframe pointed at
 * nothing.
 *
 * @param {string | null | undefined} scheduleUrl
 * @returns {string | null}
 */
export function bookingEmbedUrl(scheduleUrl) {
  if (!scheduleUrl) return null;
  try {
    const url = new URL(scheduleUrl);
    // A `calendar.app.google/…` link is what Google's Share dialog offers
    // first, so it is the one most likely to get pasted into the Studio. It
    // works perfectly as a link and not at all in a frame — it 302s to the
    // long form, which arrives without `gv=true` and refuses to be embedded.
    // Better a working fallback link than an iframe showing a refusal.
    if (url.hostname === SHORT_LINK_HOST) return null;
    // set(), not append(): a link copied from Google's own "embed" snippet
    // already carries the parameter, and appending would send `gv=true&gv=true`.
    url.searchParams.set('gv', 'true');
    return url.toString();
  } catch {
    // A relative path or free text in the Studio's URL field. Not fatal —
    // the fallback link still works, and a missing calendar is more obvious
    // to spot than a subtly malformed one.
    return null;
  }
}
