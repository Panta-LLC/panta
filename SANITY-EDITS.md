# Sanity edits to pair with the funnel changes

Studio: https://panta-co.sanity.studio/ — project `tdi9ql1j`, dataset `pantaco`

All page copy is fetched at **build time**, so none of these appear on the live
site until a rebuild + redeploy. Do all of them, then rebuild once.

---

## 1. REQUIRED — blocking the deploy

The button destination changed in code; the label lives here. Right now the
button says "Read the mission behind it" but goes to the Web Strategy page.

| Document | Field | Change to |
|---|---|---|
| Community Programs page | `ctaSecondaryLabel` | `See the practice that's live` |
| Product Development page | `ctaSecondaryLabel` | `See the practice that's live` |

Both currently read `Read the mission behind it`.

---

## 2. REQUIRED — the free call vs. the paid plan

The free 30-minute call was branded "Web Presence Audit" while the paid offering
is the "Digital Presence Plan". Prospects who finished the free call believed
they had already received the plan. "Audit", "scorecard", "graded" and
"40-check" now belong **only** to the paid plan.

### Contact page

| Field | Currently | Change to |
|---|---|---|
| `heroCtaLabel` | `Book the free audit` | `Book the free consultation` |
| `heroLede` | `The fastest path is the free 30-minute web presence audit — book a time directly, no back-and-forth. Prefer to start in writing? The form works too.` | `The fastest path is the free 30-minute consultation — book a time directly, no back-and-forth. Prefer to start in writing? The form works too.` |
| `nextItems` — the item reading `We'll schedule your free 30-minute web presence audit to hear what's going on.` | | `We'll schedule your free 30-minute consultation to hear what's going on.` |
| `nextItems` — the item reading `If the audit fits, we'll send the intake questionnaire and get started. If it doesn't, we'll point you somewhere useful.` | | `If we're a fit, we'll recommend the next step — usually the Digital Presence Plan. If we're not, we'll point you somewhere useful.` |

**The last one is the most important edit on this page.** The intake
questionnaire is a step in the *paid* plan, so the current wording promises paid
deliverables off the free call.

Leave alone: the item reading *"Response speed is one of the things we audit — so
we model it."* That's the paid diagnostic used as a verb, and it's accurate.

### Consultation page

| Field | Currently | Change to |
|---|---|---|
| `heroLabel` | `Free 30-minute web presence audit` | `Free 30-minute consultation` |
| `bookCtaLabel` | `Book my free audit ↓` | `Book my free consultation ↓` |
| `bookingTitle` | `Book your free 30-minute web presence audit.` | `Book your free 30-minute consultation.` |

Leave `heroLede` alone — it's already clean.

### Mission page (the homepage)

| Field | Currently | Change to |
|---|---|---|
| `secondaryCtaLabel` | `Book a free 30-minute audit` | `Book a free 30-minute consultation` |

---

## 3. RECOMMENDED — the hero CTA is now a button

`heroDirectLabel` used to be a small text link at the bottom of the practices
list. It's now the single primary button in the homepage hero, so a question
reads oddly on it.

| Document | Field | Currently | Change to |
|---|---|---|---|
| Mission page | `heroDirectLabel` | `Here for a website? Start here` | `See how we build websites` |

Optional, same doc: `practicesLabel` from `Our practices` to `The practices
behind it`, since the list is now a footnote under the offer rather than the
menu.

---

## 4. RECOMMENDED — the verbs are now hero slides

The three Build/Connect/Create panels are no longer full-screen sections you
scroll through; they're slides in the homepage hero, so their copy sits at a
smaller size and gets read more often.

| Document | Field | Currently | Change to |
|---|---|---|---|
| Mission page | `verbPanels[build].chips[1]` | `Services shaped to how your unique workflows` | `Services shaped to how your workflows actually run` |

That first one is a live copy bug — an ungrammatical fragment, visible on the
site today and more prominent now.

Optional, same doc:

- `verbPanels[build].head` is `Growth requires stable ground. ` with a trailing
  space. Trim it in the Studio rather than in the template, so the data is clean.
- `verbPanels[].num` reads `01 · The first verb`. Still accurate — it numbers the
  verb, not the slide — but the slide bar next to it already shows `2 / 4`, so
  something shorter (`01 · Build`) would read less redundant.

---

## Not in Sanity — still yours to do

- **Google Calendar:** switch the appointment schedule to 30-minute slots.
- **Google Calendar:** rename the schedule itself. Its public title says
  "audit" and it renders *inside* the booking iframe on `/consultation/`, where
  no code or Sanity edit can reach it. If renaming creates a new schedule,
  update `siteSettings.scheduleUrl` and `siteSettings.calEmbedUrl`.
- **Vercel:** enable Web Analytics in the project's Analytics tab, or the
  cookieless page counts stay empty.
- **GA4** (`G-N46J0CDDZF`, shared with panta.studio — filter by hostname):
  register event-scoped custom dimensions `cta`, `location`, `section`, `word`,
  `via`. Without these the new params are collected but invisible in every
  report. Mark `cta_click`, `booking_viewed` and `contact_submitted` as key
  events.
- **GA4:** annotate the hero-slideshow deploy date. Two rates jump on it, and
  neither is a real behaviour change:
  - `home_section_view` for `build`/`connect`/`create` now fires when a slide
    becomes active (`via=slide`) instead of when a section scrolls into view
    (`via=scroll`), so nearly everyone who stays ~18s registers all three.
  - The homepage went from ~6 viewports tall to ~3, so scroll-depth (90%) rates
    rise too.
  - `location=home_build` and `location=rail` stop appearing — those elements
    (the Build panel's off-ramp button and the verb rail) no longer exist. The
    hero CTA covers `cta=websites` on every slide instead.

---

## When the Sanity edits are saved

From `site/`:

```bash
npm run build
```

Then confirm the label actually changed:

```bash
grep -o '<a[^>]*btn--ghost[^>]*>[^<]*</a>' dist/client/community-programs/index.html
```

It should no longer say "Read the mission behind it". Then deploy.
