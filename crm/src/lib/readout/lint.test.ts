import { describe, expect, it } from 'vitest';

import { lintReadout, type ReadoutDoc, type Evidence } from './lint.ts';

/**
 * Fixtures that are SUPPOSED to fail.
 *
 * The point of these tests is not that the lint runs — it is that each rule in
 * pulse-check-questionnaire.md actually catches the thing it exists to catch.
 * A rule with no failing fixture is a rule nobody has proven works.
 */

const evidence: Evidence = {
  answerTexts: [
    'We run food distribution and after-school programs for families in south Stockton.',
    'A grant officer asked for our website last week and I was embarrassed to send it.',
    'We reply to most enquiries within about 4 days, honestly.',
  ],
  goalInTheirWords: 'More recurring donors, and volunteers who stay past one shift.',
  capacity: '1_3h',
};

/** A clean, complete readout — the baseline every failing case mutates. */
function goodDoc(): ReadoutDoc {
  return {
    observations: [
      {
        artifact: 'the headline above your donate button',
        body: 'It names the organisation but not who it serves, so a first-time visitor has to scroll to learn what you do.',
        quoteRefs: ['q01'],
      },
      {
        artifact: 'your Google Business listing',
        body: 'It still lists the old Airport Way address, which is the first thing search returns for your name.',
        quoteRefs: ['q07'],
      },
      {
        artifact: 'the volunteer page',
        body: 'It describes the programme well but never says how to sign up, so the interest it creates has nowhere to go.',
      },
    ],
    recWhat: 'Get the domain and Google listing back under your own control.',
    recWhyFirst:
      'Everything else on this page depends on it. Until the listing is yours, corrections you make will not stick.',
    recEffort: 'A couple of phone calls and a verification postcard, over about two weeks.',
    recMode: 'diy',
    didntCover:
      'Thirty minutes buys the biggest thing, not the whole picture. If you want the full read, that is what the Digital Presence Plan is for.',
  };
}

const codes = (issues: { code: string }[]) => issues.map((i) => i.code);

describe('a clean readout', () => {
  it('passes with no blocking issues', () => {
    const result = lintReadout(goodDoc(), evidence);
    expect(result.blocking).toEqual([]);
  });

  it('stays inside the one-page budget', () => {
    expect(lintReadout(goodDoc(), evidence).charCount).toBeLessThan(2600);
  });
});

describe('no score, no grade, no letter, no percentage', () => {
  it.each([
    ['a fraction score', 'Your site scores about a 6/10 for clarity.'],
    ['a percentage', 'Roughly 40% of visitors leave without scrolling.'],
    ['a scoring word', 'I would rate your trust signals as weak.'],
    ['a letter grade', 'Overall this is a C grade for findability.'],
  ])('blocks %s', (_label, body) => {
    const doc = goodDoc();
    doc.observations[0]!.body = body;
    expect(codes(lintReadout(doc, evidence).blocking)).toContain('no_score');
  });
});

describe('no invented numbers', () => {
  it('blocks a currency figure', () => {
    const doc = goodDoc();
    doc.observations[0]!.body = 'This is costing you roughly $400 a month in missed gifts.';
    expect(codes(lintReadout(doc, evidence).blocking)).toContain('no_money');
  });

  it('warns on a number they never said', () => {
    const doc = goodDoc();
    doc.observations[2]!.body = 'About 87 people a week land here and leave again.';
    expect(codes(lintReadout(doc, evidence).warnings)).toContain('untraceable_number');
  });

  it('allows a number they did say', () => {
    const doc = goodDoc();
    // "4 days" is in evidence.answerTexts.
    doc.observations[2]!.body = 'You said you reply in about 4 days; that is the cheapest thing to change.';
    expect(codes(lintReadout(doc, evidence).warnings)).not.toContain('untraceable_number');
  });

  it('allows the offer\'s own numbers and a year', () => {
    const doc = goodDoc();
    doc.observations[2]!.body = 'The 48 hours matter here, and the listing has been wrong since 2023.';
    expect(codes(lintReadout(doc, evidence).warnings)).not.toContain('untraceable_number');
  });
});

