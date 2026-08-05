# Sanity edits to pair with the practice taxonomy change

Studio: https://panta-co.sanity.studio/ — project `tdi9ql1j`, dataset `pantaco`
Companion to `practice-taxonomy.md`. Separate from `SANITY-EDITS.md` (the
free-consultation naming fix), which is still outstanding and unaffected.

All page copy is fetched at **build time**, so none of these appear on the live
site until a rebuild + redeploy. Do all of them, then rebuild once.

> **These edits are deploy-blocking.** The code now labels the live practice
> **Web & Systems** in the nav, footer, page titles, and JSON-LD, while the
> Sanity copy still says "Web Strategy & Development" in the page heroes.
> Shipping the code without these edits puts two different practice names on the
> same page.

---

## 1. REQUIRED — the live practice renames

**This list is exhaustive.** Every field below was found by walking every
document in the dataset for the strings `Web Strategy & Development` and
`Community Program Development`. When all eleven are done, neither old name
exists anywhere in Sanity.

### Web Strategy page (`webStrategyPage`)

| Field | Currently | Change to |
|---|---|---|
| `heroLabel` | `Web Strategy & Development` | `Build · Web & Systems` |
| `heroLede` | `Panta's web practice for small businesses, nonprofits, and independent practices: a clear plan for how the world finds, trusts, and chooses you — then the websites, channels, and support to make it happen, all from the same hands.` | `Panta's client practice for small businesses, nonprofits, and independent practices: a clear plan for how the world finds, trusts, and chooses you — then the websites, channels, and systems to make it happen, all from the same hands.` |

Leave `heroTitle` ("Strategy, websites, and the growth that follows.") alone —
it still reads correctly and carries no practice name.

### Websites page (`websitesPage`)

| Field | Currently | Change to |
|---|---|---|
| `heroLabel` | `Websites · a Web Strategy & Development service` | `Websites · a Web & Systems service` |

### Mission page (`missionPage`) — the homepage

| Field | Currently | Change to |
|---|---|---|
| `practices[0].title` | `Web Strategy & Development` | `Web & Systems` |
| `practices[1].title` | `Community Program Development` | `Community Programs & Content` |

`practices[2]` (Product Development) is unchanged. **Note:** this whole list is
slated for removal from the hero in the pending hero rewrite — do these edits
anyway so the site is coherent in the meantime.

### About page (`aboutPage`)

| Field | Currently | Change to |
|---|---|---|
| `doItems[0].body` | `The Digital Presence Plan: a graded read on where you stand and a 90-day roadmap forward — the front door to Web Strategy & Development.` | `The Digital Presence Plan: a graded read on where you stand and a 90-day roadmap forward — the front door to Web & Systems.` |
| `doNote` | `That's our web practice. Two more are taking root: Community Program Development and Product Development.` | `That's our client practice. Two more are taking root: Community Programs & Content and Product Development.` |

The page also renders hardcoded links to both roadmap practices immediately
after `doNote`. Those labels were updated in code, so `doNote` must not repeat
them in a way that reads as a duplicate list.

### Home page doc (`homePage`, rendered at `/what-we-do/`)

| Field | Currently | Change to |
|---|---|---|
| `practiceTitle` | `Web Strategy & Development` | `Web & Systems` |
| `verbCards[0].linkLabel` | `Web Strategy & Development` | `Web & Systems` |
| `verbCards[1].linkLabel` | `Community Program Development` | `Community Programs & Content` |
| `comingCards[0].title` | `Community Program Development` | `Community Programs & Content` |

---

## 2. REQUIRED — the fourth service area

### Web Strategy page (`webStrategyPage`) → `services[]`

Insert a **new third item**, between `Websites & Web Channels` (`_key: web`) and
`Content, Brand & Ongoing Support` (`_key: support`).

The `_key` below must be exactly `systems` — the page picks each service card's
icon by `_key`, so a different key renders that card with no icon. Array order
only affects reading order, not icons.

| Field | Value |
|---|---|
| `_key` | `systems` |
| `title` | `Systems & Custom Software` |
| `body` | `The processes behind the presence: intake, scheduling, records, and reporting. We map what's costing you hours, fix what off-the-shelf tools can fix, and build custom where nothing fits.` |
| `href` | `/contact/` |
| `linkLabel` | `Ask about systems work` |

`href: /contact/` is deliberate — there is no systems landing page yet, and the
`linkLabel` pattern mirrors the existing support card so the arrow doesn't
promise a page that doesn't exist. `SVC_CTA` in the page already maps
`/contact/` to the `contact` analytics identity, so no code change is needed.

Also update, same document:

| Field | Currently | Change to |
|---|---|---|
| `servicesIntro` | `From the first honest read to the build — and the momentum after launch. Everything starts with the plan; everything after it is scoped from the plan, built by us or by anyone you choose.` | `From the first honest read to the build — and the momentum after launch. Everything starts with the plan; everything after it is scoped from the plan, built by us or by anyone you choose.` *(unchanged — verify it still reads right against four cards)* |

---

## 3. REQUIRED — Connect absorbs content

### Community Programs page (`communityProgramsPage`)

| Field | Currently | Change to |
|---|---|---|
| `heroLabel` | `Community Program Development · Taking root` | `Connect · Community Programs & Content · Taking root` |
| `gridTitle` | `Programs that put people in touch with what moves them forward.` | `Programs and content that put people in touch with what moves them forward.` |

**Add a fourth card** to `cards[]` (append after `c3`):

| Field | Value |
|---|---|
| `_key` | `c4` |
| `kicker` | `Content` |
| `title` | `Something worth passing on` |
| `body` | `Writing, guides, and stories that make what we learn useful to people we'll never invoice — published for the community, not for a client.` |

The existing three cards are unchanged. Note the page renders `cards` in a
`grid--3`; a fourth card wraps to its own row, which is acceptable but worth a
look after the rebuild.

**Keep client content distinct.** Content marketing sold to clients lives under
Web & Systems (`Content, Brand & Ongoing Support`). This card is Panta's own
published output. Don't let the two collapse into one another in future copy.

---

## 4. REQUIRED — Product Development admits physical products

### Product Development page (`productDevelopmentPage`)

| Field | Currently | Change to |
|---|---|---|
| `heroLabel` | `Product Development · Taking root` | `Create · Product Development · Taking root` |
| `gridTitle` | `Products with a community-sized purpose.` | `Digital and physical products with a community-sized purpose.` |

The owner's scope includes physical products; the page currently describes
digital only. Card `c2` ("Built like our services") should also lose its
implicit software-only framing at some point — not blocking.

---

## 5. RECOMMENDED — the breadth page

### Home page doc (`homePage`, rendered at `/what-we-do/`)

Beyond the four renames in section 1, this is the page that now carries the full
three-practice story. Worth a read-through — not audited in detail during the
taxonomy pass:

- `verbCards[]` — should map cleanly to Build / Connect / Create
- `practiceChecklist[]` — the live practice's service list, now four items
  (Systems & Custom Software is missing from it)
- `practicesNote`

---

## Rebuild

Run from `site/` (not the repo root):

```bash
npx vercel pull --yes --environment=production && npx vercel build --prod --yes && npx vercel deploy --prebuilt --prod --yes
```
