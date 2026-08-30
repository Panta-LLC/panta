// Contact-form handler: relays submissions to the owner's inbox over SMTP.
// Configure in Vercel (or .env for local dev):
//   SMTP_HOST, SMTP_PORT (587 or 465), SMTP_USER, SMTP_PASS  — the sending account
//   CONTACT_TO — where submissions land (defaults to hello@panta.llc)
export const prerender = false;

import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';
import { rateLimit } from '../../lib/rate-limit';
import { headerSafe, screenSubmission } from '../../lib/spam';

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

/**
 * Best-effort client IP for the rate limit. Vercel's proxy sets
 * x-forwarded-for and overwrites rather than appends, so the first entry is the
 * client as the edge saw it and a spoofed value does not survive. It gates a
 * courtesy limit and authorises nothing. Locally there is no proxy, so every
 * dev request shares one bucket — which is what makes the limit testable from a
 * single machine. Mirrors api/subscribe.ts.
 */
function clientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  const first = xff?.split(',')[0]?.trim();
  return first || request.headers.get('x-real-ip')?.trim() || 'local';
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
  const referer = request.headers.get('referer');
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (origin && host && new URL(origin).host !== host) {
    return new Response('Forbidden', { status: 403 });
  }

  // Whether this POST came from a page on this site. Browsers set Origin on
  // every form submission, so a request carrying neither Origin nor a Referer
  // on our host did not come from our form — which is exactly how the spam that
  // prompted this arrived.
  //
  // Deliberately NOT a rejection. A header can be stripped by privacy tooling
  // or a corporate proxy, and losing a real lead is silent and unrecoverable
  // where receiving a spam email is neither. It is handed to the content screen
  // below as one signal among several instead.
  const sameHost = (value: string | null) => {
    if (!value || !host) return false;
    try {
      return new URL(value).host === host;
    } catch {
      return false;
    }
  };
  const fromOurPage = sameHost(origin) || sameHost(referer);

  const form = await request.formData();
  const wantsJson = String(form.get('xhr') ?? '').trim() === '1';

  // Where a no-JS (or JS-failed) submission lands. /quote/ needs its own
  // destination — journey-redesign.md §7 measures the quote path separately,
  // and bouncing a quote request to /contact/?sent=1 would both lose that
  // number and show the wrong confirmation ("we'll reply" rather than "you'll
  // have a written quote in two business days").
  //
  // An ALLOWLIST, not the submitted value: `return_to` arrives in a form body
  // from an unauthenticated POST, and passing it to redirect() unchecked is an
  // open redirect — anyone could host a form that posts here and bounces the
  // visitor to their own domain carrying our origin as the referrer.
  const RETURNS: Record<string, string> = {
    contact: '/contact/',
    quote: '/quote/',
  };
  const returnTo = RETURNS[String(form.get('return_to') ?? '').trim()] ?? '/contact/';

  // Every exit routes through here so the two response shapes can never drift.
  const ok = () => (wantsJson ? json({ ok: true }) : redirect(`${returnTo}?sent=1`, 303));
  const fail = (error: string, status: number) =>
    wantsJson ? json({ ok: false, error }, status) : redirect(`${returnTo}?error=1`, 303);

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
  // Capped at the point of read, so nothing downstream has to think about
  // length. `name` is deliberately NOT capped here — an absurdly long one is a
  // spam signal the screen below scores, and truncating it first would hide it.
  const org = String(form.get('org') ?? '').trim().slice(0, 200);
  const message = String(form.get('message') ?? '').trim().slice(0, 4000);
  // Which surface the lead came from, so homepage and /contact/ are tellable
  // apart in the inbox. Defaults to the page that had no field before this.
  const source = String(form.get('source') ?? 'contact_page').slice(0, 40);
  // Quote-form only (journey-redesign.md §5.3). Optional everywhere else, so
  // every existing form posts unchanged and simply omits both lines below.
  const need = String(form.get('need') ?? '').trim().slice(0, 60);
  const budget = String(form.get('budget') ?? '').trim().slice(0, 60);

  if (!name || !email || !email.includes('@')) {
    return fail('Add your name and a valid email address.', 400);
  }

  // Content screen (src/lib/spam.ts). The honeypot above catches the bot that
  // fills every field it finds; this catches the one that fills only the real
  // ones and puts its payload in the name.
  //
  // Drops SILENTLY with the success response, exactly like the honeypot path.
  // A bot that gets an error learns which part of its payload to change; one
  // that gets a 200 has no reason to come back with a different one. The log
  // line carries the score and the signals that fired, so a mis-catch can be
  // diagnosed from the Vercel logs — that is the only place a dropped
  // submission is visible, and it is on purpose.
  const verdict = screenSubmission({ name, email, org, message, hasOrigin: fromOurPage });
  if (verdict.spam) {
    console.info(
      `contact: screened out (score ${verdict.score}: ${verdict.reasons.join(', ')}) ` +
        `from ${email} — name: ${JSON.stringify(name.slice(0, 120))}`,
    );
    return ok();
  }

  // Limits sit here rather than at the top of the handler: a honeypot hit, a
  // typo'd address and a screened payload all cost us nothing, and none of them
  // should be able to spend a real visitor's budget. What is being protected is
  // the SMTP send and the sending domain's reputation, so the check goes
  // directly in front of it.
  //
  // Two rules, opposite attacks — same reasoning as api/subscribe.ts. Per-IP
  // stops one script working through a list. Per-email protects the person
  // whose address is being used as the reply-to for a flood, since every
  // accepted submission sends that address a confirmation it never asked for.
  // See src/lib/rate-limit.ts for the per-instance caveat: this is a speed
  // bump, not a guarantee.
  const ip = clientIp(request);
  const limited =
    !rateLimit(`contact:ip:${ip}`, { limit: 5, windowMs: 60 * 60_000 }).ok ||
    !rateLimit(`contact:email:${email.toLowerCase()}`, { limit: 3, windowMs: 60 * 60_000 }).ok;
  if (limited) {
    console.info(`contact: rate limited ip=${ip} email=${email}`);
    return fail("That's a few too many tries. Give it a minute and try again.", 429);
  }

  // Runtime first, build-time only as a dev fallback. Both halves matter:
  //
  // Vite replaces `import.meta.env.X` with a string literal at BUILD time, so
  // reading it first (as this file used to) had two consequences — the value
  // was frozen into the deployed bundle, and the `?? process.env.X` after it
  // was constant-folded away and never ran. The SMTP password was therefore a
  // plaintext literal in .vercel/output, and rotating it needed a rebuild
  // rather than a Vercel env change. Vercel injects the real values into
  // `process.env` at request time, so that is the source of truth.
  //
  // The `import.meta.env.DEV` guard is load-bearing, not decoration: with it, a
  // production build folds each ternary down to `undefined` and no literal
  // reaches the artifact. `astro dev` loads `.env*` into `import.meta.env` but
  // not `process.env`, so local still resolves and does not fall through to the
  // fake-success branch below.
  //
  // This is deliberately repetitive rather than a helper. A generic
  // `env('SMTP_HOST')` cannot work — Vite's replacement is textual on
  // `import.meta.env.LITERAL`, and a computed key falls through to a runtime
  // object that carries no non-PUBLIC values in production. Passing the value
  // into a helper does not work either: the literal would be evaluated at the
  // call site as an argument and ship anyway. The ternary has to be inline for
  // the dead-code elimination to fire. Mirrors api/subscribe.ts.
  const SMTP_HOST = str(process.env.SMTP_HOST ?? (import.meta.env.DEV ? import.meta.env.SMTP_HOST : undefined));
  const SMTP_PORT = str(process.env.SMTP_PORT ?? (import.meta.env.DEV ? import.meta.env.SMTP_PORT : undefined));
  const SMTP_USER = str(process.env.SMTP_USER ?? (import.meta.env.DEV ? import.meta.env.SMTP_USER : undefined));
  const SMTP_PASS = str(process.env.SMTP_PASS ?? (import.meta.env.DEV ? import.meta.env.SMTP_PASS : undefined));
  const CONTACT_TO = str(process.env.CONTACT_TO ?? (import.meta.env.DEV ? import.meta.env.CONTACT_TO : undefined));
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
        `\n--- confirmation that would go to ${email} ---\n${confirmationText({ name, message, isQuote: source === 'quote_page' })}\n--- end ---\n`,
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
      replyTo: `"${headerSafe(name)}" <${email}>`,
      // A quote request is a different job from a lead — it has a two-business-day
      // clock on it — so it says so in the subject rather than needing the body
      // read to find out.
      // headerSafe, not the raw values: a Subject line is the one place a
      // submitted string leaves our formatting and becomes mail structure, and
      // a 200-character "name" in it is what tripped the receiving host's spam
      // filter and bounced the whole message. Truncated here, screened above.
      subject: `New ${
        source === 'quote_page' ? 'QUOTE REQUEST' : source === 'contact_page' ? 'contact' : 'lead'
      } from ${headerSafe(name)}${org ? ` (${headerSafe(org, 40)})` : ''}`,
      text: [
        `Name: ${name}`,
        // Labelled "Website or organization" on the form (LeadForm.astro) —
        // the field name stayed `org` so this route did not have to change.
        `Website / org: ${org || '—'}`,
        `Email: ${email}`,
        `Source: ${source}`,
        ...(need ? [`Needs: ${need}`] : []),
        ...(budget ? [`Budget: ${budget}`] : []),
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
    const isQuote = source === 'quote_page';
    await transporter.sendMail({
      from: `"Panta" <${SMTP_USER}>`,
      to: email,
      // Replies land with the humans, not in the form's own mailbox.
      replyTo: to,
      subject: isQuote ? 'We got your brief — Panta' : 'We got your note — Panta',
      text: confirmationText({ name, message, isQuote }),
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
function confirmationText({
  name,
  message,
  isQuote = false,
}: {
  name: string;
  message: string;
  isQuote?: boolean;
}) {
  const firstName = name.split(/\s+/)[0];
  // The quote path promises a written number in two business days, and the
  // receipt has to repeat the promise the page made rather than the generic
  // one — a confirmation that quietly downgrades the commitment is worse than
  // no confirmation.
  if (isQuote) {
    return [
      `Hi ${firstName},`,
      '',
      'Thanks for the brief — this is just to confirm it arrived.',
      '',
      'You will have a fixed-price quote in writing within two business days, or a',
      'short note saying what we would need to know first. Either way it comes from',
      'a person who has read what you sent.',
      '',
      ...(message
        ? ['Here is the brief you sent, for your records:', '', ...message.split('\n').map((l) => `> ${l}`), '']
        : []),
      'If it turns out the scope is still open, we may suggest starting with the free',
      '30-minute review instead — but we will say why, and you will still get the',
      'number you asked for.',
      '',
      '— Panta',
      'hello@panta.llc',
    ].join('\n');
  }
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
    'https://www.allthingspanta.com/consultation/#book',
    '',
    'It is a free 30-minute review, and you get a one-page written readout within',
    '48 hours afterward — three observations and one recommendation, yours to keep',
    'either way.',
    '',
    '— Panta',
    'hello@panta.llc',
  ].join('\n');
}
