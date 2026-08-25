export const prerender = false;

import type { APIRoute } from 'astro';

import {
  getActivePartnerByToken,
  countRecentSubmissions,
  SUBMISSIONS_PER_HOUR,
} from '../../../lib/db/queries/partners.ts';
import { createLead } from '../../../lib/db/queries/leads.ts';
import { LEAD_URGENCIES } from '../../../lib/db/schema.ts';

/**
 * The only unauthenticated write in this application.
 *
 * Four things stand between it and the `leads` table, in this order, and each
 * one is cheaper than the one after it:
 *
 *   1. the token must resolve to an ACTIVE partner  — else 404
 *   2. the honeypot must be empty                   — else fake success
 *   3. the per-token hourly rate limit              — else a real error
 *   4. field validation                             — else a real error
 *
 * The middleware's same-origin check has already run by the time this handler
 * is entered, so a form posted from someone else's page is rejected before any
 * of this. That check is the reason this route needs no CSRF token of its own.
 *
 * Note what is NOT here: no duplicate rejection. A partner who refers an
 * organization you already know about gets a thank-you, not an error. Telling
 * someone their referral was unwanted on the strength of a fuzzy match is how
 * you stop receiving referrals; the duplicate gets flagged on the lead page
 * instead, where you can see it and they never do.
 */
export const POST: APIRoute = async ({ params, request, redirect, clientAddress }) => {
  const token = params.token ?? '';
  const partner = await getActivePartnerByToken(token);

  // Unknown and revoked are indistinguishable from out here — see
  // getActivePartnerByToken. A revoked link that announced itself would confirm
  // to whoever holds it that it was once real.
  if (!partner) return new Response('Not found', { status: 404 });

  const back = (query: string) => redirect(`/refer/${encodeURIComponent(token)}${query}`, 303);

  const form = await request.formData();
  const str = (key: string) => String(form.get(key) ?? '').trim();

  // Honeypot. Real people never fill this; bots and a few password managers
  // do. Report success so nothing is learned from the difference — the same
  // posture as site/src/pages/api/contact.ts, which has been carrying it in
  // production and uses the same field name.
  if (str('company_url')) {
    console.info(`refer: honeypot tripped on partner ${partner.id} — discarding`);
    return back('?sent=1');
  }

  // Rate limit, per token rather than per IP. A partner emailing from an
  // office shares an address with their colleagues, and a bot with a leaked
  // link does not stay on one address — so the token is both the fairer and
  // the more effective thing to count.
  const recent = await countRecentSubmissions(partner.id);
  if (recent >= SUBMISSIONS_PER_HOUR) {
    console.warn(`refer: rate limit hit by partner ${partner.id} (${recent}/hr)`);
    return back('?error=rate');
  }

  const orgName = str('orgName');
  const contactEmail = str('contactEmail');
  const contactPhone = str('contactPhone');
  const websiteUrl = str('websiteUrl');

  if (!orgName) return back('?error=org');

  // Some way to reach them, without dictating which. A partner may have an
  // email, or only a phone number, or only the website they were looking at
  // when they thought of you — all three are workable, and none is worth
  // failing a referral over.
  if (!contactEmail && !contactPhone && !websiteUrl) {
    return back('?error=contact');
  }
  if (contactEmail && !contactEmail.includes('@')) return back('?error=email');

  const urgency = str('urgency');

  await createLead({
    partnerId: partner.id,
    orgName,
    websiteUrl: websiteUrl || null,
    sector: str('sector') || null,
    city: str('city') || null,
    state: str('state') || null,
    contactName: str('contactName') || null,
    contactEmail: contactEmail || null,
    contactPhone: contactPhone || null,
    contactRole: str('contactRole') || null,
    whatTheyNeed: str('whatTheyNeed') || null,
    urgency: (LEAD_URGENCIES as readonly string[]).includes(urgency) ? urgency : 'unknown',
    permissionToContact: str('permissionToContact') === '1',
    referrerNote: str('referrerNote') || null,
    submittedVia: 'partner_link',
    // Vercel's proxy sets x-forwarded-for; clientAddress is the framework's
    // reading of the same thing and is right in dev too.
    submittedIp:
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || clientAddress || null,
  });

  console.info(`refer: lead from partner ${partner.id} (${partner.name})`);
  return back('?sent=1');
};
