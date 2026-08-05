// The services overview moved to /services/, matching the nav label and the
// homepage hero's service links. Server-rendered so both /what-we-do and
// /what-we-do/ get a real 301 — config redirects only match the exact
// no-trailing-slash form, which is why the other legacy routes live in server
// routes too (see mission.ts, web-strategy/[...rest].ts).
export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ redirect }) => redirect('/services/', 301);
