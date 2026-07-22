# Digital Presence Audit — Service Definition
**Status:** Working draft v0.1 · **Last updated:** July 16, 2026

---

## 1. Overview & Positioning

The Digital Presence Audit is the entry-point offer: a fixed-scope, fixed-price diagnostic that maps how an organization shows up online, where trust breaks down, and where money (or funding) is leaking.

**The core premise:** Customers, clients, donors, and funders all follow the same arc — they need to **find** you, **trust** you, and **choose** you. This service audits every step of that arc.

**The promise:** In 10 business days, you'll know exactly where your digital presence is working, where it's broken, and what to fix first — with a prioritized 90-day roadmap that separates what you can do yourself from what's worth hiring out.

**Differentiator:** Strategy + engineering under one roof. The audit is powered by custom-built scanning tools, and roadmap items that call for custom tooling can actually be built by the same team.

---

## 2. Who It's For

Small businesses and community organizations. Three segment variants — same audit spine, swappable channel emphasis:

### 2a. Nonprofits & Community Organizations
- **Extra channels:** Candid/GuideStar, Charity Navigator, volunteer platforms (VolunteerMatch), grantmaker-facing surfaces
- **Trust signals:** Impact numbers, financial transparency, board/leadership info, annual reports
- **Multiple funnels:** Donors, volunteers, program participants, grantmakers — each conversion path audited separately
- **Unique lever:** Google Ad Grant ($10k/mo free search ads) — eligibility & configuration check included
- **Conversion =** donation, volunteer signup, program enrollment, grant credibility

### 2b. Professional Services (Therapists, Consultants, Attorneys, etc.)
- **Extra channels:** Industry directories (Psychology Today, TherapyDen, Healthgrades, Avvo, etc.), insurance panel listings
- **Emphasis:** Local SEO + Google Business Profile carry the most weight; directories often out-traffic the website
- **Compliance nuance:** Review strategy is constrained for licensed clinicians (ethics codes prohibit soliciting testimonials; responding to reviews risks confidentiality). Audit flags this instead of applying generic review advice.
- **Conversion =** consult booking; contact-to-booking friction and response speed are the critical path

### 2c. E-Commerce
- **Extra channels:** Google Merchant Center / Shopping, marketplaces (Amazon, Etsy), Instagram Shop, TikTok Shop
- **Emphasis:** Site speed is directly revenue-linked; product reviews (not just business reviews); retention channels (email/SMS) are primary, not secondary
- **Conversion =** purchase; cart/checkout friction and abandonment recovery included in scope

---

## 3. What's Included — The Audit Framework

### 3a. Entry Point Map ("Where do your customers exist?")
Full inventory of digital entry points and how they connect:

- Google Search / Google Business Profile
- Website
- Social media
- YouTube (where applicable)
- Industry directories
- Review sites
- Email

**Checks:** Where are the gaps? Where are the inconsistencies? Weak spots? Do all entry points lead to each other? (Cross-link map produced as a deliverable.)

### 3b. Channel-by-Channel Review

**Google Business Profile**
- Complete & accurate? Categories, hours, photos, attributes
- Posts — active or dormant?
- Clear CTA configured?

**Review Sites**
- Presence claimed on relevant platforms
- Response practice — do you respond? (segment-appropriate)
- Generation system — is there a process for *asking*? (with professional-services carve-out)

**Website**
- Does the headline describe the business? (clarity test)
- Speed — Core Web Vitals via PageSpeed
- SEO ranking & keyword footprint
- Schema / structured data validation
- Accessibility scan (WAVE)
- Mobile experience

**Social Media**
- Right platforms for the audience?
- Profile completeness & link-back to hub
- Content freshness / last-post check

### 3c. Consistency & Trust Layer
- **NAP consistency** — name, address, phone identical across all directories & profiles
- **Presentation consistency** — is the brand recognizable across channels? Is each presentation optimized for how people actually use that platform?
- **Freshness signals** — last GBP post, last social post, site copyright year, stale content

