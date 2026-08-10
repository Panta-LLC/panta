/**
 * The priority ladder for choosing the single recommendation.
 *
 * pulse-check-questionnaire.md is explicit that this is picked "by rule, not by
 * feel", and gives four ordinal rules. This module derives *candidates* for
 * each rule from what was captured, and shows the evidence behind each one.
 *
 * It does not choose. The choice is the whole product, and a tool that made it
 * automatically would be pretending to a judgment it cannot make — it did not
 * hear the call.
 */

export type Candidate = {
  rule: 1 | 2 | 3 | 4;
  label: string;
  /** Where in the capture sheet this came from, shown alongside. */
  evidence: string;
};

export type LadderInput = {
  lockedAssets?: string | null;
  findNoticed?: string | null;
  trustNoticed?: string | null;
  chooseNoticed?: string | null;
  stepsToContact?: number | null;
  honestReplyTime?: string | null;
  triggerText?: string | null;
  capacity?: string | null;
  oneThingSaidOutLoud?: string | null;
};

export const RULES: Record<1 | 2 | 3 | 4, { title: string; note: string }> = {
  1: {
    title: 'Blocker first',
    note: 'A locked domain, an inaccessible profile, wrong information published, a broken contact path — anything that makes other work impossible outranks everything else.',
  },
  2: {
    title: 'The biggest gap between what is true and what is visible',
    note: 'They have the proof, the credential, the result — and a stranger cannot see it. Cheapest distance between where they are and where they want to be.',
  },
  3: {
    title: 'The leak they can actually plug',
    note: 'A recommendation that needs a team they do not have is not a recommendation.',
  },
  4: {
    title: 'Break ties with the trigger',
    note: 'Two candidates of equal weight: pick the one that touches the reason they booked.',
  },
};

export const CAPACITY_LABELS: Record<string, string> = {
  under_1h: 'under 1 hr a week',
  '1_3h': '1–3 hrs a week',
  '3_plus': '3+ hrs a week',
  none_done_for_us: 'no time — it would have to be done for them',
};

export function deriveCandidates(input: LadderInput): Candidate[] {
  const out: Candidate[] = [];

  // Rule 1 — blockers. The questionnaire is emphatic that a locked asset "very
  // likely becomes the recommendation regardless of everything else".
  if (input.lockedAssets?.trim() && !/^none\.?$/i.test(input.lockedAssets.trim())) {
    out.push({
      rule: 1,
      label: `Locked asset: ${truncate(input.lockedAssets, 90)}`,
      evidence: 'Captured during the call as a locked asset.',
    });
  }

  if (typeof input.stepsToContact === 'number' && input.stepsToContact >= 4) {
    out.push({
      rule: 1,
      label: `Contact path is ${input.stepsToContact} clicks deep`,
      evidence: `You counted ${input.stepsToContact} clicks from homepage to submitted.`,
    });
  }

  // Rule 2 — true but not visible. This is what the TRUST segment records.
  if (input.trustNoticed?.trim()) {
    out.push({
      rule: 2,
      label: truncate(input.trustNoticed, 90),
      evidence: 'TRUST — noticed.',
    });
  }
  if (input.findNoticed?.trim()) {
    out.push({
      rule: 2,
      label: truncate(input.findNoticed, 90),
      evidence: 'FIND — noticed.',
    });
  }

  // Rule 3 — pluggable leaks. Response time is called out in the source as
  // "the cheapest fix in the whole practice".
  if (input.honestReplyTime?.trim()) {
    out.push({
      rule: 3,
      label: `Reply time: ${truncate(input.honestReplyTime, 70)}`,
      evidence: 'Their honest answer to how fast they reply.',
    });
  }
  if (input.chooseNoticed?.trim()) {
    out.push({
      rule: 3,
      label: truncate(input.chooseNoticed, 90),
      evidence: 'CHOOSE — noticed.',
    });
  }

  // What you already said out loud is the strongest candidate of all — the
  // document should not contradict the call.
  if (input.oneThingSaidOutLoud?.trim()) {
    out.unshift({
      rule: 1,
      label: `You already said: ${truncate(input.oneThingSaidOutLoud, 80)}`,
      evidence:
        'Named out loud on the call. The readout should not quietly disagree with what they already heard.',
    });
  }

  return out;
}

function truncate(s: string, n: number): string {
  const t = s.trim().replace(/\s+/g, ' ');
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
}
