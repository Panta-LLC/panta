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
  if (p?.service?.slug) return serviceHref(p.service);
  return null;
};
