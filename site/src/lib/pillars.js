/**
 * Pillar helpers — grouping and link resolution.
 *
 * The pillar COPY (kicker, head, lede, bullets) used to live here as a literal.
 * It now comes from Sanity `pillar` documents via `getPillars()`, so a wording
 * change is an edit, not a deploy. What has not changed is that there are
 * exactly three of them and that their ids are load-bearing — the Studio blocks
 * creating and deleting pillars for that reason (studio/sanity.config.ts), and
 * the names still have to agree with the video scripts and business-strategy.md
 * §2.
 *
 * Service *list* order is independent: `service.order` is site-wide and
 * `getServices()` already returns documents in that order. Pillar is taxonomy
 * (homepage columns, optional labels), not sort key.
 *
 * These functions stay pure: callers pass the fetched pillars in. Base.astro
 * renders on every page, and a fetch hidden inside a sort helper would be
 * invisible at the call site.
 */

/** Services bucketed under their pillar, pillars in the order given. */
export const groupByPillar = (pillars = [], services = []) =>
  pillars.map((p) => ({...p, services: services.filter((s) => s.pillar === p.id)}));

/**
 * Flat list in Sanity reading order (`service.order`, then title).
 *
 * Prefer `getServices()` when you only need the ordered list — it already
 * sorts in GROQ. This helper is for when you already have an unordered array
 * (or mixed sources) and need the same canonical sort without another fetch.
 */
export const orderServices = (services = []) =>
  [...services].sort((a, b) => {
    const ao = a?.order ?? Number.POSITIVE_INFINITY;
    const bo = b?.order ?? Number.POSITIVE_INFINITY;
    if (ao !== bo) return ao - bo;
    return String(a?.title ?? '').localeCompare(String(b?.title ?? ''));
  });

/**
 * Where a service link should point.
 *
 * Until a service's page copy is written (`pageReady`), it links to its block
 * on the overview instead of a thin page. Flipping the flag in the Studio
 * upgrades the link everywhere with no deploy — which is why nothing should
 * hardcode either form.
 */
export const serviceHref = (s) =>
  s?.pageReady ? `/services/${s.slug}/` : `/services/#${s.slug}`;
