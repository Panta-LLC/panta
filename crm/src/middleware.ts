/**
 * The single authentication choke point.
 *
 * Every route in this project is private. Rather than remember a guard on each
 * page, the default is "deny" and a short allowlist names the handful of paths
 * that must work without a session. A new page added tomorrow is protected by
 * having done nothing.
 *
 * This is also the concrete reason the CRM is its own Astro project rather
 * than a directory inside site/: middleware is global to a project, so sharing
 * one with the marketing site would mean a path-prefix exception list running
 * on every public page render — and that kind of check fails open.
 */
import { defineMiddleware } from 'astro:middleware';

import { SESSION_COOKIE, resolveSession } from './lib/auth/session.ts';

/**
 * Paths that resolve without a session.
 *
 * - /login and /api/auth/* are how you get one.
 * - /api/cron/* authenticates with a CRON_SECRET bearer instead, because
 *   Vercel's scheduler has no cookie. Those handlers check it themselves.
 */
const PUBLIC_PREFIXES = ['/login', '/api/auth/', '/api/cron/'];

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  const token = context.cookies.get(SESSION_COOKIE)?.value;
  const user = await resolveSession(token);
  context.locals.user = user;

  if (!user && !isPublic(pathname)) {
    // Preserve where they were going. An API call gets a 401 instead of a
    // redirect, so a fetch() from an island fails loudly rather than parsing
    // the login page as JSON.
    if (pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ ok: false, error: 'unauthenticated' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }

    const next = pathname + context.url.search;
    return context.redirect(`/login?next=${encodeURIComponent(next)}`, 302);
  }

  // Already signed in and looking at the login page: go to the dashboard.
  if (user && pathname === '/login') {
    return context.redirect('/', 302);
  }

  const response = await next();

  // Defence in depth on top of robots.txt. This app is named after clients and
  // full of candid notes about them; it should never appear in an index, and a
  // header is harder to forget than a meta tag on one layout.
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  response.headers.set('Referrer-Policy', 'same-origin');
  response.headers.set('X-Content-Type-Options', 'nosniff');

  return response;
});