describe('never recommend a rebuild', () => {
  it.each([
    ['rebuild', 'Rebuild the site on something you can edit yourself.'],
    ['redesign the site', 'I would redesign the site around one clear action.'],
    ['a new website', 'You need a new website before anything else works.'],
    ['start over', 'Honestly, start over from scratch.'],
  ])('blocks "%s"', (_label, recWhat) => {
    const doc = goodDoc();
    doc.recWhat = recWhat;
    expect(codes(lintReadout(doc, evidence).blocking)).toContain('no_rebuild');
  });

  it('does not block the word in an observation, only in the recommendation', () => {
    const doc = goodDoc();
    doc.observations[0]!.body = 'You mentioned a rebuild was quoted to you last year.';
    expect(codes(lintReadout(doc, evidence).blocking)).not.toContain('no_rebuild');
  });
});

describe('exactly three observations, each naming a specific thing', () => {
  it('blocks two observations', () => {
    const doc = goodDoc();
    doc.observations = doc.observations.slice(0, 2);
    expect(codes(lintReadout(doc, evidence).blocking)).toContain('observation_count');
  });

  it('blocks four observations', () => {
    const doc = goodDoc();
    doc.observations.push({ artifact: 'the footer', body: 'The copyright year is 2021.' });
    expect(codes(lintReadout(doc, evidence).blocking)).toContain('observation_count');
  });

  it('blocks an observation with no artifact', () => {
    const doc = goodDoc();
    doc.observations[1]!.artifact = '';
    expect(codes(lintReadout(doc, evidence).blocking)).toContain('observation_artifact');
  });

  it('warns when the artifact is just "your homepage"', () => {
    const doc = goodDoc();
    doc.observations[1]!.artifact = 'Your homepage';
    expect(codes(lintReadout(doc, evidence).warnings)).toContain('weak_artifact');
  });
});

describe('the Plan is mentioned once, in one place', () => {
  it('blocks the Plan in an observation', () => {
    const doc = goodDoc();
    doc.observations[0]!.body = 'The Digital Presence Plan would cover this properly.';
    expect(codes(lintReadout(doc, evidence).blocking)).toContain('plan_containment');
  });

  it('allows it in "what I didn\'t cover"', () => {
    expect(codes(lintReadout(goodDoc(), evidence).blocking)).not.toContain('plan_containment');
  });
});

describe('one page means one page', () => {
  it('blocks a readout past the two-page threshold', () => {
    const doc = goodDoc();
    doc.observations[0]!.body = 'x'.repeat(3200);
    expect(codes(lintReadout(doc, evidence).blocking)).toContain('too_long');
  });

  it('warns before it blocks', () => {
    // Pad to a known total rather than a fixed body length — the rest of the
    // document already contributes ~800 characters, and hard-coding a body
    // size here would make the test depend on the fixture's prose.
    const doc = goodDoc();
    doc.observations[0]!.body = '';
    const base = lintReadout(doc, evidence).charCount;
    doc.observations[0]!.body = 'x'.repeat(2750 - base);

    const result = lintReadout(doc, evidence);
    expect(result.charCount).toBeGreaterThan(2600);
    expect(result.charCount).toBeLessThan(3000);
    expect(codes(result.blocking)).not.toContain('too_long');
    expect(codes(result.warnings)).toContain('getting_long');
  });
});

describe('the recommendation is complete', () => {
  it.each(['recWhat', 'recWhyFirst', 'recEffort'] as const)('blocks a missing %s', (field) => {
    const doc = goodDoc();
    doc[field] = '';
    expect(codes(lintReadout(doc, evidence).blocking)).toContain('recommendation_incomplete');
  });

  it('blocks a missing DIY / bring-someone-in answer', () => {
    const doc = goodDoc();
    doc.recMode = null;
    expect(codes(lintReadout(doc, evidence).blocking)).toContain('rec_mode');
  });
});

describe('judgment warnings', () => {
  it('warns when nothing is quoted back to them', () => {
    const doc = goodDoc();
    doc.observations.forEach((o) => delete o.quoteRefs);
    expect(codes(lintReadout(doc, evidence).warnings)).toContain('no_quotes');
  });

  it('warns on a DIY recommendation for someone with no capacity', () => {
    const doc = goodDoc();
    expect(
      codes(lintReadout(doc, { ...evidence, capacity: 'none_done_for_us' }).warnings),
    ).toContain('capacity_mismatch');
  });
});
