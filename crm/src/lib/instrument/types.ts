/**
 * Shape of a Pulse Check instrument definition.
 *
 * The definition is stored as JSONB in `instruments.definition` and pinned per
 * interview, so these types describe data that outlives any one version of the
 * app. Add fields optionally; never repurpose an existing key's meaning, or a
 * two-year-old interview will render as something it was not.
 */

/** The only closed-answer question in the instrument is Q19 (capacity). */
export type QuestionType = 'longtext' | 'text' | 'choice' | 'number';

export type QuestionOption = { v: string; label: string };

export type Question = {
  /** Stable key. Also the key inside `pulse_checks.answers`. Never reused. */
  key: string;
  /** The number as printed in the questionnaire. Absent for module questions. */
  n?: number;
  type: QuestionType;
  prompt: string;
  /** The parenthetical facilitator aside from the source document. */
  hint?: string;
  options?: QuestionOption[];
  /**
   * Name of a promoted `pulse_checks` column this answer pre-fills on the
   * capture sheet. Keeping the mapping in the definition rather than in app
   * code means revising the instrument does not require a code change.
   */
  promoteTo?: string;
  widget?: 'stopwatch';
  /** Prep-only: becomes read-only the moment the call starts. */
  lockOnCallStart?: boolean;
};

/** A "looking at their site while they talk" prompt. Checkbox + optional note. */
export type TrackTwoPrompt = { key: string; prompt: string };

/** Close-segment items are actions taken, not questions asked. */
export type CloseAction = { key: string; label: string; optional?: boolean };

export type Segment = {
  key: string;
  label: string;
  /** [startMinute, endMinute] from the questionnaire's time map. */
  minutes: [number, number];
  /** The scripted opener, shown but never required. */
  opener?: string;
  questions: Question[];
  trackTwo?: TrackTwoPrompt[];
  listenFor?: string;
  actions?: CloseAction[];
  /** Column the segment's "— noticed" box writes into. */
  promoteNoticedTo?: string;
  /** Extra guidance rendered under the segment heading. */
  note?: string;
};

export type Module = {
  key: string;
  label: string;
  /** Segment key whose question list this module appends to. */
  attachTo: string;
  /** Question keys this module collapses (not deletes) when enabled. */
  suppresses?: string[];
  questions: Question[];
  /** Guidance shown on the readout composer when this module was active. */
  recNote?: string;
  /**
   * Client sector values that make this module worth suggesting. A suggestion
   * is a dot on the toggle — never an automatic enable.
   */
  suggestFor?: string[];
};

export type PrepDefinition = {
  items: { key: string; label: string }[];
  fields: Question[];
};

export type InstrumentDefinition = {
  key: string;
  version: number;
  label: string;
  /** What the call owes the client. Rendered at the top of the composer. */
  owes: string;
  prep: PrepDefinition;
  segments: Segment[];
  modules: Module[];
};
