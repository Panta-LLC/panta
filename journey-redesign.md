# allthingspanta.com — Journey Redesign Proposal

Builds on the audit in `panta-customer-journey-audit.md`. This is a content-and-UX redesign, not a visual one: the existing look, tone, and page inventory mostly stay. What changes is how visitors are sorted, what they see before they commit, and where each persona exits.

---

## 1. Design principles

Four rules that resolve most of the audit findings at once.

1. **Three doors, not one.** Keep the Pulse Check as the primary door, but give every page a second door for the ready buyer (quote) and a third for the not-yet visitor (newsletter/Pulse). Every service page ends with all three.
2. **Proof travels with the service.** A case study, a testimonial, or a sample deliverable appears on the page where the decision is made — never one click away on a general Work index.
3. **A number on every offer.** Range on services, floor on the plan. Price uncertainty is the main reason P2 (nonprofit director) can't proceed without a call, and the call is exactly what they're trying to avoid before they have board cover.
4. **The review page must see every persona.** The Pulse Check is currently a *website* review. It becomes a *presence-and-operations* review, or the ops and brand pages get their own version.

---

## 2. Revised funnel

```
                         ┌─────────────── Not yet ──────────────► Pulse newsletter ──► (re-enter later)
                         │
Entry page ──► Service page ──┼─────────────── Ready to talk ─────► Pulse Check ──► Readout ──► DPP or scoped project
   (with proof + price)  │
                         └─────────────── Have a brief ──────────► Quote request ──► Written quote in 2 business days
                                                                       │
                                                                       └── (Panta may recommend a Pulse Check first,
                                                                            but the visitor asked for a quote and gets one)
```

Change from today: the middle path is unchanged; the top and bottom paths currently either don't exist (top) or loop back into the middle (bottom).

---

## 3. Site structure changes

### Navigation

Current mega-menu has three groups: *What we do*, *What we're building*, *Start here*. Keep them, with two adjustments.

- **Add "Custom software / small tools"** as a fifth service or as a visible sub-item under Operations. Today it's a dead homepage card.
- **Rename the nav CTA** from "Get a free review" to **"Start here"** on the button itself, opening a small three-option chooser (see §5.1). The button currently commits everyone to the review before they know if it fits. On mobile, the chooser can be a simple three-link sheet.

### Pages

| Page | Action |
|---|---|
| `/quote/` | **New.** Quote-request page for P4. Replaces the false `/contact/?quote=1` door. |
| `/process/` | **New (or anchor).** Home for the three-step "Pulse Check → Plan → Build" content that currently only lives on the homepage. Fixes both broken "see how it works" links. |
| `/services/operations/` | Absorbs Custom Software as a named section with its own anchor and a mini-case. |
| `/contact/` | Becomes a real contact page (email, note, "which of these are you?" links). Stops selling the review. |
| `/digital-presence-plan/` | Adds price floor and a sample deliverable. |
| `/consultation/` | Broadened framing, testimonial added, broken link fixed. |
| `/pulse/` | Either grow to ≥5 posts before linking from service pages, or reframe the storytelling CTA to the newsletter instead. |

Rename decision: **"Pulse" stays for the newsletter/blog; the consultation becomes "The Review."** "Get a free review" is already the CTA language everywhere, so the offer name and the CTA finally match, and the collision with "Pulse" goes away. (If "Pulse Check" has brand equity you want to keep, rename the newsletter instead — "Notes" or "Field notes.")

---

## 4. Service page template (applies to all four + custom software)

A single template so every service reads the same way and P1/P2 always know where the price and proof are.

