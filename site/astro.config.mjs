import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

export default defineConfig({
  // The host that actually serves a 200. The apex allthingspanta.com 308s to
  // www, so naming the apex here would point every canonical, og:url and
  // sitemap entry at a redirect. panta.llc still resolves to this same
  // project — see the note in robots.txt.
  site: 'https://www.allthingspanta.com',
  // Static site + one server endpoint (/api/contact, SMTP send).
  // Deploying now requires Vercel functions: git-connected builds or
  // `vercel deploy --prebuilt` — a plain static-file upload won't run the API.
  //
  // No webAnalytics option: analytics is Plausible now (src/components/
  // Analytics.astro), and leaving this on would have shipped a second tracker
  // collecting the same pageviews. Turn Web Analytics off in the Vercel project
  // dashboard too — this flag only stops the adapter injecting the loader, and
  // Vercel can also inject it at the edge when the dashboard toggle is on.
  adapter: vercel(),
  // The contact endpoint does its own Origin/Host check (see api/contact.ts);
  // Astro's built-in one rejects valid posts behind Vercel's proxy.
  security: { checkOrigin: false },
  // Legacy-URL 301s live in server routes (src/pages/mission.ts and
  // src/pages/digital-business-consulting/[...rest].ts) rather than here:
  // config redirects only match the exact no-trailing-slash form, so the
  // slashed variants 404'd in production.
  integrations: [
    sitemap({
      // noindex prototype pages stay out of the sitemap until incorporated
      filter: (page) => !page.includes('/journey'),
    }),
  ],
});
