import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import { createClient } from '@sanity/client';

/**
 * Package pages that are BUILT but carry <meta name="robots" content="noindex">.
 *
 * packages/[slug].astro builds a page for every LISTED package — not only the
 * page-ready ones — so an editor can preview the real URL before flipping the
 * flag, and marks it noindex until `pageReady` is on. The sitemap must not list
 * those: a URL that is both submitted and noindex is exactly the contradiction
 * the filter below exists to prevent, and it was shipping five of them.
 *
 * Derived from the same flag the template reads rather than hardcoded, so
 * turning `pageReady` on in the Studio adds the page to the sitemap on the next
 * build with no change here. A hardcoded '/packages/' would have to be
 * remembered and removed at exactly the wrong moment.
 *
 * On a query failure this excludes EVERY package page rather than none, and the
 * build continues. Omitting a live page from the sitemap costs a little
 * discovery; submitting a noindex one is a self-inflicted contradiction on a
 * site that sells being findable.
 */
const noindexPackagePaths = async () => {
  try {
    const slugs = await createClient({
      projectId: process.env.PUBLIC_SANITY_PROJECT_ID ?? 'tdi9ql1j',
      dataset: process.env.PUBLIC_SANITY_DATASET ?? 'pantaco',
      apiVersion: '2026-07-28',
      useCdn: false,
    }).fetch(
      `*[_type == "packageOffer" && !(_id in path("drafts.**"))
         && coalesce(listed, true) == true
         && coalesce(pageReady, false) != true
         && defined(slug.current)].slug.current`,
    );
    return slugs.map((slug) => `/packages/${slug}/`);
  } catch (err) {
    console.warn(
      `[sitemap] could not read package pageReady flags (${err.message}) — ` +
        'excluding all /packages/ from the sitemap for this build',
    );
    return ['/packages/'];
  }
};

const NOINDEX_PATHS = await noindexPackagePaths();

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
      // noindex prototype pages stay out of the sitemap until incorporated —
      // listing a page we also tell crawlers not to index is a contradiction,
      // and an avoidable one on a site that sells being findable.
      //
      // /thanks is not a prototype but is excluded for a stronger reason: it
      // fires the pulse_check_booked conversion on load, so a crawler or a
      // curious visitor arriving from search would each be counted as a
      // booking. It is reachable only by a scheduler redirect.
      //
      // NOINDEX_PATHS above adds the package pages that are built-but-noindex,
      // resolved from Sanity at config time.
      filter: (page) =>
        ![
          '/journey',
          '/consultation-condensed',
          '/hero-mockup',
          '/hero-centered',
          '/thanks',
          ...NOINDEX_PATHS,
        ].some((p) => page.includes(p)),
    }),
  ],
});
