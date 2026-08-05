# PULSE-HOME-BUILD.md
## Build brief: Panta homepage + Pulse editorial platform

Companion file: `panta-homepage-copy.md` is the copy source of truth. This brief covers architecture, design system, components, schema, and phasing. Where copy is needed, pull from the deck — do not paraphrase it.

---

## 1. Context

Panta (panta.llc) is a consultancy providing digital, strategic, and creative support to small businesses and community organizations, with a lean toward community orgs. Two surfaces in scope:

1. **Homepage** — conversion surface. Nine sections. Every CTA routes to the entry offer.
2. **Pulse** — editorial platform (index + article template). Thought-leadership surface. Primary conversion on the index is newsletter subscribe; Pulse Check CTA appears only at the end of articles.

**Entry offer:** the Pulse Check — a free 30-minute review plus a one-page written readout delivered within 48 hours. Button copy is always descriptive ("Book a free 30-minute review"); "Pulse Check" branding lives in headlines and microcopy, never on buttons.

## 2. Stack

- Next.js (App Router), TypeScript
- Sanity CMS (structured content; schema in §6)
- Deployed on Vercel
- Booking: link CTA buttons to scheduling flow (Cal.com/Calendly embed or page — confirm before build); include a 3–4 question intake form ahead of booking
- Newsletter: provider TBD (Buttondown/ConvertKit class) — build the form against a single `subscribe` server action so the provider is swappable

## 3. Design system

**Palette:** cream `#F5F1E7` (page background), charcoal `#26251F` (text, primary buttons), bamboo green `#6F8B3C` (accent — used sparingly).

**Accent restraint rule:** green appears only as: ripple mark, pillar icons, step numbers, category kickers on Pulse. Primary buttons are charcoal. The two filled buttons per page are the loudest elements — nothing may compete.

**Type system:**
- Spectral (serif) — "voice" surfaces: hero headline, problem framing, quotes, Pulse masthead, founder note, final CTA headline, article standfirst + body + headers
- Instrument Sans — structure: nav, pillar cards, steps, labels, UI
- IBM Plex Mono — kickers and metadata: "What we do", category tags, breadcrumbs, "Featured · Flow"

**Voice/structure alternation:** homepage sections alternate serif (voice) and sans (structure). Article pages are fully voice. This rhythm is intentional — preserve it.

**General:** hairline borders, generous whitespace, flat surfaces, no gradients/shadows. Editorial feel > SaaS feel.

## 4. Homepage spec (9 sections)

Copy for all sections: see `panta-homepage-copy.md`.

1. **Hero — two-column.** Left (~60%): serif headline, sans subhead, quiet "See our work →" text link. Right (~40%): "What we do" mono kicker; six-item service link index styled as hairline-ruled rows with arrow glyphs (not cards/buttons); primary button below; microcopy under button ("We call it the Pulse Check · written readout in 48 hours"). Mobile: stacks headline → subhead → link index → CTA.
   - Each service link routes to its service page. **Rule:** every service page must end in its own review CTA (scenic routes, not leaks). Service pages are out of scope for this phase — links may point to a services overview page with anchors until they exist.
2. **Trust bar** — quiet strip, `surface` tint. Logos if ≥3 real ones exist; otherwise use single-line fallback from the deck.
3. **Problem framing** — centered, narrow measure, serif lead line + sans body.
4. **Service pillars** — three cards (Digital/Strategic/Creative), green icons, outcome-led headers, section CTA line beneath.
5. **How it works** — three steps, green step numerals, no boxes needed; trust copy is the payload.
6. **Featured case study** — image + serif quote + body + metric + link. DBI is the launch case study.
7. **Pulse strip** — serif "Pulse" masthead, tagline, three article cards (rule-line style: top border, title, category · read time), "Read all of Pulse →", newsletter inline form.
8. **Founder note** — photo (natural setting), serif note, signature line.
9. **Final CTA** — serif headline (branded), sans body, charcoal button (descriptive), reassurance microcopy.

## 5. Pulse spec

### 5a. Index page (`/pulse`)

Top to bottom:
- **Masthead:** large serif "Pulse", tagline, horizontal category nav between hairlines: All · Signal (· being found) · Flow (· running smoother) · Voice (· telling the story) · Guides. Glosses render in muted text at every appearance.
- **Featured slot:** editor-picked (via `featured` boolean), not newest. Mono kicker "Featured · {category}", serif headline, standfirst, byline meta, image right.
- **Three section rails:** Signal / Flow / Voice columns, 2 items each, rule-line list style with date · read time.
- **Guides row:** tinted band, labeled "Evergreen how-tos · no dates, kept current", card style.
- **Newsletter footer:** the ONLY filled CTA on the page besides nav. No Pulse Check CTA anywhere on the index.

