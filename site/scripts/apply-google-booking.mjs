/**
 * Points the booking URL back at the Google Calendar appointment schedule.
 *
 * The scheduler was Koalendar for one commit. It is Google again, and the code
 * side of the switch is done (site/src/lib/booking.js derives the embed with
 * ?gv=true instead of ?embed=true) — but `siteSettings.scheduleUrl` still holds
 * the koalendar.com link, and that field is what both the embed and the "open
 * it in a new tab" fallback are built from. Until this runs, the pages render a
 * Google-shaped embed URL pointing at Koalendar.
 *
 * No URL is invented here. The Google address is read out of `calEmbedUrl` —
 * the retired field that still holds exactly what the site embedded before the
 * switch — with `gv=true` stripped, because scheduleUrl is the plain booking
 * link and booking.js adds that parameter itself.
 *
 *   node scripts/apply-google-booking.mjs            # dry run, prints the plan
 *   node scripts/apply-google-booking.mjs --apply    # writes
 *
 * Safe to re-run: it checks the current value first and skips when scheduleUrl
 * already points at Google. `calEmbedUrl` is left alone — it is the record of
 * where this URL came from, and nothing reads it.
 *
 * Writes the PUBLISHED document, because the site reads published content at
 * build time. The change only reaches the live site after a rebuild + redeploy.
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

console.log(`\ngoogle booking — ${APPLY ? 'APPLYING' : 'dry run'}\n`);

const doc = await client.getDocument('siteSettings');
if (!doc) {
  console.error('No siteSettings document. Nothing to do.');
  process.exit(1);
}

const current = doc.scheduleUrl ?? '';
const retired = doc.calEmbedUrl ?? '';

console.log(`  scheduleUrl (now):  ${current || '(empty)'}`);
console.log(`  calEmbedUrl (was):  ${retired || '(empty)'}\n`);

if (/calendar\.google\.com/.test(current)) {
  console.log('  Already a Google booking link. Nothing to do.\n');
  process.exit(0);
}

if (!/calendar\.google\.com\/calendar\/appointments\/schedules\//.test(retired)) {
  // Refuse rather than guess. A wrong booking URL is a silently dead calendar
  // on the page that exists to get bookings.
  console.error(
    '  calEmbedUrl does not hold a Google appointment schedule URL, so there\n' +
      '  is nothing to restore from. Paste the schedule address into Site\n' +
      '  Settings → Booking page URL by hand instead:\n' +
      '  Google Calendar → the appointment schedule → Share → Embed.\n'
  );
  process.exit(1);
}

// booking.js owns the embed parameter; the stored value is the plain link.
const next = (() => {
  const url = new URL(retired);
  url.searchParams.delete('gv');
  return url.toString();
})();

console.log(`  scheduleUrl (next): ${next}\n`);

if (!APPLY) {
  console.log('  Dry run. Re-run with --apply to write.\n');
  process.exit(0);
}

if (!client.config().token) {
  console.error('  No SANITY_WRITE_TOKEN found — cannot write.\n');
  process.exit(1);
}

await client.patch('siteSettings').set({ scheduleUrl: next }).commit();
console.log('  Written. Rebuild and redeploy the site to pick it up.\n');
