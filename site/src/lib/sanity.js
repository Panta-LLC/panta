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

const PROJECT_CARD = `_id, name, clientType, url, situation, summary, contributions,
  outcome, featured, thumbnail, imageAlt, year, "slug": slug.current`;

/** All client projects, in display order (card-level fields only). */
export const getProjects = () =>
  sanity.fetch(
    `*[_type == "project" && !(_id in path("drafts.**"))] | order(order asc){${PROJECT_CARD}}`
  );

/** Projects that have their own case study page. */
export const getCaseStudies = () =>
  sanity.fetch(
    '*[_type == "project" && defined(slug.current) && !(_id in path("drafts.**"))] | order(order asc){..., "slug": slug.current}'
  );

/** First testimonial (the site currently shows one). */
export const getTestimonial = () =>
  sanity.fetch('*[_type == "testimonial" && !(_id in path("drafts.**"))][0]{quote, author, role}');
