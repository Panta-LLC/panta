/**
 * The Pulse Check instrument, v1 — transcribed from
 * pulse-check-questionnaire.md (working draft v0.1, Aug 10 2026).
 *
 * Transcribed, not paraphrased. The prompts and hints are the facilitator's
 * actual words on a live call; rewording them here would quietly change the
 * instrument. When the markdown is revised, bump `version`, add a new file,
 * and seed it — do not edit this one. Interviews pin the version they were
 * conducted under, and that guarantee is only worth something if old versions
 * are immutable.
 *
 * Deliberately absent: any scoring, weighting, or ranking. The source document
 * forbids grading, and the readout rules forbid it again. See the note on
 * `pulseChecks` in db/schema.ts.
 */
import type { InstrumentDefinition } from './types.ts';

export const pulseCheckV1: InstrumentDefinition = {
  key: 'pulse_check',
  version: 1,
  label: 'v0.1 · Aug 2026',
  owes:
    'Three observations and one recommendation, as a one-page written readout within 48 hours. Nothing more, and nothing less.',

  // ── Before the call — 5 minutes, yours not theirs ────────────────────────
  prep: {
    items: [
      {
        key: 'prep_search',
        label: 'Search their organization name. What owns page one? Note anything confusable.',
      },
      {
        key: 'prep_fold',
        label:
          'Open the homepage on a phone-width window. Start a timer at first paint — you want a real number.',
      },
      {
        key: 'prep_5sec',
        label:
          'Read the homepage for five seconds, then look away. Write down what you think they do and who for, before you know the answer.',
      },
      {
        key: 'prep_channels',
        label:
          'Find them on the one or two channels their audience would actually use. Is the account alive?',
      },
      {
        key: 'prep_contact',
        label:
          'Look for a way to contact or book. Count the clicks from homepage to submitted.',
      },
    ],
    fields: [
      {
        key: 'page_one_owners',
        type: 'longtext',
        prompt: 'What owns page one? Anything confusable?',
      },
      {
        key: 'fold_seconds',
        type: 'number',
        prompt: 'Seconds to first paint, phone width',
        widget: 'stopwatch',
      },
      {
        key: 'five_second_read',
        type: 'longtext',
        prompt: 'Your five-second read — what do you think they do, and who for?',
        hint: 'Write this before you know the answer. It is often observation #1.',
        lockOnCallStart: true,
        promoteTo: 'fiveSecondRead',
      },
      {
        key: 'channels_alive',
        type: 'longtext',
        prompt: 'Which channels did you find, and are they current or dormant?',
      },
      {
        key: 'click_count',
        type: 'number',
        prompt: 'Clicks from homepage to submitted',
        promoteTo: 'stepsToContact',
      },
    ],
  },

  segments: [
    // ── 0–3 · Orientation ─────────────────────────────────────────────────
    {
      key: 'orientation',
      label: 'Orientation',
      minutes: [0, 3],
      opener:
        "This is thirty minutes and it's a conversation, not an evaluation. I'll ask about three things — whether people can find you, whether they trust you when they do, and whether it's easy to choose you. I'll have your site up while we talk. In forty-eight hours you'll get one page from me: three things I noticed and the one I'd do first. It's yours either way.",
      questions: [
        {
          key: 'q01',
          n: 1,
          type: 'longtext',
          prompt: 'In a sentence or two — what do you do, and who for?',
          hint: "As you'd tell a neighbor.",
          promoteTo: 'whatTheyActuallyDo',
        },
        {
          key: 'q02',
          n: 2,
          type: 'longtext',
          prompt: 'What made you book this call now?',
          hint: 'The itch. Do not accept "just curious" — follow with: "What made this week the week?"',
          promoteTo: 'triggerText',
        },
        {
          key: 'q03',
          n: 3,
          type: 'longtext',
          prompt: 'If the next six months went well, what\'s different?',
          hint: 'More of what, specifically — clients, donations, bookings, calls?',
          promoteTo: 'goalInTheirWords',
        },
      ],
      listenFor:
        'A trigger event — a lost deal, a new competitor, a grant deadline, a bad month. The trigger usually tells you which of the three questions is really the live one, and you should weight the rest of the call toward it.',
    },

    // ── 3–9 · FIND ────────────────────────────────────────────────────────
    {
      key: 'find',
      label: 'FIND — can people find you?',
      minutes: [3, 9],
      questions: [
        {
          key: 'q04',
          n: 4,
          type: 'longtext',
          prompt: 'How do people find you today, as far as you know?',
          hint: 'Let them rank it themselves: word of mouth, search, social, referrals, directories, events.',
        },
        {
          key: 'q05',
          n: 5,
          type: 'longtext',
          prompt: "Where would you expect someone to look for you if they'd never heard of you?",
        },
        {
          key: 'q06',
          n: 6,
          type: 'longtext',
          prompt: 'Where do you exist online besides the website?',
          hint: 'Take the list as they say it — what they forget to mention is data.',
        },
        {
          key: 'q07',
          n: 7,
          type: 'longtext',
          prompt: 'Is there anything out there about you that\'s wrong right now?',
          hint: 'Old address, a former staff member, an account nobody can get into.',
        },
      ],
      trackTwo: [
        { key: 't2_find_search', prompt: 'Does the branded search return them cleanly?' },
        {
          key: 't2_find_alive',
          prompt: 'Are the channels they just listed current, or dormant with a two-year-old post?',
        },
        {
          key: 't2_find_links',
          prompt: 'Do the channels link back to the site — and does the site link out to them?',
        },
      ],
      listenFor:
        '"Everything is word of mouth" said with pride. That\'s a healthy business with no second engine, and it\'s fragile in a way the owner rarely feels until it isn\'t.',
      promoteNoticedTo: 'findNoticed',
    },

    // ── 9–16 · TRUST ──────────────────────────────────────────────────────
    {
      key: 'trust',
      label: 'TRUST — can they trust you when they get there?',
      minutes: [9, 16],
      note: 'This is the segment to share screens for if the tool allows. Looking together beats describing.',
      questions: [
        {
          key: 'q08',
          n: 8,
          type: 'longtext',
          prompt:
            "Say I'm a stranger who just landed on your homepage. What do you want me to feel in the first five seconds?",
          hint: 'Then tell them what you actually wrote down in your five-second test. Do this gently and do it out loud — it is the single most useful thing that happens on the call.',
        },
        {
          key: 'q09',
          n: 9,
          type: 'longtext',
          prompt: "Who wrote what's there now, and when was it last meaningfully touched?",
        },
        {
          key: 'q10',
          n: 10,
          type: 'longtext',
          prompt: 'What makes someone pick you over the alternative? → Is that anywhere on the site?',
          hint: "It usually isn't.",
        },
        {
          key: 'q11',
          n: 11,
          type: 'longtext',
          prompt: 'What do you have that proves it?',
          hint: "Testimonials, results, credentials, photos of real work, named clients — whatever's true for them.",
        },
        {
          key: 'q12',
          n: 12,
          type: 'longtext',
          prompt: "When someone's deciding, what are they nervous about?",
          hint: "Price, commitment, being sold to, whether you're still in business.",
        },
      ],
      trackTwo: [
        { key: 't2_trust_proof', prompt: 'Is the proof above the fold or buried three scrolls down?' },
        {
          key: 't2_trust_consistency',
          prompt: 'Is the same logo, name, and tone on the site as on the channels?',
        },
        {
          key: 't2_trust_broken',
          prompt:
            'Anything visibly broken — images, links, a copyright year that ended two years ago, a form that errors?',
        },
      ],
      listenFor:
        'A good answer to Q10 and Q11 that exists only in their head. A trust observation is almost always "you already have this, it\'s just not where anyone can see it" — which is a far better observation than "you need more."',
      promoteNoticedTo: 'trustNoticed',
    },

    // ── 16–22 · CHOOSE ────────────────────────────────────────────────────
    {
      key: 'choose',
      label: 'CHOOSE — is it easy to choose you?',
      minutes: [16, 22],
      questions: [
        {
          key: 'q13',
          n: 13,
          type: 'longtext',
          prompt: "What's the one thing you most want a visitor to do?",
          hint: "If the answer is a list, ask which one they'd take if they could only have one.",
        },
        {
          key: 'q14',
          n: 14,
          type: 'longtext',
          prompt: 'Walk me through what someone does from finding you to being in touch.',
          hint: 'Let them narrate it. Count the steps yourself.',
        },
        {
          key: 'q15',
          n: 15,
          type: 'longtext',
          prompt: 'How fast do you actually reply to a new inquiry — honestly?',
          promoteTo: 'honestReplyTime',
        },
        {
          key: 'q16',
          n: 16,
          type: 'longtext',
          prompt: 'How does a person know what happens next, before they contact you?',
          hint: "Price ranges, process, what a first meeting is, whether you're taking new clients.",
        },
        {
          key: 'q17',
          n: 17,
          type: 'longtext',
          prompt: 'Do you know where your last few inquiries came from?',
        },
      ],
      trackTwo: [
        { key: 't2_choose_clicks', prompt: 'Count the clicks from homepage to submitted.' },
        { key: 't2_choose_focus', prompt: 'Is there one clear next step, or four competing ones?' },
        { key: 't2_choose_phone', prompt: 'Does the phone number tap on mobile?' },
        {
          key: 't2_choose_deadend',
          prompt: 'Do the off-site channels dead-end, or do they carry the same action?',
        },
      ],
      listenFor:
        'A slow honest answer to Q15. Response time is the cheapest fix in the whole practice and it is frequently the most valuable observation you\'ll make.',
      promoteNoticedTo: 'chooseNoticed',
    },

    // ── 22–27 · Constraints ───────────────────────────────────────────────
    {
      key: 'constraints',
      label: "Constraints — what's actually possible for them",
      minutes: [22, 27],
      note: 'Ask these or the recommendation will be unusable.',
      questions: [
        {
          key: 'q18',
          n: 18,
          type: 'longtext',
          prompt: 'Who would do the work — you, someone on the team, or someone hired?',
        },
        {
          key: 'q19',
          n: 19,
          type: 'choice',
          prompt: 'Realistically, how much time a week could go to this?',
          options: [
            { v: 'under_1h', label: 'under 1 hr' },
            { v: '1_3h', label: '1–3 hrs' },
            { v: '3_plus', label: '3+' },
            { v: 'none_done_for_us', label: "none, it'd have to be done for us" },
          ],
          promoteTo: 'capacity',
        },
        {
          key: 'q20',
          n: 20,
          type: 'longtext',
          prompt: 'What have you already tried, and what happened?',
          hint: 'Prevents you recommending the thing that failed for them in 2024.',
        },
        {
          key: 'q21',
          n: 21,
          type: 'longtext',
          prompt: 'Is there anything paid running right now?',
          hint: 'Ads, an SEO service, a social manager, subscriptions nobody remembers.',
        },
        {
          key: 'q22',
          n: 22,
          type: 'longtext',
          prompt: 'Does anyone else have to say yes to a change like this?',
          promoteTo: 'decisionMaker',
        },
      ],
      listenFor:
        'A locked asset — a domain, a site login, or a Google profile controlled by a vendor or an ex-employee. If you hear it, it very likely becomes the recommendation regardless of everything else, because nothing else can be done until it\'s resolved.',
    },

    // ── 27–30 · Close ─────────────────────────────────────────────────────
    {
      key: 'close',
      label: 'Close',
      minutes: [27, 30],
      actions: [
        {
          key: 'close_one_thing',
          label: 'Named the one thing out loud, before hanging up',
        },
        { key: 'close_promise', label: 'Said what arrives: one page, within 48 hours' },
        { key: 'close_diy', label: 'Answered the DIY question honestly' },
        {
          key: 'close_plan',
          label: 'Mentioned the Plan — one sentence, only if it fit',
          optional: true,
        },
        { key: 'close_last_q', label: 'Asked the last question' },
      ],
      questions: [
        {
          key: 'one_thing',
          type: 'longtext',
          prompt: "If I only got to tell you one thing today, it'd be ___",
          hint: "Don't save it for the document. The value they feel in the room is what makes them open the email.",
          promoteTo: 'oneThingSaidOutLoud',
        },
        {
          key: 'q_last',
          type: 'longtext',
          prompt: 'What did I not ask about that I should have?',
          hint: 'Last question, always.',
        },
      ],
    },
  ],

  // ── Conditional modules — use only if triggered ──────────────────────────
  modules: [
    {
      key: 'no_website',
      label: 'No website yet',
      attachTo: 'trust',
      // Collapsed, not deleted — sometimes a Facebook page functions as the site.
      suppresses: ['q09', 'q10', 'q11', 'q12'],
      questions: [
        { key: 'no_website.q1', type: 'longtext', prompt: 'Where do people currently reach you?' },
        {
          key: 'no_website.q2',
          type: 'longtext',
          prompt: 'What\'s the one page that would have to exist for someone to say yes?',
        },
        {
          key: 'no_website.q3',
          type: 'longtext',
          prompt: 'What\'s the name — do you own the domain?',
        },
        {
          key: 'no_website.q4',
          type: 'longtext',
          prompt: "Is anything already published in your name that you don't control?",
        },
      ],
      recNote:
        'The recommendation here is almost always "one page, one action, this month" — not a site build.',
    },
    {
      key: 'ads',
      label: 'Ads / boosting',
      attachTo: 'choose',
      questions: [
        { key: 'ads.g1', type: 'longtext', prompt: 'Is there an offer a stranger immediately gets?' },
        { key: 'ads.g2', type: 'longtext', prompt: 'Is there a page that turns visitors into action?' },
        {
          key: 'ads.g3',
          type: 'longtext',
          prompt: 'Do you know your customer well enough to target them?',
        },
        {
          key: 'ads.g4',
          type: 'longtext',
          prompt: 'Could you tell whether a dollar spent came back?',
        },
      ],
      recNote:
        'Any "no" and the honest answer is: reach amplifies what\'s there, it doesn\'t fix it.',
    },
    {
      key: 'nonprofit',
      label: 'Nonprofit',
      attachTo: 'constraints',
      suggestFor: ['nonprofit', 'community_org'],
      questions: [
        {
          key: 'nonprofit.q1',
          type: 'longtext',
          prompt: 'Which audiences do you need online — donors, volunteers, participants, grantmakers?',
        },
        {
          key: 'nonprofit.q2',
          type: 'longtext',
          prompt: 'Does each have a path, or does the site serve only donors?',
        },
        {
          key: 'nonprofit.q3',
          type: 'longtext',
          prompt: 'Where does a gift actually happen, and is recurring offered?',
        },
      ],
      recNote: 'Do not turn this into a grants conversation.',
    },
    {
      key: 'practice',
      label: 'Professional practice',
      attachTo: 'constraints',
      suggestFor: ['independent_practice'],
      questions: [
        {
          key: 'practice.q1',
          type: 'longtext',
          prompt: 'Are you taking new clients — and is that clear online?',
        },
        { key: 'practice.q2', type: 'longtext', prompt: 'How do people book?' },
        {
          key: 'practice.q3',
          type: 'longtext',
          prompt: 'Which directories carry you, and are they current?',
        },
      ],
      recNote:
        "Watch testimonial compliance rules; don't recommend review-gathering to a clinician without checking.",
    },
    {
      key: 'products',
      label: 'Sells products',
      attachTo: 'constraints',
      suggestFor: ['ecommerce'],
      questions: [
        {
          key: 'products.q1',
          type: 'longtext',
          prompt: 'Where do people buy — your site, a marketplace, in person?',
        },
        { key: 'products.q2', type: 'longtext', prompt: 'Where do you think people drop off?' },
      ],
      recNote:
        'Resist diagnosing checkout on a 30-minute call; note it for the Plan.',
    },
  ],
};