**Launch-state degradation:** if any category has <2 posts, replace the three rails with a single mixed reverse-chron list under the featured slot. Rails switch on automatically when each category reaches 2 published essays. Guides row hidden until ≥2 guides exist.

### 5b. Article template (`/pulse/[slug]`)

- **Header:** mono breadcrumb `Pulse / {Category} · {gloss}` (gloss always shown, category in green); serif claim-style headline; serif standfirst; byline row (avatar, name, date · read time). Guides render no date; show nothing in its place.
- **Body:** ~65ch measure, Spectral, line-height ~1.8, headers in Spectral (no family switch). Pull-quote block style: left rule, no rounded corners, max one per piece. No sidebar, no popups, no mid-article CTAs of any kind.
- **End sequence (strict order):**
  1. Hairline rule + **category bridge**: `category.bridgeCopy` rendered as short paragraph + text-link CTA "Book a free 30-minute review →" (text link, NOT a button)
  2. **Newsletter card** (tinted, compact inline form)
  3. **Keep reading:** two items — prefer manual `related` refs; fallback to same-category recent; aim to pair one essay + one guide when available

## 6. Sanity schema

```
post {
  title: string
  slug: slug
  standfirst: text            // magazine deck; separate from SEO description
  seoDescription: text
  category: reference -> category
  contentType: 'essay' | 'guide'
  publishedAt: datetime       // guides: not displayed
  lastReviewed: datetime      // internal freshness tracking, esp. guides
  body: blockContent
  readTime: number            // computed at build from body length
  featured: boolean           // drives index featured slot (enforce max 1 via desk structure or query newest featured)
  heroImage: image
  related: array<reference -> post>   // optional, manual override
  relatedService: reference -> service (optional)
}

category {
  name: string                // Signal | Flow | Voice
  gloss: string               // "being found" | "running smoother" | "telling the story"
  pillar: string              // digital | strategic | creative
  bridgeCopy: text            // end-of-article CTA paragraph — THE funnel lives here
}

author {
  name, role, photo, shortBio
}

siteSettings {
  trustBarLogos: array<image> // homepage renders fallback line if <3
  featuredCaseStudy: reference
  newsletterBlurb: string
}
```

Bridge copy drafts (seed content for `category.bridgeCopy`):
- **Flow:** "If your week disappears into processes like this one, that's usually fixable. A Pulse Check is a free 30-minute review — you'll leave with a written readout and two or three things worth doing either way."
- **Signal:** "If people who need your work can't find it, that's usually fixable. A Pulse Check is a free 30-minute review — you'll leave with a written readout and two or three things worth doing either way."
- **Voice:** "If your story isn't landing the way the work deserves, that's usually fixable. A Pulse Check is a free 30-minute review — you'll leave with a written readout and two or three things worth doing either way."

## 7. Conversion rules (enforce in review)

1. Buttons describe, copy brands. No button ever reads "Pulse Check."
2. One conversion behavior per surface: homepage → book review; Pulse index → subscribe; article end → bridge (text link) then subscribe.
3. Green is scarce (see §3). Two filled buttons max per page.
4. No invented metrics — bracketed placeholders must block launch, not ship.
5. Copy bans: leverage, solutions, empower, seamless, digital transformation.

## 8. Phasing

**Phase 1 — Homepage.** All nine sections against the copy deck. Booking flow wired. Newsletter action stubbed against provider interface. Ship behind real content check (see blockers).

**Phase 2 — Pulse.** Schema, index (with launch-state degradation), article template, RSS feed, category routes (`/pulse/signal` etc. can be filtered views of index).

**Phase 3 — Service pages.** Six pages matching hero link index, each ending in a review CTA. Until then, hero links → services overview anchors.

## 9. Launch blockers (content, not code)

- [ ] DBI quote, attribution, and one honest metric (case study section)
- [ ] Trust bar: 3+ client logos OR use fallback line
- [ ] Founder photo (natural setting)
- [ ] Three published Pulse pieces (one per category preferred) — homepage Pulse strip cannot ship empty
- [ ] Booking tool decision + intake form questions (3–4)
- [ ] Newsletter provider decision

## 10. Out of scope this build

Service detail pages (Phase 3), case study detail pages beyond DBI, About page redesign, Growth Audit paid-offer page (exists separately; do not conflate with the free Pulse Check).
