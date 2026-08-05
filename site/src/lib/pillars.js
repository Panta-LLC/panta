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
 * These functions stay pure: callers pass the fetched pillars in. Base.astro
 * renders on every page, and a fetch hidden inside a sort helper would be
 * invisible at the call site.
 */

/** Services bucketed under their pillar, pillars in the order given. */
export const groupByPillar = (pillars = [], services = []) =>
  pillars.map((p) => ({...p, services: services.filter((s) => s.pillar === p.id)}));

/**
 * Flat list in canonical reading order: pillar order first, then `order`
 * within the pillar.
 *
 * GROQ can only sort `pillar` alphabetically (creative, digital, strategic),
 * which is not the order the brand uses — sorting by `order` alone interleaves
 * the pillars. Anything rendering a flat list of services wants this, not the
 * raw query result.
 *
 * Services whose pillar matches no pillar document are appended rather than
 * dropped. Now that the pillars are content, an id can go missing — and a
 * service silently vanishing from the nav is a worse failure than one showing
 * up last.
 */
export const orderServices = (pillars = [], services = []) => {
  const known = new Set(pillars.map((p) => p.id));
  return [
    ...groupByPillar(pillars, services).flatMap((p) => p.services),
    ...services.filter((s) => !known.has(s.pillar)),
  ];
};

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