### 3d. Conversion Path Walkthrough
What happens *after* someone finds you:

- Is there a clear CTA on every channel?
- Form fill / call / DM → how fast is the response?
- Booking or purchase flow — friction points, dead ends
- Walked through as a real customer/donor would experience it (screen-recorded)

### 3e. Measurement Baseline
- GA4 installed & configured correctly?
- Google Search Console verified?
- Conversion events defined?
- Baseline metrics captured (traffic, rankings, review count/rating) — this is what future improvement gets measured against

### 3f. Competitive Context
- 2–3 comparable organizations
- What they're doing differently across the same channel map
- Gaps that represent opportunity

---

## 4. Deliverables

1. **Presence Scorecard** — graded across four categories: **Visibility · Trust/Brand · Conversion · Systems**
2. **Entry Point Map** — visual diagram of channels, connections, and gaps (the hub-and-spoke)
3. **Top 3 Money Leaks** — plain-language summary of the biggest problems
4. **90-Day Prioritized Roadmap** — every item tagged either **[DIY]** (you can do this yourself, here's how) or **[Project]** (worth hiring out)
5. **Baseline Metrics Snapshot** — the "before" picture
6. **Findings Presentation** — 60-minute live walkthrough (this is where projects are scoped)

> **Note on the DIY/Project split:** roughly a third of the roadmap should be genuinely free advice. That honesty is the conversion mechanism — it makes the paid recommendations credible.

---

## 5. Process & Timeline (10 business days)

| Day | Step |
|-----|------|
| 0 | Intake questionnaire sent (access to GA4/GSC/GBP requested here) |
| 1–2 | 45-min discovery call |
| 3–7 | Analysis: automated scans + manual review + conversion walkthrough |
| 8–9 | Report assembly |
| 10 | 60-min findings presentation + written report delivered |

---

## 6. Pricing

| Offer | Price |
|-------|-------|
| Digital Presence Audit | **$950** |
| Founding-client rate (first 3) | $750 |
| Nonprofit rate | 15% off published pricing |

**Downstream offers** (scoped from the roadmap): Brand Foundation $3.5–5.5k · Web Presence Build $5–9k · Custom Tool Build $4–12k · Growth Retainer $850–1,800/mo.

---

## 7. Tooling

### 7a. Off-the-shelf stack (run the service, <$100/mo)
- **PageSpeed Insights** (free, API) — speed & Core Web Vitals
- **Google Search Console + GA4** (free, client access via intake)
- **Rich Results Test** (free) — schema validation
- **WAVE** (free) — accessibility
- **Screaming Frog** (free ≤500 URLs) — technical crawl
- **SE Ranking or Ubersuggest** (~$40/mo) — keyword/SEO data
- **BrightLocal** (~$39/mo) — citations/NAP, review monitoring, white-label reports

### 7b. Custom tool roadmap (build order)
1. **Presence Scanner** — input: business name + URL → PageSpeed API + Places API + NAP check + schema validation + screenshots → pre-populated scorecard. *Cuts audit labor from ~5 hrs to ~1.5 hrs; doubles as a live sales demo.*
2. **Cross-Link Checker** — crawls each property, verifies entry points link to each other, outputs the gap map
3. **Report Generator** — scorecard JSON in → branded client-ready PDF out
4. **Review Watchtower** — monitors new reviews across platforms, alerts client. *Retainer fuel.*

---

## 8. Open Questions / To Decide
- [ ] Name for the audit product (working: "Digital Presence Audit" — consider tying to brand name once chosen)
- [ ] Does e-commerce get a higher price tier? (Deeper scope: checkout flow, product feeds, email)
- [ ] Intake questionnaire — draft it
- [ ] Scorecard grading rubric — define what earns each grade per category
- [ ] Sample report — build one before first sale
