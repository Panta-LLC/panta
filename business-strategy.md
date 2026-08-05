# Panta — Business Strategy
**Status:** Committed v1.0 · **Last updated:** July 31, 2026
**This document is the anchor.** Site structure, page copy, and video scripts
follow from it — not the other way around. When a design debate stalls, the
question is "what does the strategy say," not "what reads better."

---

## 1. Mission

Help small businesses and community organizations implement the best tools and
processes to optimize their operations and serve people better.

## 2. The canonical triad

**Digital, Strategic, Creative.**

This exact wording, in this order, everywhere: site copy, video scripts
(Script 7 already says it), proposals, bios. Earlier variants — "Strategy,
Design & Technology", "Strategy, Technology, and Creative" — are retired.

## 3. What we sell (service lines)

Support across the triad, delivered through:

- Web design & development
- Media design & production
- Physical & digital product design
- Marketing support
- Systems design (process improvement, custom software)

**Web presence services are the sellable front door today** — the free
30-minute consultation and the Digital Presence Plan remain the funnel. The
homepage leads with them not because they are the whole business, but because
they are the part a stranger can buy this week.

## 4. What we do besides sell (own initiatives)

- Create and release products (digital and physical)
- Produce content
- Pursue our own community initiatives

These are not side projects; they are half the identity and, per §5, most of
the marketing.

## 5. How we grow (promotional channels)

1. **Content creation** — essays, videos, field notes
2. **Product development & releases**
3. **Networking and outreach**

Not: paid acquisition, SEO-first content farming.

## 6. How we earn credibility

1. **Thought leadership** — published thinking is the proof mechanism available
   *today*, while the metric-carrying case-study stack is still thin (see
   `panta-proof-gap` memory: one testimonial, two case studies, no numbers).
2. **Product releases** — a shipped product is capability proof no engagement
   letter can match.
3. **Client work highlights** — grows as metrics are gathered from Delta Bay
   Impact and Arielle Rae Hastings.

## 7. What this means for the site

- **Homepage = agency-promotional lead + editorial band that grows.** The band
  (Latest from Panta) renders only when published content exists — presence-
  detected, like the video slots. No empty shelves. The balance shifts toward
  editorial as the archive deepens; that shift is earned by cadence, not
  designed in advance.
- **`/web-strategy/` merges into `/`** — the homepage is the agency storefront,
  agency-wide. Practice children (`/web-strategy/websites/`,
  `/web-strategy/digital-presence-plan/`) keep their URLs.
- **Mission material lives on `/about/`** (verbs, origin story). The homepage
  sells; About tells.
- **Room for future practices** is a compact "Growing next" strip on the
  homepage plus the existing teaser pages; each upgrades to full placement when
  it has something sellable or shipped.
- **Articles are Sanity `article` documents.** The API accepts types the Studio
  schema doesn't know yet, so publishing works now via `site/scripts/new-article.mjs`;
  adding the type to the Studio (separate project) is a follow-up for browser
  editing.

## 8. Launch definition

The site is launch-ready when:
1. The agency homepage (merged, this document's §7) is live at panta.llc
2. The seven videos are shot (blockers in `content-architecture.md` §2–3 fixed first)
3. At least three content pieces are published so the editorial band is real
4. Client metrics gathered (unblocks promise-register copy; parallel, not gating)

## 9. Out of scope for launch

- Community Programs as a marketed practice (teaser page only)
- A `/journal/` index page (added at ~5 pieces)
- Pricing on the site (quote-on-request stands)
