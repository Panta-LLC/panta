export const prerender = false;

import type { APIRoute } from 'astro';

import { requireUser } from '../../../lib/auth/guard.ts';
import { createPartner } from '../../../lib/db/queries/partners.ts';

export const POST: APIRoute = async ({ request, redirect, locals }) => {
  requireUser(locals);

  const form = await request.formData();
  const str = (key: string) => String(form.get(key) ?? '').trim() || null;

  const name = str('name');
  if (!name) return redirect('/partners/new?error=name', 303);

  const partner = await createPartner({
    name,
    contactName: str('contactName'),
    email: str('email'),
    phone: str('phone'),
    relationship: str('relationship'),
    notes: str('notes'),
  });

  // Straight to the partner page, where the link is waiting to be copied —
  // that link is the entire reason you just made this record.
  return redirect(`/partners/${partner.id}?created=1`, 303);
};
