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

  // Honeypot: real visitors never fill this field; bots do. Pretend success.
  if (String(form.get('website') ?? '').trim()) return ok();

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

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, CONTACT_TO } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    // A dev machine normally has no SMTP credentials, and hard-failing there
    // makes the success path untestable without a deploy. Log and succeed in
    // dev only — production still fails loudly. Same posture as subscribe.ts.
    if (import.meta.env.DEV) {
      console.info(`contact (no SMTP in dev): ${name} <${email}> via ${source}\n${message}`);
      return ok();
    }
    console.error('contact: SMTP env vars are not configured');
    return fail('Something went wrong sending that. Email us directly instead.', 502);
  }

  const port = Number(SMTP_PORT ?? 587);
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  try {
    await transporter.sendMail({
      from: `"panta.llc contact form" <${SMTP_USER}>`,
      to: CONTACT_TO || 'hello@panta.llc',
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

  return ok();
};
