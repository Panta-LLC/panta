/**
 * The booking scheduler: Koalendar.
 *
 * Replaced a Google Calendar appointment embed, which was chosen for costing
 * nothing and had one disqualifying flaw — it reported nothing back to the host
 * page and could not redirect on completion, so a booking was not observable by
 * any means and the whole funnel bottomed out at "the calendar scrolled into
 * view". See docs/FUNNEL-MEASUREMENT.md.
 *
 * There is only ONE URL to configure. Koalendar's embed is the same booking
 * link with `?embed=true` on it, so the embed URL is derived here rather than
 * being a second field in the Studio for someone to keep in sync, paste the
 * plain link into, or forget the parameter on.
 */

/**
 * The booking page URL as an embeddable one.
 *
 * Returns null rather than a broken string when the setting is empty or is not
 * a URL, so the pages that use it can render their "open in a new tab"
 * fallback instead of an iframe pointed at nothing.
 *
 * @param {string | null | undefined} scheduleUrl
 * @returns {string | null}
 */
export function bookingEmbedUrl(scheduleUrl) {
  if (!scheduleUrl) return null;
  try {
    const url = new URL(scheduleUrl);
    // set(), not append(): a link pasted from Koalendar's own "embed" tab
    // already carries the parameter, and appending would send `embed=true&
    // embed=true`.
    url.searchParams.set('embed', 'true');
    return url.toString();
  } catch {
    // A relative path or free text in the Studio's URL field. Not fatal —
    // the fallback link still works, and a missing calendar is more obvious
    // to spot than a subtly malformed one.
    return null;
  }
}
