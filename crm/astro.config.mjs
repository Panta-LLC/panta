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
 * `checkOrigin` is ENABLED here, where site/astro.config.mjs had to disable it.
 * The site disabled it because Vercel's proxy rewrites the request URL and it
 * broke /api/contact; that route works around it by comparing Origin against
 * x-forwarded-host by hand. The CRM's forms are all same-origin and all of
 * them mutate a database, so CSRF protection is worth far more here than the
 * one edge case it costs.
 *
 * No webAnalytics: this is a private tool, and the pages are named after
 * clients. There is nothing here that should reach an analytics vendor.
 */
export default defineConfig({
  output: 'server',
  adapter: vercel(),
  integrations: [react()],
  security: { checkOrigin: true },
  // 4380 is site/, 3333 is studio/. 4321 is Astro's default and was already
  // taken on this machine by an unrelated process.
  server: { port: 4390 },
  vite: {
    // pg and its dependencies are Node-only; keep Vite from trying to bundle
    // them for the browser when the React islands are built.
    ssr: { external: ['pg'] },
  },
});
