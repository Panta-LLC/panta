/**
 * The readout's rules, as a pure function.
 *
 * pulse-check-questionnaire.md states these as prose ("no score, no grade, no
 * letter, no percentage"; "no invented numbers"; "never recommend a rebuild";
 * "one page means one page"). Prose rules get broken on a tired Thursday, so
 * they are enforced here instead — and enforced in a pure function so they can
 * be unit-tested against fixtures that are *supposed* to fail.
 *
 * Blocking issues prevent a readout from being marked ready. Warnings are
 * dismissible: they are judgment calls, and a tool that cannot be overruled by
 * the person who was actually on the call is a tool that gets worked around.
 */

export type Observation = { artifact?: string; body?: string; quoteRefs?: string[] };

export type ReadoutDoc = {
  observations: Observation[];
  recWhat?: string | null;
  recWhyFirst?: string | null;
  recEffort?: string | null;
  recMode?: string | null;
  didntCover?: string | null;
};

export type Evidence = {
  /** Every answer given during the call, for the traceability check. */
  answerTexts: string[];
  goalInTheirWords?: string | null;
  capacity?: string | null;
};

export type Issue = {
  code: string;
  field: string;
  message: string;
  /** The offending text, when there is a specific one to show. */
  match?: string;
};

export type LintResult = {
  blocking: Issue[];
  warnings: Issue[];
  charCount: number;
};

/** Body text that counts toward the one-page budget. */
function bodyFields(doc: ReadoutDoc): { field: string; text: string }[] {
  const out: { field: string; text: string }[] = [];
  doc.observations.forEach((o, i) => {
    if (o.artifact) out.push({ field: `observation${i + 1}.artifact`, text: o.artifact });
    if (o.body) out.push({ field: `observation${i + 1}`, text: o.body });
  });
  if (doc.recWhat) out.push({ field: 'recWhat', text: doc.recWhat });
  if (doc.recWhyFirst) out.push({ field: 'recWhyFirst', text: doc.recWhyFirst });
  if (doc.recEffort) out.push({ field: 'recEffort', text: doc.recEffort });
  if (doc.didntCover) out.push({ field: 'didntCover', text: doc.didntCover });
  return out;
}

/**
 * Letter grades are matched only next to a grading word. A bare "B" is a
 * bullet, an initial, or the start of a sentence — flagging those would make
 * the lint noise, and a noisy lint gets ignored.
 */
const SCORE_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /\b\d{1,3}\s?%/, label: 'a percentage' },
  {
    re: /\b(scores?|scored|scoring|grades?|graded|rate|rates|rating|rated|ranked|ranking|tier)\b/i,
    label: 'a scoring word',
  },
  { re: /\b\d+\s*(\/|out of)\s*\d+\b/i, label: 'an N-out-of-N score' },
  { re: /\b[A-F][+-]?\s+(grade|rating)\b/, label: 'a letter grade' },
  { re: /\b(grade|rating)\s+of\s+[A-F][+-]?\b/i, label: 'a letter grade' },
];

const REBUILD_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /\brebuild(ing)?\b/i, label: '"rebuild"' },
  { re: /\bredesign(ing)?\s+(the|your|their)\s+(site|website|homepage)\b/i, label: '"redesign the site"' },
  { re: /\b(a|an)\s+new\s+(site|website)\b/i, label: '"a new website"' },
  { re: /\bstart(ing)?\s+(over|from scratch)\b/i, label: '"start over"' },
];

/** Numbers that are always allowed because they are the offer's own language. */
const ALLOWED_NUMBERS = new Set(['48', '5', 'five', '3', 'three', '1', 'one', '2', 'two', '30']);

