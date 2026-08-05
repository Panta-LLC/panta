/**
 * Imports "Impactful Engagement with DBI" from the old site into Sanity as a
 * Pulse post, linked to Delta Bay Impact.
 *
 * Source: https://panta-agency-web.vercel.app/pulse/impactful-engagement-with-dbi
 * Body is transcribed verbatim from that page. The trailing "Want to discuss
 * this article…" block is NOT included — that is the old site's CTA chrome,
 * not article copy.
 *
 * Also creates the `client` document for Delta Bay Impact, because `post.clients`
 * references `client` and the dataset had none — the projects carry a free-text
 * `clientType` instead and their `client` reference is unset. Without this there
 * is nothing to link the article to.
 *
 * Editorial decisions that are NOT in the source and should be reviewed:
 *   - category: Voice ("telling the story"). The old site filed it under
 *     "Community", which has no equivalent in the three Pulse categories; this
 *     piece is about photography and showing impact, so Voice is the fit.
 *   - standfirst: required by the schema and the source has no deck, so one is
 *     written here from the article's own facts.
 *
 *   node scripts/import-dbi-pulse-post.mjs            # dry run, prints the plan
 *   node scripts/import-dbi-pulse-post.mjs --apply    # writes
 *
 * Uses createIfNotExists, so re-running never duplicates or overwrites. To
 * revise after import, edit in the Studio — not by re-running this.
 *
 * Writes PUBLISHED documents, because the site reads published content at build
 * time. Content only reaches the live site after a rebuild + redeploy.
 */
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';

const APPLY = process.argv.includes('--apply');

