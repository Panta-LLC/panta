/**
 * Turn an instrument definition plus a set of enabled modules into the exact
 * list of steps the wizard renders.
 *
 * Module questions are APPENDED to the segment they belong to rather than
 * given their own step. On a live call the trigger arrives mid-sentence ("we've
 * been boosting posts on Facebook") and the flow must not jump somewhere else
 * to accommodate it.
 *
 * Suppressed questions are marked, not removed. "No website yet" says to skip
 * most of TRUST, but sometimes a Facebook page is functioning as the site and
 * you want Q10 anyway — so they collapse with a "show anyway" affordance and
 * any answer already typed into them survives.
 */
import type { InstrumentDefinition, Module, Question, Segment } from './types.ts';

export type ResolvedQuestion = Question & {
  /** Set when the question came from a module rather than the base segment. */
  moduleKey?: string;
  moduleLabel?: string;
  /** True when an enabled module suppresses this base question. */
  suppressed?: boolean;
};

export type ResolvedSegment = Omit<Segment, 'questions'> & {
  questions: ResolvedQuestion[];
  /** Modules contributing questions to this segment, for the section kicker. */
  modules: { key: string; label: string; recNote?: string }[];
};

export type ResolvedInstrument = {
  definition: InstrumentDefinition;
  segments: ResolvedSegment[];
  /** Every module, with an `enabled` flag — the wizard's toggle row. */
  moduleToggles: (Module & { enabled: boolean })[];
  /** Total minutes, for sizing the pacing bar proportionally. */
  totalMinutes: number;
};

export function resolveInstrument(
  definition: InstrumentDefinition,
  enabledKeys: readonly string[] = [],
): ResolvedInstrument {
  const enabled = new Set(enabledKeys);
  const activeModules = definition.modules.filter((m) => enabled.has(m.key));

  // Union of everything the active modules suppress. Computed once rather than
  // per question so enabling two modules that suppress the same question is
  // not order-dependent.
  const suppressed = new Set(activeModules.flatMap((m) => m.suppresses ?? []));

  const segments: ResolvedSegment[] = definition.segments.map((segment) => {
    const mine = activeModules.filter((m) => m.attachTo === segment.key);

    const base: ResolvedQuestion[] = segment.questions.map((q) =>
      suppressed.has(q.key) ? { ...q, suppressed: true } : q,
    );

    const injected: ResolvedQuestion[] = mine.flatMap((m) =>
      m.questions.map((q) => ({ ...q, moduleKey: m.key, moduleLabel: m.label })),
    );

    return {
      ...segment,
      questions: [...base, ...injected],
      modules: mine.map((m) => ({ key: m.key, label: m.label, recNote: m.recNote })),
    };
  });

  const last = definition.segments.at(-1);

  return {
    definition,
    segments,
    moduleToggles: definition.modules.map((m) => ({ ...m, enabled: enabled.has(m.key) })),
    totalMinutes: last ? last.minutes[1] : 30,
  };
}

/**
 * Modules worth suggesting for a client, as a dot on the toggle.
 *
 * Never auto-enables. A module that switches itself on will eventually put
 * four questions you did not choose in front of a client, and the facilitator
 * is the one who can hear that a "small business" is really a nonprofit.
 */
export function suggestedModules(
  definition: InstrumentDefinition,
  client: { sector?: string | null; websiteUrl?: string | null },
): string[] {
  const out = new Set<string>();

  // The strongest signal in the set: no site means most of TRUST does not apply.
  if (!client.websiteUrl) out.add('no_website');

  if (client.sector) {
    for (const m of definition.modules) {
      if (m.suggestFor?.includes(client.sector)) out.add(m.key);
    }
  }

  return [...out];
}

/** Every question across every segment, base and module alike. */
export function allQuestions(resolved: ResolvedInstrument): ResolvedQuestion[] {
  return resolved.segments.flatMap((s) => s.questions);
}

/**
 * Map answers onto the promoted capture-sheet columns.
 *
 * Driven entirely by `promoteTo` in the definition, so revising which answer
 * feeds which column is a data change, not a code change.
 */
export function promotedValues(
  resolved: ResolvedInstrument,
  answers: Record<string, { v?: unknown } | undefined>,
  prep: Record<string, { v?: unknown } | undefined> = {},
): Record<string, string | number | null> {
  const out: Record<string, string | number | null> = {};

  const take = (q: Question, source: Record<string, { v?: unknown } | undefined>) => {
    if (!q.promoteTo) return;
    const raw = source[q.key]?.v;
    if (raw === undefined || raw === null || raw === '') return;
    out[q.promoteTo] = q.type === 'number' ? Number(raw) : String(raw);
  };

  for (const q of resolved.definition.prep.fields) take(q, prep);
  for (const q of allQuestions(resolved)) take(q, answers);

  // The per-segment "— noticed" boxes. They are not questions in the
  // instrument, but they are the FIND/TRUST/CHOOSE lines on the capture sheet,
  // and they are written during the segment rather than reconstructed after.
  for (const segment of resolved.segments) {
    if (!segment.promoteNoticedTo) continue;
    const raw = answers[`noticed.${segment.key}`]?.v;
    if (raw) out[segment.promoteNoticedTo] = String(raw);
  }

  // Rail fields. These live outside any one segment because they surface
  // whenever they surface — a locked asset heard at minute 11 must not need
  // the constraints segment to be on screen to record it.
  const rail: Record<string, string> = {
    locked_assets: 'lockedAssets',
    plan_shaped: 'planShapedNotAnswered',
  };
  for (const [key, column] of Object.entries(rail)) {
    const raw = answers[key]?.v;
    if (raw) out[column] = String(raw);
  }

  return out;
}
