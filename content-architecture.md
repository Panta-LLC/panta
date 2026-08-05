# Content Architecture — the seven scripts against the site
**Status:** v1 · **Last updated:** July 30, 2026
**Source:** `UPDATED_VIDEO_SCRIPTS.md` (v2, seven scripts) · supersedes `VIDEO_SCRIPTS.md`

---

## 1. Placement map

Every placement named in the scripts resolves to a page that already exists.
**No new pages are needed.** What's needed is a video slot on each, and copy on
three of them that matches what the script says out loud.

| # | Script | Run | Placement in script | Page | Slot | Aspect |
|---|---|---|---|---|---|---|
| 1 | Two Worlds | 90s | About page hero | `/about/` | to build | 16/9 |
| 2 | Why Panta Exists | 50s | About, paired with #1 | `/about/` | to build | 16/9 |
| 3 | What Partnership Means | 45s | About (third), services intro | `/about/`, `/web-strategy/` | to build | 16/9 |
| 4 | There's Never Been a Better Time | 60s | Services page | `/web-strategy/` | to build | 16/9 |
| 5 | Where Are You Leaking Business? | 75s | "Growth Audit landing page" | `/web-strategy/digital-presence-plan/` | to build | 16/9 |
| 6 | Find. Trust. Choose. | 45s | Consultation landing page | `/consultation/` | to build | 16/9 |
| 7 | Our Mission Is Simple | 30s | Site hero | `/` | **BUILT** | 1/1 |

Slots are added with `<ScriptVideo name="…" location="…" label="…" />`. A slot
renders nothing until `public/video/<name>.mp4` and `<name>-poster.jpg` exist,
so every page can carry its slot before the shoot without showing a broken
player. See `site/public/video/README.md`.

---

## 2. BLOCKING — the scripts name offers the site does not have

This must be resolved **before the shoot**, because it is spoken aloud in
Script 5 and cannot be fixed in the edit.

The site's own naming is clean and consistent across every page and every Sanity
document. There are exactly two names:

- **Free 30-minute consultation** — the entry point, at `/consultation/`
- **Digital Presence Plan** — the paid engagement, at `/web-strategy/digital-presence-plan/`

The scripts introduce three names that exist nowhere on the site:

| Script | Says | Site reality |
|---|---|---|
| 4 (placement) | "Growth Audit offer" | No such offer |
| 5 (placement) | "Growth Audit landing page" | No such page |
| 5 (OST + spoken CTA) | "Book your Web Presence Assessment" / "Schedule your assessment" | No such offer |

"Growth Audit" and "Web Presence Assessment" are both dead names — they belong
to the pre-consolidation era, when the Audit ($950) and Blueprint ($750) were
separate products. They were merged into the Digital Presence Plan.

**Recommended fix:** Script 5's spoken CTA becomes "Schedule your free
consultation at panta dot L-L-C" and its OST becomes *"panta.llc — Book your
free consultation"*. Placements are editorial notes, not spoken, so those just
need correcting in the document.

---

## 3. BLOCKING — Scripts 5 and 6 sell the same thing at two different prices

Deeper than naming, and easy to miss because the two scripts read fine alone.

**Script 5** describes the first engagement as: assess the entire system →
define priorities → walk away with a roadmap. That is precisely the Digital
Presence Plan's deliverable set — the paid engagement.

**Script 6** says the three questions "are exactly what we walk through in your
free consultation," and that in it "we find the leaks."

So the free 30-minute call is promised the paid engagement's outcome. A prospect
who watches #6, books the free call, and expects a leak map and a roadmap will
leave disappointed — and a prospect who watches #5 will not understand why they
are being quoted for something #6 said was free.

This is the same failure `SANITY-EDITS.md` §2 already corrected on the contact
page, where the copy promised the paid intake questionnaire off the free call.
The scripts reintroduce it.

**Recommended fix:** hold the line the site already holds.

- **Script 6 (free call):** the three questions are the *frame*. The call gives
  an honest read on where you stand and what a plan would need to cover. It does
  not produce the leak map.
- **Script 5 (paid plan):** name the Digital Presence Plan explicitly as the
  engagement that produces the assessment, priorities and roadmap.

`consultationPage.deliverIntro` already draws this line correctly — "a short
written summary — the honest read and what your plan needs to cover." Script 6
should match that sentence, not outrun it.

---

## 4. Non-blocking conflicts

**Script 7 placement says "site hero loop."** The hero slot is deliberately
click-to-play, not autoplay-loop: looping motion beside a call-to-action
competes with it, which is the mistake the old hero slideshow made. The looping
treatment is right for paid placements and bio links, wrong for the hero. Noted
in `ScriptVideo.astro`.

**`VIDEO_SCRIPTS.md` is superseded.** Its Script 4, "The Short Version," was
drafted for the hero slot; v2's Script 7 now owns that placement and is the one
to shoot. The old file is kept for the three original scripts' b-roll notes only.

**Script 4's "2026" hook needs an annual refresh**, already flagged in the source
document. Worth deciding now whether to shoot the evergreen "right now" cut in
the same session — it costs one extra take and saves a reshoot every January.

---

## 5. Script language the site should adopt

The scripts are the sharpest statement of Panta's positioning in the repo —
they were written to be said out loud, which is why they are tighter than the
page copy. Three lines are explicitly marked for reuse:

| Line | Owner | Where it belongs |
|---|---|---|
| "Researchers, engineers, designers, and creative thinkers" | Script 3 | `/about/` — the source document marks it "use in site copy too" |
| "Find. Trust. Choose." | Script 6 | `/consultation/` should lead with the framework. It currently exists only as `webStrategyPage.arcCards`, one level down. |
| "Serve better, build better, be better" | Script 2 | `/about/` mission section |

Also worth lifting: Script 7's "common problems in uncommon ways," and Script 2's
"we stay ahead of the pace of change, so you don't have to" — the clearest
one-line answer to *why hire Panta rather than a freelancer* anywhere in the
repo, and it appears nowhere on the site.

---

## 6. The evidence gap still applies

Six of the seven scripts make capability claims; none carries a number. The site
has one testimonial and two case studies with no metrics between them. This is
the same constraint documented against the hero copy — the scripts do not change
it, and shooting them will not either.

Getting before/after figures from Delta Bay Impact and Arielle Rae Hastings
remains the highest-leverage unblocking task, and it would improve the videos
too: Script 5's "in almost every organization we look at, there are leaks" is far
stronger as "in the last N organizations we assessed, we found an average of X."

---

## 7. Order of work

1. **Resolve §2 and §3** — naming, and the free-vs-paid line. Both change spoken
   lines, so both are pre-shoot.
2. Wire the six remaining slots (mechanical once §2/§3 settle the surrounding
   copy).
3. Lift the §5 language into `/about/` and `/consultation/`.
4. Shoot.
5. Gather §6 metrics — in parallel, not blocking.