```
┌─────────────────────────────────────────────────────────────┐
│ Breadcrumb · category tag                                   │
│ H1 — outcome headline (keep existing, they're good)         │
│ Sub — one paragraph                                         │
│ [Get a free review]  [Request a quote]  ← two buttons       │
│ "Most projects: $X–$Y · N weeks · fixed price in writing"   │  ← NEW: price + time strip
├─────────────────────────────────────────────────────────────┤
│ PROOF STRIP  ← NEW                                          │
│ One case study card for THIS service + one-line quote       │
│ e.g. Brand → Arielle Rae Hastings (brand development,       │
│      positioning); Ops → Delta Bay Impact (systems and      │
│      tool assessment); Story → DBI (content strategy)       │
├─────────────────────────────────────────────────────────────┤
│ WHO THIS IS FOR  ← NEW (3 short cards)                       │
│ Practitioner / Nonprofit / Local business — one sentence    │
│ each on what this service does for them specifically.       │
│ (Borrow the DPP page's persona section as the model.)       │
├─────────────────────────────────────────────────────────────┤
│ What this looks like (existing 6-card grid — keep)          │
├─────────────────────────────────────────────────────────────┤
│ How it starts (existing) — link goes to /process/ not       │
│ /services/                                                  │
├─────────────────────────────────────────────────────────────┤
│ FAQ (existing — keep; add a cost question to Brand, Ops,    │
│ Storytelling to match the Web page)                         │
├─────────────────────────────────────────────────────────────┤
│ THREE DOORS  ← replaces the two redundant review CTAs       │
│ [Book a free review]  [Send a brief for a quote]            │
│ "Not ready? Get Pulse every other week →" [email] [Go]      │
└─────────────────────────────────────────────────────────────┘
```

### Per-service specifics

**Web Design & Development** — Already closest to this template. Changes: fix the process link; add the "who this is for" cards; add a "Want just the site?" line near the top that names the quote path so P4 doesn't have to find it in the FAQ.

