# Panta Sanity Studio

Content editing for panta.llc. Project `tdi9ql1j`, dataset `pantaco`, deployed
at **https://panta-co.sanity.studio/**.

```bash
npm install
npm run dev      # http://localhost:3333
npm run deploy   # publishes to panta-co.sanity.studio (needs `npx sanity login`)
```

## Why this directory exists

The original Studio was deployed from a folder that no longer exists on any
machine and was never committed — which is why `article` documents published by
`site/scripts/new-article.mjs` were invisible in the Studio: the type wasn't in
its schema, and there was no source to add it to.

The schema was recovered from the dataset itself. When a Studio deploys, Sanity
stores the extracted schema as `_.schemas.<workspace>`; all fifteen original
types were rebuilt from it verbatim. The recovered manifest is kept at
`.schema-manifest.recovered.json` for reference.

**Consequence: this directory is now the source of truth for the schema.** Edit
here, `npm run deploy`, and the hosted Studio updates. Do not deploy from
anywhere else.

## Layout

- `schemaTypes/` — one file per type. Fifteen recovered + `article` (new).
- `sanity.config.ts` — workspace, desk structure, singleton protection.
- `sanity.cli.ts` — pins `studioHost: 'panta-co'` so deploys keep the same URL.

## Singletons

Page content lives in singleton documents addressed by literal `_id`
(`missionPage`, `aboutPage`, …) which `site/src/lib/sanity.js` `getDoc()` fetches
directly. The config groups them under **Pages** and strips their delete /
unpublish / duplicate actions and create templates — deleting one would empty a
page on the live site.

Collections (`article`, `project`, `testimonial`, `practiceTeaserPage`) behave
normally.

## Fixed sets

`pillar` is a collection whose membership is brand structure, not content:
there are exactly three (Digital, Strategic, Creative) and every `service`
points at one by `pillarId`. Editable like any document, but create / duplicate
/ delete are stripped the same way singletons are — a fourth pillar renders a
fourth homepage column with no services under it, and a deleted one orphans
every service assigned to it.

Seeded by `node scripts/seed-pillars.mjs --apply` from `site/`, which is also
where the launch copy is recorded.

## Publishing articles

Either works, and both write the same documents:

- **Studio** — Articles → Create
- **CLI** — `node scripts/new-article.mjs …` from `site/` (see
  `business-strategy.md` §7)

One rule: article `_id`s must use a **dash** (`article-my-slug`), never a dot.
Sanity treats dotted ids as path ids (like `drafts.*`) and hides them from the
public API, so the site would never see them. `new-article.mjs` already does
this correctly.

## After any content or schema change

The site reads Sanity at **build time**, so changes need a site rebuild and
redeploy before they appear on panta.llc.
