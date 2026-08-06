// Contact-form handler: relays submissions to the owner's inbox over SMTP.
// Configure in Vercel (or .env for local dev):
//   SMTP_HOST, SMTP_PORT (587 or 465), SMTP_USER, SMTP_PASS  — the sending account
//   CONTACT_TO — where submissions land (defaults to hello@panta.llc)
export const prerender = false;

import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

/**
 * The homepage form submits with `xhr=1` and stays on the page, so it needs JSON
 * back rather than a 303 to /contact/. The contact page posts without the flag
 * and keeps the redirect flow it has always had — same handler, same inbox,
 * same validation, two response shapes. Mirrors api/subscribe.ts.
 */
function json(body: { ok: true } | { ok: false; error: string }, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

/** Coerce Vite/Node env values to a trimmed string (empty → undefined). */
function str(value: unknown): string | undefined {
  if (value == null) return undefined;
  const s = String(value).trim();
  return s || undefined;
}

export const POST: APIRoute = async ({ request, redirect }) => {
  // Same-origin check. Astro's built-in checkOrigin compares against the
  // request URL, which Vercel's proxy rewrites — so compare Origin to the
  // forwarded Host instead. Requests with no Origin (curl, some clients)
  // still have to clear the honeypot and validation below.
  const origin = request.headers.get('origin');
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (origin && host && new URL(origin).host !== host) {
    return new Response('Forbidden', { status: 403 });
  }

  const form = await request.formData();
  const wantsJson = String(form.get('xhr') ?? '').trim() === '1';

  // Every exit routes through here so the two response shapes can never drift.
  const ok = () => (wantsJson ? json({ ok: true }) : redirect('/contact/?sent=1', 303));
  const fail = (error: string, status: number) =>
    wantsJson ? json({ ok: false, error }, status) : redirect('/contact/?error=1', 303);

  // Honeypot: real visitors never fill this; bots (and some password managers
  // that autofill name="website") do. Pretend success so we don't tip them off.
  // Accept both field names while the form markup migrates off `website`.
  if (
    String(form.get('company_url') ?? '').trim() ||
    String(form.get('website') ?? '').trim()
  ) {
    console.info('contact: honeypot tripped — skipping send');
    return ok();
  }

  const name = String(form.get('name') ?? '').trim();
  const email = String(form.get('email') ?? '').trim();
  const org = String(form.get('org') ?? '').trim();
  const message = String(form.get('message') ?? '').trim();
  // Which surface the lead came from, so homepage and /contact/ are tellable
  // apart in the inbox. Defaults to the page that had no field before this.
  const source = String(form.get('source') ?? 'contact_page').slice(0, 40);

  if (!name || !email || !email.includes('@')) {
    return fail('Add your name and a valid email address.', 400);
  }

  // Astro/Vite loads `.env*` into `import.meta.env` for local `astro dev`.
  // Vercel injects the same keys into `process.env` at runtime. Read both so
  // local and production use one path — previously `process.env` alone meant
  // local always hit the "no SMTP in dev" fake-success branch below.
  const SMTP_HOST = str(import.meta.env.SMTP_HOST ?? process.env.SMTP_HOST);
  const SMTP_PORT = str(import.meta.env.SMTP_PORT ?? process.env.SMTP_PORT);
  const SMTP_USER = str(import.meta.env.SMTP_USER ?? process.env.SMTP_USER);
  const SMTP_PASS = str(import.meta.env.SMTP_PASS ?? process.env.SMTP_PASS);
  const CONTACT_TO = str(import.meta.env.CONTACT_TO ?? process.env.CONTACT_TO);
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    // A dev machine normally has no SMTP credentials, and hard-failing there
    // makes the success path untestable without a deploy. Log and succeed in
    // dev only — production still fails loudly. Same posture as subscribe.ts.
    if (import.meta.env.DEV) {
      console.info(`contact (no SMTP in dev): ${name} <${email}> via ${source}\n${message}`);
      // Print the receipt too, so its copy can be proofread without a deploy —
      // the real send happens below and is unreachable on a machine with no
      // credentials.
      console.info(
        `\n--- confirmation that would go to ${email} ---\n${confirmationText({ name, message })}\n--- end ---\n`,
      );
      return ok();
    }
    console.error('contact: SMTP env vars are not configured');
    return fail('Something went wrong sending that. Email us directly instead.', 502);
  }

  const to = CONTACT_TO || 'hello@panta.llc';
  const port = Number(SMTP_PORT || 587);
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  try {
    await transporter.sendMail({
      from: `"panta.llc contact form" <${SMTP_USER}>`,
      to,
      replyTo: `"${name.replace(/"/g, '')}" <${email}>`,
      subject: `New ${source === 'contact_page' ? 'contact' : 'lead'} from ${name}${org ? ` (${org})` : ''}`,
      text: [
        `Name: ${name}`,
        `Organization: ${org || '—'}`,
        `Email: ${email}`,
        `Source: ${source}`,
        '',
        message || '(no message)',
      ].join('\n'),
    });
  } catch (err) {
    console.error('contact: send failed', err);
    return fail('Something went wrong sending that. Email us directly instead.', 502);
  }

  // Receipt to the person who just wrote in. Deliberately AFTER the notification
  // above and in its own try/catch: the lead reaching the inbox is the thing
  // that must not fail, and a bounced confirmation must never cost us the lead
  // or show the visitor an error for something that already worked.
  //
  // Transactional, not marketing — they initiated it — so no unsubscribe. The
  // honeypot path returned long before here, so bots never trigger a send to a
  // spoofed address.
  try {
    await transporter.sendMail({
      from: `"Panta" <${SMTP_USER}>`,
      to: email,
      // Replies land with the humans, not in the form's own mailbox.
      replyTo: to,
      subject: 'We got your note — Panta',
      text: confirmationText({ name, message }),
    });
  } catch (err) {
    console.error('contact: confirmation to sender failed (lead was delivered)', err);
  }

  return ok();
};

/**
 * The receipt. Its job is to close the loop in the window before a human
 * replies — that gap is where someone decides the form was broken and goes to
 * fill in somebody else's.
 *
 * Echoes their own words back when there are any (the compact mid-page form
 * collects name and email only, so `message` is often empty) and repeats both
 * promises the site makes: a reply within one business day, and the written
 * readout within 48 hours of the call.
 */
function confirmationText({ name, message }: { name: string; message: string }) {
  const firstName = name.split(/\s+/)[0];
  return [
    `Hi ${firstName},`,
    '',
    'Thanks for getting in touch — this is just to confirm it arrived.',
    '',
    'A real person (usually Damon) will reply within one business day. If a call',
    'makes sense we will find a time; if your question does not need one, you will',
    'get a straight answer instead.',
    '',
    ...(message
      ? ['Here is what you sent, for your records:', '', ...message.split('\n').map((l) => `> ${l}`), '']
      : []),
    'If you would rather just put something in the calendar now, you can pick a',
    'time here:',
    'https://panta.llc/consultation/#book',
    '',
    'It is a free 30-minute review, and you get a one-page written readout within',
    '48 hours afterward — three observations and one recommendation, yours to keep',
    'either way.',
    '',
    '— Panta',
    'hello@panta.llc',
  ].join('\n');
}
