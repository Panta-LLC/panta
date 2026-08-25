// The offer is called "the Review"; the page that sells it lives at
// /consultation/. This alias exists so social posts, the Google Business
// Profile and anything printed can carry a link that matches the name of the
// thing, without splitting the funnel across two URLs.
//
// It replaces /pulse-check as the alias worth handing out — that one still 301s
// here's destination too, because it is printed on things that already exist
// (see pulse-check.ts). Neither is a second landing page: every CTA on the site
// points at /consultation/, and the whole point of one landing page is that
// `/consultation/` → `booking_viewed` stays a single ratio. Two live URLs would
// halve both numbers and make neither trustworthy. See docs/PLAUSIBLE-FUNNELS.md.
//
// Server-rendered so both /review and /review/ get a real 301; Astro config
// redirects only match the exact no-trailing-slash form (see astro.config.mjs
// and the other legacy routes in this directory).
export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ redirect }) => redirect('/consultation/', 301);
