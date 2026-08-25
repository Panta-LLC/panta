/**
 * Package link resolution.
 *
 * Same rule `serviceHref` enforces: nothing may hardcode either link form, so
 * flipping `pageReady` in the Studio upgrades every card with no deploy.
 *
 * The fallback differs from services on purpose. A service that is not page
 * ready falls back to `/services/#slug`, because an overview page exists to
 * fall back TO. There is no packages index, so an unready package falls back to
 * the service it draws on — a real page with a real CTA, which is what the
 * reference is for.
 */
import { serviceHref } from './pillars.js';

/**
 * Where a package card should point, or `null` when it should not be a link at
 * all. Returning null rather than '#' or '/' is deliberate: a card that leads
 * nowhere should not look clickable, and the homepage renders it as a plain
 * element when this is null.
 */
export const packageHref = (p) => {
  if (p?.pageReady && p?.slug) return `/packages/${p.slug}/`;
  /* `anchor` exists for the one package whose home is a SECTION of a service
     page rather than the page itself — Custom Software lives under Operations
     (journey-redesign.md §3). Without it that card had no service reference at
     all and rendered as plain text: a dead card on the homepage, which is what
     the redesign flagged. Appending the fragment here rather than at the call
     site keeps the rule that nothing outside this file spells out a package URL. */
  if (p?.service?.slug) {
    const href = serviceHref(p.service);
    /* Only when the service has its own page. `serviceHref` falls back to
       `/services/#slug`, and a second fragment on that would be `#operations#small-tools` —
       a URL that matches no element and scrolls nowhere. */
    return p.anchor && p.service.pageReady ? `${href}#${p.anchor}` : href;
  }
  return null;
};
