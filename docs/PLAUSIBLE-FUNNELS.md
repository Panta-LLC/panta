# Plausible conversion funnels

Configuration spec for the funnels on `allthingspanta.com`. All of it is
dashboard work — the site is already instrumented and needs no code changes to
support any of this.

Both funnels and custom properties are **Business plan** features.

This is the *how* for the measurement plan in
[`FUNNEL-MEASUREMENT.md`](FUNNEL-MEASUREMENT.md), which is where the reasoning
lives — what each event is for, why four of them kept their existing names, and
what is blocking the macro conversion. Read that one first if you are deciding
something; read this one if you are configuring Plausible.

## What the site already sends

Defined in [`site/src/components/Analytics.astro`](../site/src/components/Analytics.astro),
which exposes `window.pantaTrack(event, props)` and a declarative
`data-track` / `data-track-*` click handler.

| Event | Properties | Fired from |
| --- | --- | --- |
| `cta_click` | `cta`, `location` | 65 elements sitewide, via `data-track` |
| `home_section_view` | `section`, `via` | any section carrying `data-section` **on a page that renders `SectionViews`** — `/`, `/about/`, `/services/*`, `/packages/*`, `/consultation/` |
| `booking_viewed` | `variant` (condensed prototype only) | calendar embed scrolls into view |
| `contact_submitted` | `intent`, `location` | `/contact/` and every inline `LeadForm` |
| `contact_failed` | `intent` | `/contact/` |
| `newsletter_subscribe` | `location`, `status` | `NewsletterForm` |
| `video_play` | — | `ScriptVideo` |
| `case_study_read` | `study` | `/work/:slug/`, via `ReadDepth` — 75% of the article **and** 20s on page |
| `pulse_article_read` | `post`, `category` | `/pulse/:slug/`, same component and thresholds |
| `outbound_email_click` | `address` | any `mailto:` link, anywhere |
| `pulse_check_booked` | `cta_location`, `booking_type` | `/thanks/`, where Koalendar redirects after a booking — ⚠ **needs Koalendar Pro** |

Every one of these also carries `source_page` (the path it fired on) and, on
pages that declare one, `service_line` (the service slug). Both are attached
centrally in `Analytics.astro`; no call site sets them.

Plausible's own `outboundLinks`, `fileDownloads` and `formSubmissions` are on
as well. `outboundLinks` does **not** cover `mailto:` — hence the hand-rolled
`outbound_email_click`.

## Prerequisites

1. **Register the custom properties** under Settings → Properties: `cta`,
   `location`, `section`, `intent`, `variant`, `status`, `via`, `source_page`,
   `service_line`, `study`, `post`, `category`, `address`, `cta_location`,
   `booking_type`. They are collected today but are neither displayed nor
   filterable until they are registered — and property-filtered goals depend on
   them.
2. **Funnels are not retroactive.** A funnel only counts visitors from the
   moment it is created. Create them before the data is needed, not after.
3. Verify page paths against the Top Pages report before saving pageview
   goals. Astro builds directory-format URLs, so the path is `/consultation/`
   with a trailing slash, and Plausible treats `/consultation` as a separate
   page.
4. **`/pulse-check/` is not a page.** It is a 301 to `/consultation/`
   ([`pulse-check.ts`](../site/src/pages/pulse-check.ts)) so social posts and
   the Google Business Profile can link a URL that matches the name of the
   offer. It records no pageview of its own — visitors who arrive that way show
   up on `/consultation/`, which is the point. Don't add a goal for it.

## Goals (Settings → Goals) — created 2026-08-15

All fifteen exist. The **display name** column is what the funnel builder and
every report shows, so it is the name to type when composing funnels.

| Goal | Display name | Type |
| --- | --- | --- |
| `/` | `Home` | Pageview *(pre-existing)* |
| `/consultation/` | `Visit /consultation/` | Pageview |
| `/pulse/*` | `Visit /pulse/*` | Pageview |
| `/services/*` | `Visit /services/*` | Pageview — the plan's `service_page_view` |
| `/work/*` | `Visit /work/*` | Pageview |
| `booking_viewed` | `booking_viewed` | Custom event *(pre-existing)* |
| `case_study_read` | `case_study_read` | Custom event |
| `pulse_article_read` | `pulse_article_read` | Custom event |
| `pulse_check_booked` | `pulse_check_booked` | Custom event — **the macro conversion** |
| `outbound_email_click` | `outbound_email_click` | Custom event |
| `home_section_view` where `section` = `packages` | `Section: packages` | Custom event, property-filtered |
| `home_section_view` where `section` = `consultation_readout` | `Section: consultation readout` | Custom event, property-filtered |
| `cta_click` where `cta` = `choose_note` | `CTA: choose note` | Custom event, property-filtered |
| `cta_click` where `location` = `case_study_cta` | `CTA: case study` | Custom event, property-filtered |
| `contact_submitted` where `location` = `consultation_ask` | `Contact: consultation ask` | Custom event, property-filtered |

