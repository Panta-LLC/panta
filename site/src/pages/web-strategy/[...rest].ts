// The /web-strategy/ segment is retired. Its hub merged into the homepage, its
// websites page became the web-design-development service, and the Plan
// moved to the top level (it is a paid offer, not one of the services).
//
// Catch-all rather than one file per route: it matches the bare segment and
// every subpath, with or without a trailing slash. Astro config redirects only
// match the exact no-trailing-slash form, which is why every legacy 301 in this
// project lives in a server route.
export const prerender = false;

import type { APIRoute } from 'astro';

const MAP: Record<string, string> = {
  '': '/',
  websites: '/services/web-design-development/',
  'digital-presence-plan': '/digital-presence-plan/',
};

export const GET: APIRoute = ({ params, redirect }) => {
  const rest = (params.rest ?? '').replace(/\/+$/, '');
  return redirect(MAP[rest] ?? '/services/', 301);
};
