// RETIRED NAME. The offer was called "the Pulse Check" and is called "the
// Review" now (journey-redesign.md §3, and src/lib/offer.js for the full note).
// This alias stays because it is printed on things that already exist and on
// profiles we do not control the history of — a link that has been handed out
// does not stop existing when the name changes. /review is the alias to give
// out from here on; see review.ts.
//
// A 301 rather than a second page on purpose: every CTA on the site already
// points at /consultation/, and the whole point of one landing page is that
// `/consultation/` → `booking_viewed` stays a single ratio. Two live URLs would
// halve both numbers and make neither trustworthy. See docs/PLAUSIBLE-FUNNELS.md.
//
// Not /pulse-check/ under /pulse/ — that segment is the editorial archive, and
// a reader who lands on an article expects more articles, not an offer.
//
// Server-rendered so both /pulse-check and /pulse-check/ get a real 301; Astro
// config redirects only match the exact no-trailing-slash form (see
// astro.config.mjs and the other legacy routes in this directory).
export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ redirect }) => redirect('/consultation/', 301);