⚠ **Display names must be unique, and the failure is silent.** A property-
filtered goal on an event that already has an unfiltered goal — `cta_click` and
`home_section_view` both do — is rejected if you let Plausible auto-fill the
display name from the event, and the dialog stays open without an error you'd
notice. Always type an explicit display name, and type it *after* setting the
property filter; filling it earlier gets overwritten.

Three unfiltered goals from before this work are still there and are harmless:
`CTA: Click` (`cta_click`), `home_section_view`, and Plausible's built-in
`Form: Submission`, `File Download`, `Outbound Link: Click` and `404`. None are
funnel steps. Note `Outbound Link: Click` is Plausible's own http(s) tracking
and is **not** the same as `outbound_email_click`, which covers `mailto:`.

The Trust row of the dashboard is `case_study_read` + `pulse_article_read`
added together; Plausible has no combined goal, so read the two and sum them.

### ⚠ The Intent row is not a single goal

An earlier version of this file said the Intent row was
`cta_click where cta = pulse_check`. **It is not, and that goal undercounts by
roughly half.** The booking-bound CTAs do not share a `cta` value:

| `cta` value | Count | Where |
| --- | --- | --- |
| `pulse_check` | 9 | most of the site |
| `consultation` | 5 | including the case study CTA |
| `learn_more_pulse_check` | 1 | |
| `scroll_to_booking` | 1 | on `/consultation/` — a jump link, not an arrival |
| `choose_calendar` | 1 | on `/consultation/` — same |

Read Intent as a **dashboard filter** rather than a goal: `cta_click` where
`cta` is one of `pulse_check`, `consultation`, `learn_more_pulse_check`. The
last two rows are excluded on purpose — they are in-page navigation by someone
already on the consultation page, and counting them as intent would double-count
the same visitor's journey.

None of the five funnels depend on this, which is why it survived unnoticed:
funnel 4 filters on `location`, and the rest use pageviews and the read events.

The real fix is in the site rather than the dashboard — one `cta` value for "book
the call", so this becomes a single goal. Worth doing before the value spreads
further; it is five attribute edits, and there is no funnel history to protect
because the funnels do not use it.

`packages` is the offer/pricing section on the homepage
([`index.astro`](../site/src/pages/index.astro)); `pulse` is the editorial
strip, which is a content signal rather than an offer signal.

`contact_submitted` is filtered on `location`, not `intent` — every inline
`LeadForm` reports `intent: 'home_inline'` regardless of the page it sits on,
while `location` carries the form's `source` (`consultation_ask`, `home_mid`,
`home_final`, `condensed_panel`).

## Funnels (Settings → Funnels) — created 2026-08-15

**All five exist**, created before `/thanks/` was deployed so that the first
real booking is counted. Funnels are not retroactive: they count from the moment
they are saved and cannot be backfilled from data Plausible already holds.

All five have **"Allow other activity between funnel steps" ON** — Plausible's
name for sequential rather than strict order, and its default. Visitors wander,
and strict order would drop anyone who detours through a Pulse article on the
way. If you rebuild one of these, check that toggle.

### Sizing them to the volume

The quarterly targets in [`FUNNEL-MEASUREMENT.md`](FUNNEL-MEASUREMENT.md) §4 are
400 sessions, 45 CTA clicks and 12 bookings. A funnel is only as useful as its
last step is populated, and a 12-per-quarter final step supports about three or
four meaningful steps before every number is a single digit and every ratio is
an anecdote.

That is why the two content funnels below **end at intent rather than at the
booking**. Ending them at `pulse_check_booked` would be the natural symmetry and
would produce a column of zeroes for a year. The question those funnels actually
have to answer first is "does anyone who reads this go and look at the offer" —
which is a step with real numbers behind it.

### 1. Booking flow — the one to check monthly

