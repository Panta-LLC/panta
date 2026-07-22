# Presence Scorecard — Grading Rubric
**Status:** Working draft v0.1 · Companion to the Digital Presence Audit service definition

---

## How Scoring Works

Each of the four categories contains **10 checks worth 0–2 points each** (max 20 points per category):

- **2 = Solid** — present, correct, and working well
- **1 = Partial** — exists but incomplete, inconsistent, or underperforming
- **0 = Missing/Broken** — absent, wrong, or actively hurting

**Grade bands (per category):**

| Points | Grade | Client-facing label |
|--------|-------|--------------------|
| 18–20 | A | Strong — maintain & optimize |
| 14–17 | B | Good — a few gaps to close |
| 10–13 | C | Leaking — fixable problems costing you |
| 5–9 | D | Weak — significant work needed |
| 0–4 | F | Critical — effectively invisible or untrustworthy here |

**Overall score** = average of the four categories. But the headline of the report is never the overall grade — it's the *lowest* category, because that's the bottleneck.

Checks marked **[AUTO]** can be filled by the Presence Scanner; **[MANUAL]** require human review. Segment-variant checks are noted inline.

---

## Category 1: VISIBILITY — *Can they find you?*

| # | Check | 2 points | 1 point | 0 points |
|---|-------|----------|---------|----------|
| 1 | **Google Business Profile exists & claimed** [AUTO] | Claimed, verified | Exists, unclaimed/unverified | No profile |
| 2 | **GBP completeness** [AUTO] | All fields: categories, hours, photos (10+), attributes, services | Core fields only, few photos | Sparse or badly miscategorized |
| 3 | **Branded search result** [MANUAL] | Search for business name → you own the first page (site, GBP, socials) | You appear but share page 1 with confusables/competitors | Hard to find even by name |
| 4 | **Non-branded keyword footprint** [AUTO] | Ranking top 10 for 3+ relevant local/service terms | Ranking 11–30, or 1–2 terms | No meaningful rankings |
| 5 | **Directory presence** [AUTO] | Listed on all segment-relevant directories | Listed on some | Missing from the ones that matter |
| 6 | **Social presence on right platforms** [MANUAL] | Active on the 1–2 platforms the audience uses | Present but wrong platforms or barely used | Absent |
| 7 | **Local pack / Maps appearance** [MANUAL] | Appears in map pack for core service + area | Appears inconsistently or ranked low | Never appears |
| 8 | **Indexation health** [AUTO] | Key pages indexed, no coverage errors in GSC | Some pages missing/errors | Site poorly indexed or not verified in GSC |
| 9 | **Segment channel** [MANUAL] | *Nonprofit:* Candid/GuideStar profile current · *Prof. services:* key industry directories claimed & complete · *E-comm:* Merchant Center feed live & error-free | Partial | Missing |
| 10 | **Cross-channel discoverability** [AUTO] | All entry points link to each other (cross-link map complete) | Some links missing | Channels are islands |

---

## Category 2: TRUST / BRAND — *Do they believe you?*

| # | Check | 2 points | 1 point | 0 points |
|---|-------|----------|---------|----------|
| 1 | **NAP consistency** [AUTO] | Identical name/address/phone everywhere | Minor variants | Conflicting info live |
| 2 | **Review volume vs. local competitors** [AUTO] | At/above local median for category | Below median but present | Few or none |
| 3 | **Review rating** [AUTO] | 4.5+ | 3.8–4.4 | Below 3.8, or suspicious pattern |
| 4 | **Review recency** [AUTO] | New review within 30 days | Within 6 months | Most recent is 6+ months old |
| 5 | **Review response practice** [MANUAL] | Thoughtful responses to most reviews *(prof. services: compliant practice — no PHI, no confirmation of client status)* | Sporadic or template-only | None *(or non-compliant responses — auto-0 for clinicians)* |
| 6 | **Visual/brand consistency** [MANUAL] | Same logo, name, tone across all channels | Recognizable but drifting | Looks like different businesses |
| 7 | **Trust artifacts** [MANUAL] | *Business:* testimonials, credentials, guarantees · *Nonprofit:* impact numbers, financials, board page · *E-comm:* product reviews, return policy, secure checkout badges | Some present | None |
| 8 | **Freshness signals** [AUTO] | Recent GBP post, recent social post, current copyright year | One channel stale | Everything dormant |
| 9 | **About/story clarity** [MANUAL] | Clear who you are, who you serve, why you're credible | Generic or thin | Missing or confusing |
| 10 | **Professional polish** [MANUAL] | No broken images/links, no typos on key pages, HTTPS everywhere | Minor issues | Broken elements a visitor would notice |

