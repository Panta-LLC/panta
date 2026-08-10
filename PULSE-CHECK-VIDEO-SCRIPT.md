# Script 8 — "Three Questions" (The Pulse Check)

Drafted Aug 10, 2026. Written to slot into `UPDATED_VIDEO_SCRIPTS.md` as the funnel-set closer. **It replaces Scripts 5 and 6, which are unshootable as written** — see *What this retires* at the bottom.

**Runtime:** ~75 seconds | **Placement:** `/consultation/` (the Pulse Check page), 16:9, below the hero and above the "What you walk away with" section; also email embed and retargeting
**Owns:** "leaks," the Find/Trust/Choose framework, the one-page readout
**Slot:** `<ScriptVideo name="pulse-check" location="consultation" label="…" aspect="16 / 9" />` — needs `site/public/video/pulse-check.mp4` + `pulse-check-poster.jpg` on disk before it renders

---

### HOOK — 0:00–0:12

**[Direct to camera, tight shot]**

> Most organizations don't have a website problem.

**(beat)**

> They have a "we don't know where we're losing people" problem. And that one you never see happen. Someone looks you up, doesn't get what they needed, and moves on. You don't get an email telling you they left.

*OST: "The leaks are invisible. The lost business isn't."*
*B-roll: search result → social profile → website → drop-off, one continuous journey*

### THE THREE QUESTIONS — 0:12–0:32

> There are really only three questions that decide whether a digital presence works.

> Can people **find** you? **(beat)** When they find you, can they **trust** you? **(beat)** And once they trust you — is it easy to **choose** you?

> Find. Trust. Choose. Miss any one of the three, and the other two stop mattering.

*OST: "FIND" / "TRUST" / "CHOOSE" one at a time on the question beats, then all three together on the recap*
*Delivery note: a full beat of silence after each question. The pauses are what make it a framework instead of a list.*

### THE OFFER — 0:32–0:52

> That's what the Pulse Check is. Thirty minutes, free, and we walk through all three for your organization.

> Your website — the one place that's actually yours. The channels where people already look for you. And whether there's any reason for someone to come back.

> We're not grading you, and we're not handing you a list of everything that's wrong. We're looking for the single biggest opportunity.

*OST: "Website · Channels · Reason to return"*
*OST: "The single biggest opportunity — not a list of everything."*
*B-roll: two people at a laptop, screen-share view of a real site being walked through*

### WHAT YOU WALK AWAY WITH — 0:52–1:08

> Within forty-eight hours you get one page in writing. Three observations, one recommendation. Yours to keep, whether or not we ever work together.

> And we'll tell you straight whether this is something you can handle yourself or worth bringing someone in. **(beat)** If you want the full picture after that, the Digital Presence Plan is where that conversation goes next — but the review stands on its own.

*OST: "One page. Three observations. One recommendation."*
*B-roll: the one-page readout on a desk, close enough to read the structure, not the client's details*
*Delivery note: "whether or not we ever work together" is the trust line of the whole script — slow down, hold eye contact.*

### CTA — 1:08–1:18

> Come exactly as you are. A live site, an idea on a napkin, anything in between. Nothing to prepare.

> Book a free thirty-minute review at panta dot L-L-C.

*OST: panta.llc — Book a free 30-minute review*
*End card: ripple mark, cream background, bamboo accent*

---

## 15-second cutdown — "Three Questions"

For paid placements and bio links. Cuts to the framework and the CTA; drops the hook and the readout.

> Can people find you? **(beat)** Can they trust you? **(beat)** Is it easy to choose you? **(beat)** Find. Trust. Choose. That's the whole game — and it's thirty free minutes to know where you stand. panta dot L-L-C.

*OST: FIND / TRUST / CHOOSE, then "Book a free 30-minute review"*

---

## Copy fidelity — checked against what the page actually says

Every claim in the script matches the live `consultationPage` document in Sanity. Don't ad-lib past these on set:

| Spoken line | Page copy it matches |
|---|---|
| "Thirty minutes, free" | `heroLabel` — "The Pulse Check · free 30-minute review" |
| "website / channels / reason to come back" | `panelNodes` — Website, Social, Content |
| "single biggest opportunity, not a list" | `panelFootText` — "the single biggest opportunity — not a list of everything" |
| "one page, three observations, one recommendation, within 48 hours" | `deliverIntro` — verbatim structure |
| "handle yourself or bring someone in" | `deliverCards[2]` — "An honest call" |
| "Come exactly as you are… nothing to prepare" | `bookingBody` |
| "the Plan is where it goes next" | `deliverIntro` — "this conversation is exactly where the Digital Presence Plan starts" |

**Two rules this script is built to obey:**

1. **Buttons describe, copy brands.** The brand name is spoken once, in the setup ("That's what the Pulse Check is"). The CTA — spoken *and* on the end card — is "Book a free 30-minute review." Never cut an end card that reads "Book a Pulse Check"; `check:launch` fails the site for that phrasing and the video shouldn't teach the audience a name the buttons don't use.
2. **The free call doesn't promise the paid deliverable.** The script offers a walkthrough plus a one-page readout — three observations and one recommendation. It never says assessment, audit, score, or roadmap. Those are the Digital Presence Plan's, and giving them away in the video re-opens the exact gap the site copy closed.

**No numbers, on purpose.** No conversion lifts, no client counts, no "we've found X leaks in Y organizations." There aren't real numbers to cite yet — the case studies carry none — and an invented one is the fastest way to read as hollow. When Delta Bay Impact or Arielle Rae Hastings gives you a before/after figure, the natural home for it is a new OST card under "The leaks are invisible," not a spoken line.

---

## What this retires

- **Script 5, "Where Are You Leaking Business?"** — dead on two counts: it sells a "Web Presence Assessment" / "Growth Audit," names that no longer exist, and it describes the first engagement as assess → priorities → roadmap, which is the paid Plan's deliverable set attached to a free call. Its hook and the "leaks" metaphor survive here; the offer section does not.
- **Script 6, "Find. Trust. Choose."** — same free-for-paid problem in one sentence: "we find the leaks" in the free consultation. The framework survives here intact, with the deliverable corrected.

Retiring both also settles the production note at the bottom of `UPDATED_VIDEO_SCRIPTS.md`: there is now one offer name and one destination across the whole set.

**Shared-language map delta:** "Leaks" and "Find. Trust. Choose." transfer to Script 8. Safe autoplay pairs become 4→8 and 8→7; avoid 8→1 (both open on a problem statement).
