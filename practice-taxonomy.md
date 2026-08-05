# Panta Practice Taxonomy
**Status:** Decided v1.0 · **Last updated:** July 30, 2026 · Supersedes the three-practice structure currently live on the site

---

## 1. The organizing principle

Practices are sorted by **who pays and what they receive** — not by topic. The
previous structure failed because it presented three different *kinds* of
business as three equal cards: one client-services practice, one product
practice, and one civic practice with no buyer at all.

The brand verbs already encode the right split, so they become the frame:

| Verb | Kind of business | Who pays | Status |
|---|---|---|---|
| **BUILD** | Client services | Clients | **Live — the only thing sellable today** |
| **CONNECT** | Community work | Grants / mission-funded / free | Taking root |
| **CREATE** | Own products | Market | Taking root |

**Naming rule:** the verb is the frame (eyebrow, section label, mission tie-in).
The practice underneath gets a plain-English name, because buyers search for the
thing, not for the verb.

---

## 2. The three practices

### BUILD → **Web & Systems**
*Route: `/web-strategy/` (unchanged — do not mint a third URL for this practice)*

What clients hire Panta for. Strategy and engineering under one roof, aimed at
how an organization shows up online and how it runs behind the scenes.

**Service areas (four, was three):**
1. **Web Strategy & Planning** → the Digital Presence Plan (the entry offer)
2. **Websites & Web Channels** → `/web-strategy/websites/` (the "I need a website" intent page)
3. **Systems & Custom Software** → *NEW.* Process improvement, internal tools,
   integrations, custom builds. Previously absent from the site entirely.
4. **Content, Brand & Ongoing Support** → client-facing content and maintenance

**The entry offer does not change.** The Digital Presence Plan stays the single
front door. Systems & Custom Software is a *capability the Plan's roadmap
surfaces*, not a second thing to market. Nothing here dilutes the one-offer
homepage rule.

**Why Systems moved here rather than becoming a fourth practice:** same team,
same skills, sellable today. The Plan already produces findings like "intake is
three disconnected spreadsheets" — that finding had nowhere to land. Filing it
under "coming soon" underprices a current capability.

**Naming note:** "Web & Systems" replaces the label "Web Strategy &
Development". The URL stays `/web-strategy/` — this practice has already been
renamed once (from Digital Business Consulting) and a second redirect chain buys
nothing. A label/URL mismatch is normal and costs nothing.

---

### CONNECT → **Community Programs & Content**
*Route: `/community-programs/` (unchanged)*

Community-facing work with no client. Merges the former standalone Community
Program Development practice with community content, which are the same practice
seen from two sides: both connect people to something they need.

**Contains:**
- Programs that put people in touch with resources already within reach
- Content produced to stimulate and inform community

**Why merged:** neither has a buyer, both are mission-funded, and the existing
Sanity copy for Community Programs ("people finding each other") already reads
like it wants content inside it. Two thin practices become one coherent one.

**Distinguish carefully from BUILD's content service.** Client content marketing
is a paid deliverable under Web & Systems. Community content is Panta's own
published output. Same craft, different practice, different funding.

---

### CREATE → **Product Development**
*Route: `/product-development/` (unchanged)*

Digital **and physical** products that promote community productivity and
advancement. Panta decides, builds, and releases to a market.

**Content gap:** the live page describes digital products only. The physical
side is stated in the owner's scope and needs to appear in the Sanity copy.

---

## 3. Where each layer appears

| Layer | Content | Location |
|---|---|---|
| **Why** | Build. Connect. Create. / supporting the people who support our community | Homepage hero, as brand eyebrow |
| **What you can buy** | Web & Systems → the Digital Presence Plan | Homepage — all conversion real estate; `/web-strategy/` |
| **Where this goes** | All three practices, honestly framed | `/what-we-do/` only |

The homepage sells BUILD. It does not list practices. The `OUR PRACTICES`
footnote came out of the hero — a link list where two destinations say "taking
root" spends credibility on every visit.

**Done July 30, 2026.** The homepage hero was rewritten to a single static
offer: headline, sub, one bamboo CTA to the free consultation, and the Delta Bay
Impact testimonial as proof. The four-state autoplaying slideshow was removed
entirely; Build/Connect/Create became a static three-up row below the hero
(`#verbs`), each card keeping its `data-section` so the GA4
`home_section_view` funnel survives — now firing `via=scroll` again rather than
`via=slide`. `index.astro` went from 1334 lines to 646.

---

## 4. Change list (not yet applied)

### Code — APPLIED July 30, 2026
- `src/layouts/Base.astro` — practice label `Web Strategy & Development` →
  `Web & Systems`; mega menu regrouped under the three verbs; meta description
  rewritten
- `src/pages/index.astro` — hero rewritten: the practices footnote is gone
  along with the whole slideshow (see below)
- `src/pages/web-strategy/index.astro` — services triad became four
- `src/pages/community-programs.astro` — absorbs content; page title
- `src/pages/what-we-do.astro` — the three-practice breadth page

### Sanity — APPLIED July 30, 2026
Applied via `site/scripts/apply-taxonomy.mjs` (the Sanity MCP server was
unreachable). See also `apply-funnel-edits.mjs`, `apply-homepage-fixes.mjs`,
and `apply-hero-copy.mjs` — same engine, `scripts/lib/apply-edits.mjs`.

### Sanity (build-time content — requires rebuild + redeploy)
- `missionPage.practices[]` — remove or relabel; the hero list is being deleted
- `webStrategyPage` — add the fourth service area; hero copy admits systems
- `communityProgramsPage` — retitle to include content; add a content card
- `productDevelopmentPage` — add physical products to the copy

### Redirects
None required. All three practice URLs are unchanged by design.

---

## 5. Open, deliberately deferred

**Three overlapping "who we are" pages.** The homepage is the mission story,
`/what-we-do/` is the company overview, `/about/` is the origin story. That
redundancy predates this taxonomy work and should be resolved separately — most
likely by collapsing `/what-we-do/` and `/about/` once the breadth layer has a
settled home.

**The free consultation vs. the paid Plan naming collision** is tracked in
`SANITY-EDITS.md` and is unaffected by this taxonomy.