export function lintReadout(doc: ReadoutDoc, evidence: Evidence): LintResult {
  const blocking: Issue[] = [];
  const warnings: Issue[] = [];
  const fields = bodyFields(doc);
  const charCount = fields.reduce((n, f) => n + f.text.length, 0);

  // ── shape ──────────────────────────────────────────────────────────────
  const filled = doc.observations.filter((o) => o.body?.trim());
  if (filled.length !== 3) {
    blocking.push({
      code: 'observation_count',
      field: 'observations',
      message: `The readout is three observations — this has ${filled.length}.`,
    });
  }

  doc.observations.forEach((o, i) => {
    if (o.body?.trim() && !o.artifact?.trim()) {
      blocking.push({
        code: 'observation_artifact',
        field: `observation${i + 1}`,
        message:
          'Name the specific thing you looked at. "Your homepage" is weak; "the headline above your booking button" is an observation.',
      });
    }
  });

  for (const [field, label] of [
    ['recWhat', 'what it is'],
    ['recWhyFirst', 'why this one before the others'],
    ['recEffort', 'roughly what it takes'],
  ] as const) {
    if (!doc[field]?.trim()) {
      blocking.push({
        code: 'recommendation_incomplete',
        field,
        message: `The recommendation needs ${label}.`,
      });
    }
  }

  if (!doc.recMode) {
    blocking.push({
      code: 'rec_mode',
      field: 'recMode',
      message: 'Say plainly whether this is do-it-yourself or bring-someone-in.',
    });
  }

  // ── no score, no grade ─────────────────────────────────────────────────
  for (const { field, text } of fields) {
    for (const { re, label } of SCORE_PATTERNS) {
      const m = re.exec(text);
      if (m) {
        blocking.push({
          code: 'no_score',
          field,
          match: m[0],
          message: `Reads as ${label}. The scorecard belongs to the Plan, not the free review.`,
        });
        break;
      }
    }
  }

  // ── no rebuild, in the recommendation only ─────────────────────────────
  for (const field of ['recWhat', 'recWhyFirst', 'recEffort'] as const) {
    const text = doc[field];
    if (!text) continue;
    for (const { re, label } of REBUILD_PATTERNS) {
      const m = re.exec(text);
      if (m) {
        blocking.push({
          code: 'no_rebuild',
          field,
          match: m[0],
          message: `${label} is not actionable inside 48 hours and reads as the sales move it would be. Name the next decision instead.`,
        });
        break;
      }
    }
  }

  // ── no invented numbers ────────────────────────────────────────────────
  // A currency figure is always invented here: you do not have their
  // conversion data, so the estimate would be theater.
  for (const { field, text } of fields) {
    const m = /[$£€]\s?\d/.exec(text);
    if (m) {
      blocking.push({
        code: 'no_money',
        field,
        match: m[0],
        message:
          'No invented figures. Describe the mechanism, not a number you cannot support.',
      });
    }
  }

  /**
   * Traceability: any number in the readout should be one they said.
   *
   * Everything they told you is concatenated and searched for each number the
   * document uses. This is what makes "no invented numbers" enforceable rather
   * than aspirational — it catches "40% of visitors" when nobody ever said 40.
   */
  const haystack = [
    ...evidence.answerTexts,
    evidence.goalInTheirWords ?? '',
  ]
    .join(' ')
    .toLowerCase();

  for (const { field, text } of fields) {
    for (const raw of text.match(/\b\d+(?:\.\d+)?\b/g) ?? []) {
      if (ALLOWED_NUMBERS.has(raw)) continue;
      // Years read as context, not as claims.
      if (/^(19|20)\d{2}$/.test(raw)) continue;
      if (haystack.includes(raw)) continue;

      warnings.push({
        code: 'untraceable_number',
        field,
        match: raw,
        message: `"${raw}" does not appear anywhere in what they told you.`,
      });
    }
  }

  // ── the Plan is named once, in one place ───────────────────────────────
  const planRe = /\b(the\s+)?(digital\s+presence\s+)?plan\b/i;
  for (const { field, text } of fields) {
    if (field === 'didntCover') continue;
    const m = planRe.exec(text);
    if (m) {
      blocking.push({
        code: 'plan_containment',
        field,
        match: m[0],
        message:
          'The Plan is mentioned only in "What I didn\'t cover", and as an option rather than a close.',
      });
    }
  }

  // ── one page means one page ────────────────────────────────────────────
  // Derived from Letter at 0.9in margins, Spectral 11pt/1.55: roughly 2,700
  // characters of body before the third section runs onto a second page.
  if (charCount > 3000) {
    blocking.push({
      code: 'too_long',
      field: 'document',
      message: `${charCount} characters. Past about 3,000 this runs to two pages, and two pages is writing the Plan for free.`,
    });
  } else if (charCount > 2600) {
    warnings.push({
      code: 'getting_long',
      field: 'document',
      message: `${charCount} characters — close to a second page. Check the print preview.`,
    });
  }

  // ── their words, not yours ─────────────────────────────────────────────
  const quoted = doc.observations.some((o) => o.quoteRefs?.length);
  if (!quoted) {
    warnings.push({
      code: 'no_quotes',
      field: 'observations',
      message:
        'Nothing is quoted back to them. Their own words are what make the recommendation feel like theirs.',
    });
  }

  // A weak observation names no specific thing.
  doc.observations.forEach((o, i) => {
    if (!o.artifact) return;
    if (/^(your\s+)?(website|homepage|site|web\s?site)\.?$/i.test(o.artifact.trim())) {
      warnings.push({
        code: 'weak_artifact',
        field: `observation${i + 1}.artifact`,
        match: o.artifact,
        message:
          '"Your homepage" is weak. Which part of it — the headline, the button, the first paragraph?',
      });
    }
  });

  // A do-it-yourself recommendation given to someone with no time is not a
  // recommendation. Warning, not blocking: "it is a 20-minute fix, here is
  // how" is sometimes exactly right.
  if (doc.recMode === 'diy' && evidence.capacity === 'none_done_for_us') {
    warnings.push({
      code: 'capacity_mismatch',
      field: 'recMode',
      message:
        'They said they have no time and it would have to be done for them. A DIY recommendation is not one they can act on.',
    });
  }

  return { blocking, warnings, charCount };
}