---

## Category 3: CONVERSION — *Can they choose you?*

| # | Check | 2 points | 1 point | 0 points |
|---|-------|----------|---------|----------|
| 1 | **Headline clarity test** [MANUAL] | 5 seconds on homepage → you know what they do, for whom, and what to do next | Partially clear | Vague or clever-but-empty |
| 2 | **Primary CTA on website** [MANUAL] | One clear CTA, above fold, repeated down page | Present but buried or competing CTAs | No clear next step |
| 3 | **CTA on every channel** [AUTO] | GBP, socials, directories all have working action links | Some channels dead-end | Most channels dead-end |
| 4 | **Contact/booking friction** [MANUAL] | ≤3 steps from arrival to submitted inquiry/booking/purchase | 4–6 steps or awkward form | Broken, confusing, or phone-only with no hours |
| 5 | **Response speed** [MANUAL — mystery inquiry] | Reply within 4 business hours | Within 2 business days | Slower or never |
| 6 | **Mobile experience** [AUTO+MANUAL] | Fully usable, tap targets fine, no horizontal scroll | Usable with friction | Broken on mobile |
| 7 | **Page speed** [AUTO] | Core Web Vitals pass (LCP <2.5s) | Mid-range | Failing (LCP >4s) |
| 8 | **Conversion path per audience** [MANUAL] | Each key audience has an obvious path *(nonprofit: donor AND volunteer AND participant)* | Primary audience served, others orphaned | No audience has a clear path |
| 9 | **Segment-critical flow** [MANUAL] | *E-comm:* checkout ≤4 steps, guest checkout, abandonment email active · *Prof. services:* online scheduling or same-day response · *Nonprofit:* donation form ≤2 steps, recurring option | Works but with friction | Broken or missing |
| 10 | **Objection handling** [MANUAL] | Pricing/process/FAQ info available before contact | Partial | Visitor must inquire to learn anything |

---

## Category 4: SYSTEMS — *Can you see, sustain, and scale it?*

| # | Check | 2 points | 1 point | 0 points |
|---|-------|----------|---------|----------|
| 1 | **GA4 installed & configured** [AUTO] | Installed, events firing, conversions defined | Installed, default config only | Not installed |
| 2 | **Search Console verified** [AUTO] | Verified, no unaddressed issues | Verified, ignored | Not verified |
| 3 | **Conversion tracking** [MANUAL] | Form fills/calls/purchases tracked as conversions | Partial tracking | No idea where leads come from |
| 4 | **Review generation system** [MANUAL] | Systematic ask (post-service email/SMS/QR) *(prof. services: N/A for clinician testimonials — score on compliant alternatives: directory completeness, response process)* | Occasional manual asks | No system |
| 5 | **Email/SMS capability** [MANUAL] | List exists, tool in place, sent within last 90 days *(e-comm: welcome + abandonment flows active)* | List exists but dormant | No list |
| 6 | **Content cadence** [MANUAL] | Any sustainable rhythm (even monthly) maintained 3+ months | Sporadic bursts | None |
| 7 | **Ownership & access** [MANUAL] | Client owns/can access domain, GBP, analytics, socials | Some assets locked with ex-vendors/staff | Critical assets inaccessible |
| 8 | **Update capability** [MANUAL] | Client (or vendor on retainer) can update site within days | Updates possible but slow/costly | Site effectively frozen |
| 9 | **Baseline documented** [MANUAL] | Metrics snapshot exists (we create this — scores 2 post-audit by definition; scored on *prior* state) | Some historical data | Nothing measured before |
| 10 | **Segment system** [MANUAL] | *Nonprofit:* Google Ad Grant active & healthy · *Prof. services:* intake/scheduling system · *E-comm:* inventory synced to feeds, order emails branded | Exists, misconfigured | Missing |

---

## Reporting Notes

- **Headline the bottleneck:** lead the findings presentation with the lowest-scoring category, not the average.
- **Every 0 and 1 becomes a roadmap item**, tagged [DIY] or [Project]. This is the direct pipeline from rubric → roadmap → proposal.
- **The three biggest point-gaps with revenue impact** become the "Top 3 Money Leaks."
- **Re-score at 90 days** for retainer clients — the delta is the retention story.

## Build Note (Presence Scanner)

18 of 40 checks are [AUTO]-taggable. Scanner v1 should output a JSON matching this rubric's structure (`category → check → score → evidence`), so the Report Generator can render the scorecard directly.
