# Funnel measurement plan

Track the path from first touch → booked Pulse Check → signed engagement, with
just enough instrumentation to make decisions at low traffic volume.

**Primary conversion (macro):** Pulse Check booked.

This is the plan of record. It started as a GA4 + Next.js spec and is written
here against what actually exists: an Astro site on **Plausible**, and the
`crm/` app for everything after the booking. Where the two differ, the
difference is stated rather than smoothed over — the original names are in the
mapping tables so the source document stays readable next to this one.

Companion docs:

- [`PLAUSIBLE-FUNNELS.md`](PLAUSIBLE-FUNNELS.md) — the dashboard configuration:
  which goals, properties and funnels to create in Plausible. All of §1 and §4
  below bottoms out there.
- [`utm-links.csv`](utm-links.csv) — the UTM builder sheet from §2.

---

## 1. Event taxonomy

Lowercase, snake_case, flat. Instrumented centrally in
[`Analytics.astro`](../site/src/components/Analytics.astro), which exposes
`window.pantaTrack(event, props)` plus a declarative `data-track` /
`data-track-*` click handler. The plan's implementation note — "wrap analytics
in a single `track()` utility, one CTA component with `cta_location` as a prop"
— was already how this site was built.

### Macro conversion

| Event | Fires when | Where | Status |
| --- | --- | --- | --- |
| `pulse_check_booked` | The booking confirmation page loads | [`thanks.astro`](../site/src/pages/thanks.astro) | ✅ Instrumented — needs the Koalendar settings in [§5](#5-tooling) |

The scheduler is **Koalendar**, which replaced a Google Calendar appointment
embed for one reason: the Google embed reported nothing back to the host page
and could not redirect on completion, so a booking was not observable by any
means and the whole funnel bottomed out at "the calendar scrolled into view".
Koalendar has a *Redirect invitee after booking (URL)* setting. Point it at
`https://www.allthingspanta.com/thanks/` and the funnel closes.

`/thanks/` is `noindex`, `Disallow`ed in robots.txt, out of the sitemap, and
linked from nothing — every visit to it counts as a booking, so it must have no
other way to be reached.

**Two things about that page are load-bearing.**

*Koalendar redirects the frame that submitted the booking*, and on
`/consultation/` that frame is the embed. Left alone, the confirmation page
loads inside an 800px box in the middle of the page the visitor was already on,
site header and footer included, twice over. An inline script at the top of the
body promotes it to the top window before anything else runs, and suppresses the
conversion event in the doomed framed copy so the booking is counted once.

*Koalendar's optional "Pass event details to your redirected page" must stay
off.* It appends the invitee's name and email to the redirect URL, which would
put personal data into browser history, into the referrer, and into Plausible —
which is sent the full URL, not just the path. The same inline script discards
every parameter the page does not recognise, so the leak is closed even if the
setting is switched on by accident. Leave it off anyway: the booking details are
already in Koalendar, in the calendar invite, and in the CRM.

### Micro conversions

| Plan's name | What the site sends | Fires when |
| --- | --- | --- |
| `booking_cta_click` | `cta_click` with `cta` ∈ {`pulse_check`, `consultation`, `scroll_to_booking`} | Any booking CTA clicked — 65 elements sitewide |
| `booking_page_view` | `booking_viewed` | The calendar embed scrolls into view on `/consultation/` |
| `contact_form_submit` | `contact_submitted` | Contact form or any inline `LeadForm` succeeds |
| `case_study_read` | `case_study_read` | A case study is read — see the threshold note below |
| `case_study_to_cta` | `cta_click` where `location` = `case_study_cta` | The closing CTA on `/work/:slug/` |
| `pulse_article_read` | `pulse_article_read` | A Pulse article is read |
| `newsletter_signup` | `newsletter_subscribe` | `NewsletterForm` succeeds |
| `service_page_view` | *(pageview goal on `/services/*`)* | Page load |
| `outbound_email_click` | `outbound_email_click` | Any `mailto:` link clicked |

**Four of these were renamed, and the renaming goes the other way.** The site's
existing names are the incumbents — they have months of history behind them and
sixty-five call sites. Plausible cannot merge two names after the fact, so
renaming `cta_click` to `booking_cta_click` would orphan everything collected to
date and buy nothing: the plan's distinction between "a CTA click" and "a
booking CTA click" is a property filter (`cta = pulse_check`), which is exactly
what the property is for. Same reasoning for the other three.

The two genuinely new events use the plan's names, because there was no
incumbent to protect.

`case_study_to_cta` is not a separate event and should not become one. It is
`cta_click` filtered to `location = case_study_cta` — one CTA on one template.
An event that duplicates a filtered view of another event is an event that will
disagree with it.

Plausible's own `outboundLinks`, `fileDownloads` and `formSubmissions` are on
too. `outboundLinks` covers `http(s)` links to another host and **not**
`mailto:`, which is why `outbound_email_click` is instrumented by hand.

#### The read thresholds

`case_study_read` and `pulse_article_read` come from
[`ReadDepth.astro`](../site/src/components/ReadDepth.astro). Two departures from
the plan's plain "scrolled ≥75%", both of which make the number mean what it
says:

1. **75% of the article, not of the page.** The component measures from the top
   of the article to wherever it is placed in the markup, and it is placed
   immediately after the prose — before the bridge CTA, the newsletter card and
   the keep-reading rail. Measured against the whole document, the 75% line on a
   short post lands somewhere inside the newsletter card, and "read" would mean
   "scrolled past the end of".
2. **A 20-second dwell as well.** Any article shorter than the viewport has its
   75% line above the fold at load. Without the dwell, the Trust row of the
   dashboard would be a second pageview count and the read → booking ratio would
   be noise.

### Parameters on every event

| Parameter | Set by | Notes |
| --- | --- | --- |
| `source_page` | `Analytics.astro`, automatically | `location.pathname` at send time |
| `service_line` | `Analytics.astro`, from `<html data-service-line>` | Declared once per page via Base's `serviceLine` prop |
| `location` | Per call site, `data-track-location` | The plan's `cta_location` — header, hero, footer, `case_study_cta`, `pulse_article_bridge`, … |

Both globals are attached centrally rather than at the call sites. A parameter
that has to be remembered by hand is one that will be missing from the events
that matter most, and there are sixty-five places to forget it.

`service_line` carries the **service slug**, so it joins against the
`/services/:slug/` pageview report and against `serviceInterest` in the CRM.
Package pages report their parent service's slug, not their own — a package page
and its service page are two doors into one line, and separate values would
halve both numbers. Two values do not join to a service page: `(none)` for pages
that sell nothing in particular (home, about, Pulse, privacy) and
`digital-presence-plan`, which is a paid offer at the top level rather than one
of the services.

`cta_location` is the cheap version of A/B testing at this volume. After two or
three months it says which placements actually drive bookings — but only once
`pulse_check_booked` is live, because until then the chain ends at the click.

### One rule, stated once

**Nothing on the site may write a cookie, `localStorage`, or `sessionStorage`.**
[`/privacy/`](../site/src/pages/privacy.astro) tells visitors that this site
"sets no cookies, stores nothing on your device," and that this is why there is
no cookie banner. That promise is load-bearing for a business that sells being
trustworthy online, and it is worth more than any single datapoint.

The rule has already bitten once. Carrying the booking CTA's location across the
navigation to `/thanks/` wants a stashed object, and cannot have one — so
booking attribution is read out of **Plausible's funnel report** instead, where
the same visitor's earlier `cta_click` is already on record and the stitching
happens server-side. That is the better answer anyway: no state, no code, and it
survives the scheduler swap.

---

## 2. Offsite signals

Analytics stops at the edge of the site in the other direction too.

| Source | Metric | Where | Cadence |
| --- | --- | --- | --- |
| Google Business Profile | Calls, direction requests, website clicks, profile views | GBP dashboard | Monthly |
| Instagram / LinkedIn / Facebook / X | Profile visits, link clicks (UTM) | Native analytics | Monthly |
| Google Search Console | Impressions, clicks, average position for target keywords | GSC | Monthly |

### UTM convention

```
?utm_source={platform}&utm_medium=social&utm_campaign={content_series}
```

e.g. `?utm_source=instagram&utm_medium=social&utm_campaign=mission_trilogy`

Every social and GBP link gets one, built from
[`utm-links.csv`](utm-links.csv) and nowhere else. The sheet exists so the
naming never drifts: `utm_source=IG` and `utm_source=instagram` are two rows in
every report forever, and Plausible will not merge them later.

Two notes specific to this site:

- Link social posts and the GBP to **`/pulse-check/`**, which 301s to
  `/consultation/`. It is a URL that matches the name of the offer and records
  no pageview of its own — visitors arrive on `/consultation/`, which is the
  point. Do not create a goal for `/pulse-check/`.
- UTM parameters survive that redirect, so the attribution is not lost.

---

## 3. Sales-side tracking (post-booking)

Analytics tools stop at the booking. Everything past it is asked on the call and
typed into the CRM — **not** a spreadsheet. The plan allows either; the CRM wins
because the trigger question is already an instrument field, so a spreadsheet
would mean asking the same person the same question in two places and reconciling
them at quarter end.

One row per Pulse Check, on `pulse_checks`
([schema](../crm/src/lib/db/schema.ts)), edited from the funnel fieldset at the
bottom of the [capture sheet](../crm/src/pages/pulse/[id]/capture.astro):

| Plan's field | Column | Notes |
| --- | --- | --- |
| Date booked / date held | `bookedAt` / `endedAt` | `bookedAt` is when they booked; `scheduledAt` is when the call is. The gap is booking lead time |
| Source (asked directly) | `sourceVerbatim` + `sourceCategory` | Verbatim first, categorized after — never instead |
| Trigger (asked directly) | `triggerText` | Already an instrument field; it is question one of the capture sheet |
| Service interest | `serviceInterest` | The site's service slug, so it joins to `service_line` |
| Outcome | `salesOutcome` + `salesOutcomeAt` | `no_show` / `held_no_proposal` / `proposal_sent` / `closed_won` / `closed_lost` |
| Engagement value | `projects.priceCents` | Reached via `projects.originatingPulseCheckId` |

Engagement value is deliberately not a column on the pulse check. A closed
engagement is a project, and duplicating its price onto the call that produced
it gives two numbers that will disagree within a quarter.

**Two questions per booker, logged every time.** "How did you find me?" and
"What made you book?", both word for word. The verbatim column is the best
marketing input this business has — at this volume the sentence someone uses to
describe finding you is worth more than the count of which bucket it fell into,
and it is the only field here that can tell you something you did not already
have a category for. Both are read back in full on the funnel page.

**The outcomes are terminal states, and the boundary that matters is whether a
proposal went out.** A call that ended without one is `held_no_proposal` even if
it is plainly never happening; `closed_lost` means a proposal was sent and not
taken. Blur those two and the proposal → close ratio — the one that says whether
the pricing is wrong — stops meaning anything.

⚠ None of these may be aggregated into a per-client score, grade, tier or
health index, not even internally. See the note at the foot of the `pulse_checks`
table: `salesOutcome` is one short step from a "lead quality" field that ranks
organizations by how likely they are to pay. Aggregate across the quarter, never
per client.

---

## 4. Funnel dashboard

Five numbers, reviewed monthly, with **quarterly targets** — volume is too low
for a monthly target to be signal, and a number put in front of you monthly gets
reacted to monthly.

| Stage | Metric | Read from | Example Q target |
| --- | --- | --- | --- |
| Awareness | Qualified sessions (organic + social + GBP referral) | Plausible | 400 |
| Trust | `case_study_read` + `pulse_article_read` | Plausible | 120 |
| Intent | `cta_click` where `cta` is one of `pulse_check`, `consultation`, `learn_more_pulse_check` | Plausible — a **filter, not a goal**; see PLAUSIBLE-FUNNELS.md | 45 |
| **Conversion** | **`pulse_check_booked`** | **Plausible — reads zero until Koalendar Pro's redirect is on; count in Koalendar meanwhile** | **12** |
| Sales | Proposals sent / engagements closed | [`/funnel`](../crm/src/pages/funnel.astro) in the CRM | 5 / 3 |

The CRM's `/funnel` page owns the Sales row and the ratios below it, one quarter
at a time. It deliberately does **not** reproduce the four rows above: a second
place showing the same numbers is a second place for them to be stale, and
Plausible's version is the one with the breakdowns that make them actionable.

### Ratios to watch for drift

| Ratio | What a collapse means | Read from |
| --- | --- | --- |
| CTA click → booking | The booking flow is leaking | Plausible (both ends) |
| Calendar seen → booking | Koalendar itself is the leak — times, questions, or load | Plausible (`booking_viewed` → `pulse_check_booked`) |
| Booking → show | Wrong people, or the reminder is failing | CRM |
| Show → proposal | The Pulse Check readout is not landing | CRM |
| Proposal → close | Pricing or scoping fit | CRM |

Ratios computed over fewer than five rows are marked **thin** on the funnel page
rather than hidden — hiding one invites the assumption that it is fine. A
quarter where most bookings sit unresolved is flagged for the same reason.

**How to read it:** if bookings are short of target, look one row up. Whichever
stage's ratio collapsed is where the quarter's work goes. If every ratio holds
and volume is still low, the problem is top-of-funnel and the answer is more
content and outreach, not site tweaks.

---

## 5. Tooling

| Tool | Role | Status |
| --- | --- | --- |
| Plausible | Event tracking, goals, funnels | ✅ Live. Funnels and custom properties need the **Business plan** |
| Koalendar | Scheduler, and the redirect that closes the macro conversion | ✅ Instrumented — **the redirect needs Koalendar Pro** |
| Google Search Console | SEO signal for the keyword strategy | Monthly, by hand |
| Google Business Profile | Offsite signal | Monthly, by hand |
| `crm/` | Sales pipeline, `/funnel` page | ✅ Live |
| Microsoft Clarity | Session recordings, heatmaps | ❌ **Not installed, and it is a decision rather than an omission** |

### Koalendar setup

The site reads **one** URL, `scheduleUrl` in Sanity → Site Settings. The embed
URL is derived from it by appending `?embed=true`
([`booking.js`](../site/src/lib/booking.js)), so there is no second field to
keep in sync. The old `calEmbedUrl` field is retired and read-only in the
Studio.

In Koalendar, on the Pulse Check event:

1. **Share → copy the booking page link** (`https://koalendar.com/e/…`) and
   paste it into Sanity → Site Settings → *Booking page URL*. Paste it plain;
   the site adds `?embed=true` itself.
2. **After booking → "Redirect invitee after booking (URL)"** →
   `https://www.allthingspanta.com/thanks/` — **`www`, and with the trailing
   slash.** Optionally add `?loc=` or `?type=`; they are the only two
   parameters the page reads.

   The apex `allthingspanta.com` 308s to `www` and does carry the query string
   through, so the bare form works — it just spends a round trip doing it, at
   the one moment on the site where a page's whole job is to load and fire an
   event. The trailing slash matters for a different reason: Vercel serves
   `/thanks` and `/thanks/` both with a 200 rather than canonicalising, so
   Plausible records them as two pages. That does not affect the conversion,
   which is a custom event rather than a pageview goal, but there is no reason
   to split the pageviews either.
3. **Turn "Pass event details to your redirected page" OFF.** See §1.

**Reading the live settings without making a test booking:** the public event
config is served as JSON, which is the cheap way to check this is still right
after any change in Koalendar.

```bash
curl -s "https://api.koalendar.com/events/meet-with-panta?public" | python3 -m json.tool | grep -iE "redirect|invitee"
```

`redirectURL` should be the canonical URL above and `includeInviteeInRedirect`
should be `false`.

⚠ **The redirect is a Pro feature.** Koalendar Pro is roughly $10 per seat per
month, or about $85 a year billed annually — check the current number, it moved
between sources. Embedding works on the free plan; the redirect does not. Until
Pro is active, everything below `booking_viewed` reads zero and bookings are
counted in Koalendar by hand — the code needs no change either way.

### On Clarity, and on GA4

The source plan lists both. Neither fits this site as built, and both are worth
a deliberate decision rather than a quiet skip:

- **GA4** was removed from this site on purpose. It was replaced by Plausible
  precisely to drop the consent banner, and the `/privacy/` page now makes a
  public promise that depends on it staying gone.
- **Clarity** records sessions and sets cookies. Adding it means a consent
  banner returns, the privacy page has to be rewritten, and the recordings are
  consent-gated anyway — so the drop-off diagnosis it is wanted for would be
  based on the subset of visitors who accepted a banner that itself changes
  behaviour. The plan wants it for one job: watching where the booking path
  leaks. Plausible's funnel report answers the same question in aggregate, and
  once `pulse_check_booked` is live it answers it well.

  If qualitative drop-off diagnosis is still wanted after a quarter of real
  funnel data, revisit it then, with the privacy-page rewrite costed in.

---

## 6. Review ritual

- **Monthly, 30 minutes.** Update the dashboard numbers. Skim the booking path
  in Plausible's funnel report. Read the new "what made you book?" and "how did
  you find me?" answers on `/funnel`.
- **Quarterly, 90 minutes.** Set next quarter's targets. Pick the **one** stage
  to work on. Decide the content and outreach plan against it.

---

## Open items

1. **Finish the Koalendar setup** — the three steps in §5, and Pro for the
   redirect. The code is done; this is settings.
2. **Register the custom properties in Plausible** — including the new
   `source_page`, `service_line` and `address`. Properties are collected but
   neither displayed nor filterable until registered, and the goals in
   [`PLAUSIBLE-FUNNELS.md`](PLAUSIBLE-FUNNELS.md) depend on them.
3. **Create the funnels before the data is needed.** Plausible funnels are not
   retroactive; they count from the moment they are created.
4. **Run the CRM migration** — `0001` adds the sales-side columns.
5. **Set the first quarterly targets.** The numbers in §4 are the source
   document's examples, not yours. Replace them after one quarter of real data.