function tokenFromEnvFile() {
  try {
    const line = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
      .split('\n')
      .find((l) => l.trim().startsWith('SANITY_WRITE_TOKEN='));
    return line?.split('=').slice(1).join('=').trim().replace(/^["']|["']$/g, '');
  } catch {
    return undefined;
  }
}

const client = createClient({
  projectId: 'tdi9ql1j',
  dataset: 'pantaco',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN || tokenFromEnvFile(),
});

const CLIENT_ID = 'client-delta-bay-impact';
const POST_ID = 'post-impactful-engagement-with-dbi';

/** Portable Text helpers. Keys are deterministic so a re-run is byte-identical. */
let k = 0;
const block = (style, text) => ({
  _key: `b${++k}`,
  _type: 'block',
  style,
  markDefs: [],
  children: [{ _key: `s${k}`, _type: 'span', text, marks: [] }],
});
const h2 = (t) => block('h2', t);
const p = (t) => block('normal', t);

const BODY = [
  h2('Starting the year off right'),
  p(
    'Back in January, I sat down with my sister Tiffany Francies, Executive Director of Delta Bay Impact, for a conversation about her vision for the organization in the coming year — the challenges she hoped to address and the opportunities she wanted to pursue. That conversation became the foundation of a partnership, working together to rebuild DBI’s reporting system and produce materials to better showcase the impactful work DBI was doing in Contra Costa schools.',
  ),

  h2('Laying the Foundation'),
  p(
    'We started by reviewing DBI’s existing website, identifying opportunities for more compelling content, improved structure, and greater clarity. Photography emerged as a natural tool for capturing and communicating real impact, so we planned a shoot around DBI’s upcoming Black History Month program. While we prepared, we continued iterating on the architecture, content, and visual language of the new site. We knew we’d want to honor DBI’s brand voice — its bold color scheme and sharp, forward-looking visual identity — while expanding what the site could do. The goal was to showcase the full range of DBI’s services to Contra Costa youth: in-school activities, community events, and partnerships with the many organizations they work alongside. We also wanted to create clear pathways for engagement, inviting visitors of every kind to find their way into DBI’s mission. With that direction set, I got to work — sketching wireframes, evaluating tools, and mapping out the technical path forward.',
  ),

  h2('Black History Month — Into the Field'),
  p(
    'February came, and with it the day of the Black History Month program. I headed out to Contra Costa County and spent the day with DBI, traveling to Riverview Middle School and Meadow Homes Elementary School to photograph their assembly programs. It turned out to be the most clarifying point of the engagement for me. Getting to interact directly with the kids DBI supports made the stakes of this work real — the opportunity to make a genuine impact (pun absolutely intended) on lives in some of our most vulnerable communities.',
  ),
  p(
    'The energy those kids brought as they presented on influential African American figures was a joy to be around and to capture. What came through in the photos was strength, confidence, and courage — and those became the values I wanted to carry into the web experience.',
  ),

  h2('The Work Behind the Work'),
  p(
    'Back in Davis, I reviewed over 300 photos from five assemblies. Some students took naturally to the camera; others were more reserved — but that contrast produced some of the most dynamic and interesting shots of the day. From that session, I curated a set of 15 to 20 strong images, which combined with archival photos Tiffany provided gave us a rich visual library to work with. Over the next couple of weeks, I worked closely with Tiffany to finalize content, apply photography across the pages, and push through the remaining UI component development and third-party integrations as we moved toward delivery.',
  ),

  h2('Delivery, and What Comes Next'),
  p(
    'As the site neared completion, one more in-person visit remained: headshots for the DBI team. I headed back out to Antioch, photographed the team, and stayed to sit in on their staff meeting. It was an intimate look at what makes DBI tick — a room full of people genuinely passionate about the children in their community and committed to growing the organization’s reach. We closed the meeting by presenting the new website to the team. I hope it serves as another vessel for the meaningful work DBI does every day, and I look forward to continuing this partnership as the organization grows.',
  ),
];

const CLIENT_DOC = {
  _id: CLIENT_ID,
  _type: 'client',
  name: 'Delta Bay Impact',
  slug: { _type: 'slug', current: 'delta-bay-impact' },
  sector: 'Nonprofit',
  location: 'Contra Costa County, California',
  url: 'https://www.deltabayimpact.org/',
  summary:
    'A youth mentorship organization working in Contra Costa schools — in-school activities, community events, and partnerships across the county.',
  relationship: 'current',
  since: '2026',
  logoApproved: false,
  order: 1,
};

const POST_DOC = {
  _id: POST_ID,
  _type: 'post',
  title: 'Impactful Engagement with DBI',
  slug: { _type: 'slug', current: 'impactful-engagement-with-dbi' },
  standfirst:
    'What began as a conversation about one organization’s year became a partnership — rebuilding Delta Bay Impact’s reporting, photographing their Black History Month assemblies in Contra Costa schools, and building a site around what the camera found.',
  seoDescription:
    'How a year with Delta Bay Impact — reporting, photography in Contra Costa schools, and a rebuilt site — came together, and what it looked like from the field.',
  category: { _type: 'reference', _ref: 'category-voice' },
  contentType: 'essay',
  publishedAt: '2026-04-16T09:00:00.000Z',
  author: { _type: 'reference', _ref: 'author-damon' },
  body: BODY,
  featured: false,
  clients: [{ _key: 'c1', _type: 'reference', _ref: CLIENT_ID }],
};

console.log(`\nimport DBI Pulse post — ${APPLY ? 'APPLYING' : 'dry run'}\n`);

const existing = Object.fromEntries(
  (await client.fetch('*[_id in $ids]{_id}', { ids: [CLIENT_ID, POST_ID] })).map((d) => [
    d._id,
    true,
  ]),
);

for (const [id, label] of [
  [CLIENT_ID, 'client  Delta Bay Impact'],
  [POST_ID, 'post    Impactful Engagement with DBI'],
]) {
  console.log(existing[id] ? `  already exists  ${label}` : `  WILL CREATE     ${label}`);
}

const words = BODY.filter((b) => b.style === 'normal')
  .map((b) => b.children[0].text)
  .join(' ')
  .split(/\s+/).length;
console.log(`\n  body: ${BODY.length} blocks, ~${words} words`);
console.log(`  category: Voice · contentType: essay · publishedAt: 2026-04-16`);
console.log(`  clients: [${CLIENT_ID}]\n`);

if (!APPLY) {
  console.log('Dry run. Re-run with --apply to write.\n');
  process.exit(0);
}

// Client first: the post references it, and a reference to a missing document
// is rejected by the API.
await client
  .transaction()
  .createIfNotExists(CLIENT_DOC)
  .createIfNotExists(POST_DOC)
  .commit();

console.log('Committed. Rebuild and redeploy for this to reach the live site.\n');
