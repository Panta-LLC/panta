// Build-time Sanity client for panta.llc content.
// Content is edited at https://panta-co.sanity.studio/ — a production build
// (`astro build`) picks up whatever is published at build time.
import { createClient } from '@sanity/client';

export const sanity = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID ?? 'tdi9ql1j',
  dataset: import.meta.env.PUBLIC_SANITY_DATASET ?? 'pantaco',
  apiVersion: '2026-07-28',
  useCdn: false, // static build: always read fresh published content
});

/** Fetch a singleton page document by its stable _id. */
export const getDoc = (id) => sanity.fetch('*[_id == $id][0]', { id });

/**
 * Homepage trust-bar logos: the clients curated in siteSettings.trustBarClients,
 * in that array's order, with each logo resolved from the Client Profile it
 * belongs to.
 *
 * `logoApproved` is filtered here rather than trusted to editorial discipline —
 * a logo we have not been cleared to use must not reach the page just because
 * someone dragged the client into the list. Clients with no logo drop out for
 * the same reason: an empty slot in a row of logos reads as a broken image.
 *
 * The page only prefers these when there are three or more; otherwise it falls
 * back to the launch set in public/clients/.
 */
export const getTrustBarLogos = () =>
  sanity.fetch(
    `*[_id == "siteSettings"][0].trustBarClients[]->{
      "src": logo.asset->url,
      "alt": coalesce(logo.alt, name)
    }[defined(src)]`
  );

// ---------------------------------------------------------------- clients --

const CLIENT_CARD = `_id, name, sector, location, url, summary,
  "slug": slug.current,
  "logo": select(logoApproved == true => logo.asset->url),
  "logoAlt": coalesce(logo.alt, name)`;

/** Every client profile, in manual order. */
export const getClients = () =>
  sanity.fetch(
    `*[_type == "client" && !(_id in path("drafts.**"))]
      | order(order asc, name asc){${CLIENT_CARD}}`
  );

/**
 * Cache a zero-arg query for the life of the build.
 *
 * Base.astro renders on every page, so anything it fetches multiplies by the
 * page count. The services list is needed there (nav, footer, org JSON-LD) and
 * on several pages besides — without this it would be ~25 identical round
 * trips per build.
 *
 * TRADEOFF: the module outlives a single render in `astro dev`, so content
 * edited in the Studio will not appear until the dev server restarts. That is
 * correct for builds (one snapshot per build) and only mildly annoying in dev.
 */
const memo = (fn) => {
  let cached;
  return () => (cached ??= fn());
};

// -------------------------------------------------------------- pillars ----

/**
 * The three pillars, in reading order. Memoised for the same reason services
 * are: Base.astro needs them on every page to order the nav.
 *
 * `pillarId` is aliased to `id` because that is what it is everywhere else —
 * the value `service.pillar` holds, and the key lib/pillars.js groups on.
 */
export const getPillars = memo(() =>
  sanity.fetch(
    `*[_type == "pillar" && !(_id in path("drafts.**")) && defined(pillarId)]
      | order(order asc){"id": pillarId, order, kicker, head, lede, bullets}`
  )
);

// ------------------------------------------------------------- services ----

const SERVICE_CARD = `_id, title, indexLabel, summary, pillar, order, pageReady,
  legacyAnchors, "slug": slug.current`;

/** Every service, pillar order then within-pillar order. Memoised. */
export const getServices = memo(() =>
  sanity.fetch(
    `*[_type == "service" && !(_id in path("drafts.**")) && defined(slug.current)]
      | order(order asc, title asc){${SERVICE_CARD}}`
  )
);

/** Slugs only — for getStaticPaths. */
export const getServiceSlugs = () =>
  sanity.fetch(
    `*[_type == "service" && !(_id in path("drafts.**")) && defined(slug.current)].slug.current`
  );

/** One service, fully dereferenced, for its detail page. */
export const getService = (slug) =>
  sanity.fetch(
    `*[_type == "service" && slug.current == $slug][0]{
      ...,
      "slug": slug.current,
      "featuredProjects": featuredProjects[]->{${PROJECT_CARD}},
      "relatedServices": relatedServices[]->{title, summary, pageReady, "slug": slug.current}
    }`,
    { slug }
  );

// `name` and `clientType` are the project's own free-text copies; `client` is
// the profile they were copied from. Both ship until the pages that read the
// flat fields are moved over — see studio/schemaTypes/project.ts.
const PROJECT_CARD = `_id, name, clientType, url, situation, summary, contributions,
  outcome, featured, thumbnail, imageAlt, year, "slug": slug.current,
  "client": client->{name, sector, url, "slug": slug.current,
    "logo": select(logoApproved == true => logo.asset->url),
    "logoAlt": coalesce(logo.alt, name)}`;