**Brand design** — Add the Arielle case to the proof strip with 2–3 images of the identity in use (site, signage, forms — the page's own words). Add price strip. Add FAQ: "What does a brand project cost?" Add a note that brand can be scoped alone; today the site implies it follows a website review.

**Operations & systems** — Add the DBI systems assessment as proof. Add a **"Small tools"** section (the former Custom Software card) with the three bullets it already has on the homepage, an anchor, and one sentence of example ("an intake form that writes to the spreadsheet you already use"). Price strip should show two numbers: mapping engagement range, and small-tool range.

**Storytelling & content** — Replace "Read Pulse" with the newsletter signup until Pulse has enough posts to be proof. Add DBI content strategy as proof, ideally with the DBI post ("Impactful Engagement with DBI Voice") embedded as the sample.

**Custom software / small tools** — Lives on the ops page for now. If it starts generating its own inquiries, promote to its own page using the same template.

---

## 5. Key page redesigns

### 5.1 Homepage

Current homepage does too much: five service cards, a "three ways we help" section that restates the services, a process, a reach-out form, a newsletter, a founder note, an FAQ, and a second full review form. Two forms for the same thing on one page.

Proposed order:

1. **Hero** — keep headline and sub. Replace the two buttons with the **three-door chooser**:

   > **Where are you?**
   > ○ Something isn't working and I'm not sure what → *Free 30-minute review*
   > ○ I know what I need built → *Request a quote*
   > ○ Just looking → *See client work*

   This sorts P3, P4, and P5 in the first screen.

2. **Proof** — the two case studies (keep), plus the Tiffany Francies testimonial pulled up from the Work page.

3. **Services** — five cards (Custom Software now linked). Fix the Web card copy to lead with "website." Each card gets its price range in small type. **Drop the "Three ways we help" section** — it restates the cards with different labels and adds a scroll.

4. **The Digital Presence Plan** — new card. It's the flagship and isn't on the homepage today. One paragraph, the six deliverables as a compact list, "plans from $X," link.

5. **Process** — keep the three steps; this section becomes `/process/` or gets an `id="process"` that the other pages link to.

6. **Founder note** — keep, it's good.

7. **FAQ** — keep.

8. **One form, not two.** Keep the full review form at the bottom (name, email, URL, what brings you). Delete the mid-page "would you rather we reached out" form; replace it with a single link to the bottom form. Newsletter signup moves into the footer on every page.

### 5.2 The Review (consultation page)

The page is strong; the changes are framing and repair.

- **Fix the broken link.** "Not ready to book? See how the practice works" → `/process/`.
- **Broaden the "what we map together" grid** from 3 cards to 4: Website · Social · Content · **Operations** ("Where the hours go — intake, scheduling, records"). Or reframe the three questions as *Can they find you? Trust you? Choose you? — and can you keep up once they do?*
- **Add a third persona portrait**: *"The practitioner setting up."* You have the Arielle case for exactly this person and the page currently shows only the DIY owner and the nonprofit director.
- **Add the testimonial** directly above the calendar. It's about the review itself.
- **Fix the "probably not a fit" links** so "send us the brief" goes to `/quote/`, not `/contact/`.
- Consider a second sample readout for a nonprofit or an ops case so the sample isn't always a landscaping website.

### 5.3 Quote request page (new, `/quote/`)

For P4. Short. The promise is speed and a written number.

> **Tell us what you need built.**
> If you already know the scope, skip the call. Send the brief and you'll have a fixed-price quote in writing within two business days — or a short note saying what we'd need to know first.
>
> Form: Name · Email · Organization/URL · What do you need? (dropdown: Website · Brand · Small tool · Content · Not sure) · Describe it (textarea) · Budget range (optional, dropdown) · Attach brief (optional)
>
> Below: "Not sure of the scope yet? The free review is faster than guessing →"

Honesty note to include: "Sometimes we'll come back and suggest a review or a plan first — but we'll say why, and we'll still give you the number you asked for."

### 5.4 Digital Presence Plan

- **Price floor** in the hero: "Plans from $X · 10 business days · free re-score at 90 days."
- **Replace "Get a quote"** button with "Request a quote" → `/quote/` with the dropdown pre-set to "Plan." Or remove it and keep one CTA — but don't keep a button that leads to a generic contact form.
- **Sample deliverable** section mirroring the review page's sample readout: one redacted scorecard page (the 40 checks, four categories, a bottleneck headline) and three lines of a roadmap showing the DIY/Project tags. Fictional client is fine — the review page already does this.
- Keep the persona section; it's the model for the rest of the site.
- Remove or support e-commerce.

### 5.5 Contact

Strip it back to a contact page:

> **Say hello.** hello@panta.llc · we reply within one business day.
> Looking for something specific?
> → Free 30-minute review · → Request a quote · → Get Pulse in your inbox
> [short note form]

Delete "What happens next / we'll schedule your review / usually the DPP." That copy belongs on the review page, where it's already stated.

### 5.6 Work

- Add a **filter or tag row** (Web · Brand · Ops · Content) so the two cases can be read by service now and the page scales.
- Each case study page should end with a link to the *service* it demonstrates, not only to the review.

---

## 6. Copy fixes (small, high leverage)

| Where | Now | Proposed |
|---|---|---|
| Homepage hero button | "Get a free website review" | "Get a free review" (drop *website*; it excludes brand/ops) |
| Homepage Web card | "Your online representation spans across many channels…" | "A fast, credible website you can maintain yourself — connected to the Google profile, directories, and social channels people actually find you through." |
| Web page | "See how it works →" (to /services/) | "See how a project runs →" (to /process/) |
| Consultation page | "See how the practice works →" (to /web-strategy/) | same label, to /process/ |
| DPP pricing | "Quoted to your situation." | "Plans from $X, quoted in writing after the free review. Everything included." |
| Contact page | "The fastest path is a Pulse Check…" | Delete; replace with the three-link chooser |
| Storytelling CTA | "Read Pulse" | "Get Pulse every other week" (newsletter) until the archive is deeper |
| Ops page | (Custom Software absent) | Add H2: "Small tools, when nothing off the shelf fits" |

---

## 7. Measurement

To know if the redesign worked, instrument the three doors separately. Minimum set:

- **Review path:** review page views → calendar loads → bookings; note form submissions.
- **Quote path:** `/quote/` views → submissions; time to first written quote; quote → project rate.
- **Nurture path:** newsletter signups by source page; re-entry rate (subscribers who later book or request a quote).
- **Per service:** service page → any-door click rate, before and after the proof strip and price strip land.

If the quote path generates fewer than a handful of requests a quarter, that's a real answer: P4 isn't your customer, and the page can be folded back into the review with a clear conscience. Better to learn that from data than from a dead button.

---

## 8. Suggested sequencing

**Sprint 1 (a day or two):** broken links → `/process/` anchor; Custom Software card linked; contact page simplified; testimonial on review + home; newsletter in footer sitewide; homepage duplicate form removed.

**Sprint 2 (a week):** service page template — price strip, proof strip, three doors — applied to Brand, Ops, Storytelling. Web card copy fixed on the homepage. Review page grid broadened and third persona added.

**Sprint 3 (a week, needs decisions):** `/quote/` page live; DPP price floor and sample deliverable; naming decision (Review vs Pulse Check); e-commerce decision; homepage chooser.

Everything in Sprint 1 is a pure fix with no strategy risk. Sprint 3 is where the decisions live, and the quote path is the one worth testing rather than assuming.
