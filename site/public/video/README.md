# Script videos

Video slots switch themselves on when the files below exist at build time —
there is no flag to flip and no Sanity field to set. `src/lib/video.js` checks
for them with `existsSync`, and `src/components/ScriptVideo.astro` renders
nothing until both the video and its poster are present.

Nothing breaks by leaving this directory empty; pages render exactly as they do
today. The homepage keeps its testimonial card alone.

Scripts, placements, and the two pre-shoot blockers: `UPDATED_VIDEO_SCRIPTS.md`
and `content-architecture.md` at the repo root.

## Naming

Each slot takes a basename and expects three files:

| File | Required | Notes |
|---|---|---|
| `<name>.mp4` | yes | H.264 / AAC. Both this and the poster must exist or the slot stays off. |
| `<name>-poster.jpg` | yes | First frame. The only weight the video adds until someone presses play. |
| `<name>.en.vtt` | no | WebVTT captions. Added as a `<track default>` if present. |

| Basename | Script | Page |
|---|---|---|
| `panta-intro` | 7 — Our Mission Is Simple | `/` (slot built) |
| *(to assign)* | 1, 2, 3 | `/about/` |
| *(to assign)* | 3, 4 | `/web-strategy/` |
| *(to assign)* | 5 | `/web-strategy/digital-presence-plan/` |
| *(to assign)* | 6 | `/consultation/` |

## Encoding

- **The homepage hero is square (1:1);** every other placement is full-width and
  takes 16:9. The hero's right-hand column is roughly square at desktop, so a
  16:9 master would letterboard into a thin strip there. Shoot wider than you
  need and export a square crop for the hero specifically. `ScriptVideo` takes
  an `aspect` prop, defaulting to `1 / 1`.
- **Target under ~5 MB.** This is the first viewport of the most-visited page.
  `preload="none"` means the video itself isn't fetched until someone presses
  play, but keep it small anyway for the people who do.
- **Burn the captions in** as well as shipping the `.vtt`. Silent playback is
  the default state, and burned-in captions survive reposting to platforms that
  ignore caption tracks.
- **Poster:** export at 2x the rendered size (roughly 720x720), compress hard.
  A poster that loads slowly is worse than no video.

## What the slot does

- Native `controls`, `preload="none"`, click-to-play. No JS required to play it.
- **No autoplay and no loop**, on purpose. Motion beside a call-to-action
  competes with it — the mistake the old hero slideshow made.
- The testimonial stays, demoted to a caption beneath the video. The video
  introduces the person; the quote is third-party evidence. Different jobs.
- A `video_play` GA4 event fires once on first play, carrying the slot's
  `location` (`home_hero` for the hero). Register it alongside the other custom
  events if you want it in reports.
- **`UPDATED_VIDEO_SCRIPTS.md` lists Script 7's placement as a "site hero loop."**
  The slot is click-to-play on purpose — see the second bullet. Looping suits
  paid placements and bio links, not a hero beside a CTA.