/** All client projects, in display order (card-level fields only). */
export const getProjects = () =>
  sanity.fetch(
    `*[_type == "project" && !(_id in path("drafts.**"))] | order(order asc){${PROJECT_CARD}}`
  );

/** Projects that have their own case study page. */
export const getCaseStudies = () =>
  sanity.fetch(
    `*[_type == "project" && defined(slug.current) && !(_id in path("drafts.**"))]
      | order(order asc){
        ..., "slug": slug.current,
        "client": client->{name, sector, url, "slug": slug.current,
          "logo": select(logoApproved == true => logo.asset->url),
          "logoAlt": coalesce(logo.alt, name)}
      }`
  );

/** First testimonial (the site currently shows one). */
export const getTestimonial = () =>
  sanity.fetch(
    `*[_type == "testimonial" && !(_id in path("drafts.**"))][0]{
      quote, author, role,
      "client": client->{name, "slug": slug.current,
        "logo": select(logoApproved == true => logo.asset->url),
        "logoAlt": coalesce(logo.alt, name)}
    }`
  );

/**
 * The homepage case study. Prefers siteSettings.featuredCaseStudy so it can be
 * swapped without a code change; falls back to Delta Bay Impact, the launch
 * pick (PULSE-HOME-BUILD.md §4.6).
 */
export const getFeaturedCaseStudy = () =>
  sanity.fetch(
    `coalesce(
      *[_id == "siteSettings"][0].featuredCaseStudy->{name, quote, quoteAuthor, quoteRole, summary, outcome, clientType, contributions, "slug": slug.current, thumbnail, image,
        "client": client->{name, sector, "slug": slug.current,
          "logo": select(logoApproved == true => logo.asset->url),
          "logoAlt": coalesce(logo.alt, name)}},
      *[_type == "project" && slug.current == "delta-bay-impact"][0]{name, quote, quoteAuthor, quoteRole, summary, outcome, clientType, contributions, "slug": slug.current, thumbnail, image,
        "client": client->{name, sector, "slug": slug.current,
          "logo": select(logoApproved == true => logo.asset->url),
          "logoAlt": coalesce(logo.alt, name)}}
    )`
  );

// ---------------------------------------------------------------- Pulse ----
// PULSE-HOME-BUILD.md §5–6. Read times are computed here rather than stored,
// so they can never drift from the body they describe.

const POST_CARD = `
  title,
  "slug": slug.current,
  standfirst,
  publishedAt,
  contentType,
  "category": category->{name, gloss, "slug": slug.current},
  "readTime": round(length(pt::text(body)) / 5 / 200)
`;

/** Published posts, newest first. `type` optionally narrows to essay|guide. */
export const getPosts = (limit = 24, type = null) =>
  sanity.fetch(
    `*[_type == "post" && !(_id in path("drafts.**")) && defined(slug.current)
       ${type ? '&& contentType == $type' : ''}]
      | order(publishedAt desc)[0...$limit]{${POST_CARD}}`,
    type ? { limit, type } : { limit }
  );

/**
 * The index featured slot is editor-picked via `featured`, NOT newest (§5a).
 * If several are flagged, the most recent wins.
 */
export const getFeaturedPost = () =>
  sanity.fetch(
    `*[_type == "post" && !(_id in path("drafts.**")) && featured == true]
      | order(publishedAt desc)[0]{${POST_CARD}, heroImage, "author": author->{name, role}}`
  );

/** Full post for the article template, including body and resolved relations. */
export const getPost = (slug) =>
  sanity.fetch(
    `*[_type == "post" && slug.current == $slug && !(_id in path("drafts.**"))][0]{
      ${POST_CARD},
      seoDescription,
      body,
      heroImage,
      "category": category->{name, gloss, bridgeCopy, "slug": slug.current},
      "author": author->{name, role, photo},
      "clients": clients[]->{name, url, "slug": slug.current},
      "related": related[]->{${POST_CARD}}
    }`,
    { slug }
  );

/** Every post that needs a page built. */
export const getPostSlugs = () =>
  sanity.fetch(
    `*[_type == "post" && !(_id in path("drafts.**")) && defined(slug.current)].slug.current`
  );

/**
 * "Keep reading" fallback when a post has no manual `related` (§5b): most
 * recent in the same category, excluding the current post. Over-fetches so the
 * caller can pair one essay with one guide where both exist.
 */
export const getRelatedPosts = (slug, categorySlug) =>
  sanity.fetch(
    `*[_type == "post" && !(_id in path("drafts.**")) && slug.current != $slug
       && category->slug.current == $categorySlug]
      | order(publishedAt desc)[0...6]{${POST_CARD}}`,
    { slug, categorySlug }
  );

/** Categories in display order, for the index nav and rails. */
export const getCategories = () =>
  sanity.fetch(
    `*[_type == "category" && !(_id in path("drafts.**"))]
      | order(order asc, name asc){name, gloss, bridgeCopy, "slug": slug.current}`
  );
