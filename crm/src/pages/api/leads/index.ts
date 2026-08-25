export const prerender = false;

import type { APIRoute } from 'astro';

import { requireUser } from '../../../lib/auth/guard.ts';
import { createLead } from '../../../lib/db/queries/leads.ts';
import { LEAD_URGENCIES } from '../../../lib/db/schema.ts';

/**
 * A lead you took down yourself — someone mentioned an organization at an
 * event, or a partner phoned it in rather than using their link.
 *
 * Same table and same triage queue as the partner-submitted ones, marked
 * `submittedVia: 'internal'` so the two are tellable apart. `partnerId` is
 * still optional here: a phoned-in referral should be attributed to the
 * partner who made it even though it never went through their form.
 */
export const POST: APIRoute = async ({ request, redirect, locals }) => {
  requireUser(locals);

  const form = await request.formData();
  const str = (key: string) => String(form.get(key) ?? '').trim();

  const orgName = str('orgName');
  if (!orgName) return redirect('/leads/new?error=org', 303);

  const urgency = str('urgency');

  const lead = await createLead({
    partnerId: str('partnerId') || null,
    orgName,
    websiteUrl: str('websiteUrl') || null,
    sector: str('sector') || null,
    city: str('city') || null,
    state: str('state') || null,
    contactName: str('contactName') || null,
    contactEmail: str('contactEmail') || null,
    contactPhone: str('contactPhone') || null,
    contactRole: str('contactRole') || null,
    whatTheyNeed: str('whatTheyNeed') || null,
    urgency: (LEAD_URGENCIES as readonly string[]).includes(urgency) ? urgency : 'unknown',
    permissionToContact: str('permissionToContact') === '1',
    referrerNote: str('referrerNote') || null,
    submittedVia: 'internal',
  });

  return redirect(`/leads/${lead.id}`, 303);
};
