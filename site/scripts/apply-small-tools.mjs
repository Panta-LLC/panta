/**
 * journey-redesign.md §3 and §4 — Custom Software gets a home.
 *
 *   node scripts/apply-small-tools.mjs            # dry run
 *   node scripts/apply-small-tools.mjs --apply    # writes
 *
 * Split out of apply-journey-redesign.mjs rather than folded into it because it
 * depends on a Studio schema field that batch does not touch (`pivotAnchor`),
 * and because it is the one edit that MOVES an offer rather than rewording one.
 *
 * The problem it fixes: "Custom Software" was a homepage package card with no
 * service reference and no page, so packageHref() returned null and the card
 * rendered as unlinked text — an offer the site named five times and could not
 * be reached from. §4 puts it on the Operations page as a named section rather
 * than giving it a page of its own: "if it starts generating its own inquiries,
 * promote it."
 *
 * It lands in the Operations service's pivot band, which is empty on that
 * document and is exactly the shape this needs — a titled band with a checklist
 * and one CTA. The `pivotAnchor` is what makes the homepage card's
 * /services/operations/#small-tools land on it.
 *
 * RUN apply-journey-redesign.mjs FIRST: that batch sets
 * `packageOffer.anchor = 'small-tools'` on the card, and a card pointing at an
 * anchor that does not exist yet scrolls silently to the top of the page.
 */
import { run } from './lib/apply-edits.mjs';

const card = (key, title, body) => ({_key: key, _type: 'labeledCard', title, body});

await run({
  name: 'journey-redesign.md — Custom Software → Operations §small-tools',

  sets: [
    ['service-operations', 'pivotAnchor', undefined, 'small-tools'],
    ['service-operations', 'pivotLabel', undefined, 'Small tools'],
    [
      'service-operations',
      'pivotTitle',
      undefined,
      'Small tools, when nothing off the shelf fits.',
    ],
    [
      'service-operations',
      'pivotLede',
      undefined,
      'Most of the time the answer is a tool you already pay for, set up properly. Sometimes it isn’t — and the thing you need is small, specific, and does not exist. We build that.',
    ],
    [
      'service-operations',
      'pivotIntro',
      undefined,
      'Usually it is something like an intake form that writes straight to the spreadsheet you already use, so nobody has to retype anything. Small enough to finish, boring enough to trust.',
    ],
    [
      'service-operations',
      'pivotChecklist',
      undefined,
      [
        card(
          'st-build',
          'We help you decide whether to build at all',
          'Buying beats building most of the time, and we will say so. Building is worth it when the off-the-shelf option costs more in workarounds than it saves.',
        ),
        card(
          'st-scope',
          'A scope small enough to land',
          'One workflow, one problem, a fixed price. Not a platform — the software equivalent of a good shelf.',
        ),
        card(
          'st-handover',
          'Documentation and training, so it gets used',
          'A tool nobody knows how to use is a tool you paid for once and abandoned. Handover is part of the build, not an upsell.',
        ),
        card(
          'st-ownership',
          'Ownership and support, in writing',
          'It is yours — the code, the accounts, the data. We make sure it works and support it on whatever terms we agree, and you are not locked into us to keep it running.',
        ),
      ],
    ],
    // The quote door, not the review: someone reading a section about building a
    // small specific tool has usually already decided they need one. `need`
    // preselects the dropdown on the quote form.
    ['service-operations', 'pivotCtaLabel', undefined, 'Send a brief for a quote'],
    ['service-operations', 'pivotCtaHref', undefined, '/quote/?need=small-tool'],
  ],
});
