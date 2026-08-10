export const prerender = false;

import type { APIRoute } from 'astro';

import { createClient } from '../../../lib/db/queries/clients.ts';
import { requireUser } from '../../../lib/auth/guard.ts';

/** Trimmed string, or null for empty — never the empty string in the database. */
function str(form: FormData, key: string): string | null {
  const value = String(form.get(key) ?? '').trim();
  return value || null;
}

export const POST: APIRoute = async ({ request, redirect, locals }) => {
  requireUser(locals);

  const form = await request.formData();
  const name = str(form, 'name');
  if (!name) return redirect('/clients/new?error=name', 303);

  const client = await createClient({
    name,
    websiteUrl: str(form, 'websiteUrl'),
    sector: str(form, 'sector'),
    city: str(form, 'city'),
    state: str(form, 'state'),
    notes: str(form, 'notes'),
  });

  return redirect(`/clients/${client.id}`, 303);
};
