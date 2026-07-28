// Legacy routes: the practice moved from /digital-business-consulting/ to
// /web-strategy/. Server-rendered so every variant (with or without trailing
// slash, known or unknown subpath) gets a real 301.
export const prerender = false;

import type { APIRoute } from 'astro';

const MAP: Record<string, string> = {
  '': '/web-strategy/',
  websites: '/web-strategy/websites/',
  'digital-presence-plan': '/web-strategy/digital-presence-plan/',
};

export const GET: APIRoute = ({ params, redirect }) => {
  const rest = (params.rest ?? '').replace(/\/+$/, '');
  return redirect(MAP[rest] ?? '/web-strategy/', 301);
};
