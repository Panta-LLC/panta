// Legacy routes from two renames ago: /digital-business-consulting/ became
// /web-strategy/, which has since been retired in favour of /services/. These
// point at final destinations, not at the intermediate segment, so an old link
// resolves in one hop. Server-rendered so every variant (with or without
// trailing slash, known or unknown subpath) gets a real 301.
export const prerender = false;

import type { APIRoute } from 'astro';

const MAP: Record<string, string> = {
  // The hub merged into the homepage; pointing straight at / avoids a chain.
  '': '/',
  websites: '/services/web-design-development/',
  'digital-presence-plan': '/digital-presence-plan/',
};

export const GET: APIRoute = ({ params, redirect }) => {
  const rest = (params.rest ?? '').replace(/\/+$/, '');
  return redirect(MAP[rest] ?? '/', 301);
};
