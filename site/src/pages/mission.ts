// Legacy route: the mission story became the homepage. Server-rendered so
// both /mission and /mission/ get a real 301.
export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ redirect }) => redirect('/', 301);
