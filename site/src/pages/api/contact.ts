// Contact-form handler: relays submissions to the owner's inbox over SMTP.
// Configure in Vercel (or .env for local dev):
//   SMTP_HOST, SMTP_PORT (587 or 465), SMTP_USER, SMTP_PASS  — the sending account
//   CONTACT_TO — where submissions land (defaults to hello@panta.llc)
export const prerender = false;

import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

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

  // Honeypot: real visitors never fill this field; bots do. Pretend success.
  if (String(form.get('website') ?? '').trim()) {
    return redirect('/contact/?sent=1', 303);
  }

  const name = String(form.get('name') ?? '').trim();
  const email = String(form.get('email') ?? '').trim();
  const org = String(form.get('org') ?? '').trim();
  const message = String(form.get('message') ?? '').trim();

  if (!name || !email || !email.includes('@')) {
    return redirect('/contact/?error=1', 303);
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, CONTACT_TO } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.error('contact: SMTP env vars are not configured');
    return redirect('/contact/?error=1', 303);
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
      subject: `New contact from ${name}${org ? ` (${org})` : ''}`,
      text: [
        `Name: ${name}`,
        `Organization: ${org || '—'}`,
        `Email: ${email}`,
        '',
        message || '(no message)',
      ].join('\n'),
    });
  } catch (err) {
    console.error('contact: send failed', err);
    return redirect('/contact/?error=1', 303);
  }

  return redirect('/contact/?sent=1', 303);
};
