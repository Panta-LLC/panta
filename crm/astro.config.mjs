// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';

/**
 * The CRM is the inverse of site/ in every way that matters.
 *
 * site/ is `output: 'static'` with two `prerender = false` escape hatches,
 * because it is a public marketing surface whose speed is the point. Here
 * every route reads a database and sits behind a login, so there is nothing
 * to prerender and `output: 'server'` is the honest setting. A page that
 * accidentally prerendered would be a page that served one user's data to
 * whoever asked next.
 *
 * `checkOrigin` is DISABLED, and that is not a relaxation — the equivalent
 * check is enforced for every mutating request in src/middleware.ts instead.
 *
 * Astro's built-in version compares the Origin header against the request URL.
 * Vercel's proxy rewrites that URL, so a form posted from crm.panta.llc to
 * crm.panta.llc is judged cross-site and rejected with "Cross-site POST form
 * submissions are forbidden". site/src/pages/api/contact.ts hit exactly this
 * and works around it by comparing Origin to x-forwarded-host by hand; the
 * middleware here does the same thing once, for every route, which is stronger
 * than the per-route version and actually works behind the proxy.
 *
 * No webAnalytics: this is a private tool, and the pages are named after
 * clients. There is nothing here that should reach an analytics vendor.
 */
export default defineConfig({
  output: 'server',
  adapter: vercel(),
  integrations: [react()],
  // See the note above — enforced in src/middleware.ts instead, because the
  // built-in check cannot see the real host behind Vercel's proxy.
  security: { checkOrigin: false },
  // 4380 is site/, 3333 is studio/. 4321 is Astro's default and was already
  // taken on this machine by an unrelated process.
  server: { port: 4390 },
  vite: {
    // pg and its dependencies are Node-only; keep Vite from trying to bundle
    // them for the browser when the React islands are built.
    ssr: { external: ['pg'] },
  },
});