1. `Visit /consultation/`
2. `booking_viewed`
3. `pulse_check_booked`

Short on purpose, so the numbers are real. This is the only funnel that isolates
the two things most worth knowing month to month: whether the page sells the
call (step 1 → 2), and whether the scheduler closes it (step 2 → 3).

Step 2 → 3 is the new one, and it is the only place a scheduler problem can
surface at all — no times on offer, too many questions, a slow embed, a booking
form that asks for something people won't give. Before Koalendar there was no
way to see it, because the funnel ended at step 2.

### 2. The spine — quarterly

1. `Home`
2. `Section: packages`
3. `Visit /consultation/`
4. `Section: consultation readout`
5. `booking_viewed`
6. `pulse_check_booked`

Six steps is too long to read monthly and about right to read once a quarter,
when you are choosing the ONE stage to work on. Its job is to locate the drop,
not to measure it precisely.

Step 4 is the sample readout — the facsimile of the one-page deliverable that
sits between the offer and the calendar. It is the only mid-page step worth
measuring, because it is the one section whose job is to convert: if visitors
reach it and still don't reach the calendar, the readout is the thing to
rewrite. If they never reach it, the page above it is too long.

Keep `booking_viewed` as its own step rather than collapsing it into the
booking. Reaching the calendar and completing a booking are different things,
and funnel 1 exists to read the gap between them.

### 3. Does editorial convert

1. `Visit /pulse/*`
2. `pulse_article_read`
3. `Visit /consultation/`

Step 2 is the point of the funnel: "arrived on an article" and "read an article"
convert at different rates, and without the middle step this cannot tell a Pulse
post that works from one that merely gets clicked.

### 4. Does proof convert

1. `Visit /work/*`
2. `case_study_read`
3. `CTA: case study`

The same shape as funnel 3, for the other half of the Trust row. Worth keeping
separate: editorial and proof are different arguments made to different people,
and averaging them tells you to write more of whichever is more popular rather
than whichever converts.

Its third step is a CTA click rather than a pageview because the case study CTA
is the specific thing under test — whether a story that lands makes people act
at the bottom of the page they are already on.

### 5. Note instead of booking — the branch

1. `Visit /consultation/`
2. `CTA: choose note`
3. `Contact: consultation ask`

Booking and "send a note" are alternatives, not sequential steps. Combining them
into one funnel would floor the last step near zero, which is why the branch is
its own funnel.

### When to promote funnels 3 and 4

Once either regularly shows a populated third step across a quarter, add
`pulse_check_booked` as a fourth. Create a **new** funnel rather than editing
the existing one — an edited funnel does not recompute its history, so you would
lose the comparison you spent a year earning.

## Notes on the booking step

The scheduler reports nothing to the host page; the conversion is counted on
[`/thanks/`](../site/src/pages/thanks.astro), which Koalendar redirects to. The
note above the `IntersectionObserver` in
[`consultation.astro`](../site/src/pages/consultation.astro) still stands: do
not invent a `booking_completed` on the consultation page, which cannot observe
one.

**Reading the placement breakdown.** Filter the funnel report on `cta_click`'s
`location`. It is deliberately **not** carried through the navigation as a
property on the booking event: the site may not store anything on the device
(see the rule in [`FUNNEL-MEASUREMENT.md`](FUNNEL-MEASUREMENT.md) §1), and
Plausible already stitches the session server-side.

**`/thanks/` is not a pageview goal.** Use the `pulse_check_booked` custom event
instead. The page is briefly loaded inside the booking iframe before it promotes
itself to the top window, so its pageview count can run ahead of the real number
of bookings; the custom event is suppressed in the framed copy and does not.

**There is no separate services funnel.** `service_line` is on every event, so
funnels 1 and 2 answer the per-line question under a dashboard filter instead —
one funnel filtered five ways beats five funnels each holding a fifth of the
data. Check that filtering the funnel report by a custom property is available
on your Plausible plan before relying on it; if it is not, the `/services/*`
pageview goal and the `cta_click (pulse_check)` goal still give you the two ends
by hand.

## Footnote: the condensed prototype

`booking_viewed` fires on both `/consultation/` and the noindex
`/consultation-condensed/` prototype. The condensed page sends
`variant: 'condensed'`; the main page sends no `variant` and shows as `(none)`.
Filter on that property if the prototype starts taking meaningful traffic.
