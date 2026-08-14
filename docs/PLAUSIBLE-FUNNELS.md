# Plausible conversion funnels

Configuration spec for the funnels on `allthingspanta.com`. All of it is
dashboard work — the site is already instrumented and needs no code changes to
support any of this.

Both funnels and custom properties are **Business plan** features.

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

Plausible's own `outboundLinks`, `fileDownloads` and `formSubmissions` are on
as well.

## Prerequisites

1. **Register the custom properties** under Settings → Properties: `cta`,
   `location`, `section`, `intent`, `variant`, `status`, `via`. They are
   collected today but are neither displayed nor filterable until they are
   registered — and property-filtered goals depend on them.
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

## Goals to create (Settings → Goals)

| Goal | Type |
| --- | --- |
| `/` | Pageview |
| `/consultation/` | Pageview |
| `/pulse/*` | Pageview |
| `home_section_view` where `section` = `packages` | Custom event, property-filtered |
| `home_section_view` where `section` = `consultation_readout` | Custom event, property-filtered |
| `booking_viewed` | Custom event |
| `cta_click` where `cta` = `choose_note` | Custom event, property-filtered |
| `contact_submitted` where `location` = `consultation_ask` | Custom event, property-filtered |

`packages` is the offer/pricing section on the homepage
([`index.astro`](../site/src/pages/index.astro)); `pulse` is the editorial
strip, which is a content signal rather than an offer signal.

`contact_submitted` is filtered on `location`, not `intent` — every inline
`LeadForm` reports `intent: 'home_inline'` regardless of the page it sits on,
while `location` carries the form's `source` (`consultation_ask`, `home_mid`,
`home_final`, `condensed_panel`).

## Funnels (Settings → Funnels)

All three use **sequential** order, not strict order: visitors wander, and
strict order would drop anyone who detours through a Pulse article on the way.

### 1. Homepage → calendar (the primary path)

1. `/`
2. `home_section_view (packages)`
3. `/consultation/`
4. `home_section_view (consultation_readout)`
5. `booking_viewed`

Step 4 is the sample readout — the facsimile of the one-page deliverable that
sits between the offer and the calendar. It is the only mid-page step worth
measuring, because it is the one section whose job is to convert: if visitors
reach it and still don't reach the calendar, the readout is the thing to
rewrite. If they never reach it, the page above it is too long.

### 2. Consultation → note instead (the branch)

1. `/consultation/`
2. `cta_click (choose_note)`
3. `contact_submitted (consultation_ask)`

### 3. Pulse content → calendar (does editorial convert)

1. `/pulse/*`
2. `/consultation/`
3. `booking_viewed`

Booking and "send a note" are alternatives, not sequential steps. Combining
them into one funnel would floor the last step near zero, which is why the
branch is its own funnel.

## Known limitation: bookings are not observable

Every funnel bottoms out at `booking_viewed` — the calendar coming into view —
not at a completed booking. The scheduler is a cross-origin Google Calendar
appointment embed that reports nothing back to the host page; see the note at
[`consultation.astro`](../site/src/pages/consultation.astro) above the
`IntersectionObserver`, which also warns against inventing a
`booking_completed` event the page cannot actually observe.

Actual bookings must be reconciled from Google Calendar by hand. Swapping the
scheduler for one that posts a completion message to the host page (Cal.com,
SavvyCal) is what would let a real `booking_completed` close the funnel.

## Footnote: the condensed prototype

`booking_viewed` fires on both `/consultation/` and the noindex
`/consultation-condensed/` prototype. The condensed page sends
`variant: 'condensed'`; the main page sends no `variant` and shows as `(none)`.
Filter on that property if the prototype starts taking meaningful traffic.
