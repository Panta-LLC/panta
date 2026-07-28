import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://panta.llc',
  // Static site + one server endpoint (/api/contact, SMTP send).
  // Deploying now requires Vercel functions: git-connected builds or
  // `vercel deploy --prebuilt` — a plain static-file upload won't run the API.
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
