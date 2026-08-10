export const prerender = false;

import type { APIRoute } from 'astro';

import { requireUser } from '../../../../lib/auth/guard.ts';
import {
  addContact,
  fileMessage,
  getQueueItem,
  resolveQueueItem,
} from '../../../../lib/db/queries/gmail.ts';

/**
 * Resolve one suggested message.
 *
 * Filing does two things: puts the message on the chosen client's timeline,
 * and — if asked — remembers the sender as a contact. That second part is the
 * point of the queue. A domain match is a guess made once; a contact record
 * turns every future message from that person into a confident auto-file.
 */
export const POST: APIRoute = async ({ request, params, redirect, locals }) => {
  requireUser(locals);

  const id = params.id;
  if (!id) return new Response('missing id', { status: 400 });

  const item = await getQueueItem(id);
  if (!item) return redirect('/inbox/suggested', 303);

  const form = await request.formData();
  const action = String(form.get('action') ?? 'ignore');

  if (action !== 'file') {
    await resolveQueueItem(id, 'ignored');
    return redirect('/inbox/suggested', 303);
  }

  const clientId = String(form.get('clientId') ?? '').trim();
  if (!clientId) return redirect('/inbox/suggested', 303);

  let contactId: string | null = null;

  if (form.get('addContact') && item.fromEmail) {
    // Name the contact after the local part until there is something better —
    // "sarah" beats a blank row, and it is editable.
    const local = item.fromEmail.slice(0, item.fromEmail.indexOf('@'));
    const created = await addContact({
      clientId,
      name: local.replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      email: item.fromEmail,
    });
    contactId = created?.id ?? null;
  }

  await fileMessage({
    clientId,
    contactId,
    externalId: item.gmailMessageId,
    threadId: item.gmailThreadId ?? item.gmailMessageId,
    // Queued items are inbound by definition: they arrived from an address
    // that is not the mailbox owner's.
    direction: 'in',
    occurredAt: item.occurredAt ?? new Date(),
    subject: item.subject,
    snippet: item.snippet,
  });

  await resolveQueueItem(id, contactId ? 'new_contact' : 'filed');

  return redirect('/inbox/suggested', 303);
};
