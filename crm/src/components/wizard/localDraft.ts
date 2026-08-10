/**
 * Local-first draft storage.
 *
 * This is the layer that actually guarantees an interview survives. The
 * network is best-effort; localStorage is synchronous, needs no permission,
 * works offline, and survives a tab crash or an accidental close. Everything
 * typed goes here first and goes to the server second.
 */

export type AnswerMap = Record<string, { v: string | number | null; at?: string }>;
export type TrackTwoMap = Record<string, { checked?: boolean; note?: string }>;

export type Draft = {
  answers: AnswerMap;
  trackTwo: TrackTwoMap;
  /** ISO timestamp of the last local write. Compared against the server's. */
  savedAt: string;
};

const key = (id: string) => `pulse:${id}:draft`;

export function readDraft(id: string): Draft | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Draft;
    if (!parsed || typeof parsed !== 'object' || !parsed.answers) return null;
    return parsed;
  } catch {
    // A corrupt draft must never take the wizard down — the server copy is
    // still there, and a failed restore is recoverable where a crash is not.
    return null;
  }
}

export function writeDraft(id: string, draft: Omit<Draft, 'savedAt'>): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(
      key(id),
      JSON.stringify({ ...draft, savedAt: new Date().toISOString() }),
    );
  } catch {
    // Quota exceeded or Safari private mode. Nothing useful to do — the
    // in-memory state and the server are both still live.
  }
}

export function clearDraft(id: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(key(id));
  } catch {
    /* nothing to do */
  }
}

/**
 * Is the local draft newer than what the server last acknowledged?
 *
 * Used to offer a restore rather than silently merging. A silent merge the
 * facilitator did not ask for is worse than either outcome, because they
 * cannot tell which version they are looking at.
 */
export function draftIsNewer(draft: Draft | null, serverUpdatedAt: string | null): boolean {
  if (!draft) return false;
  if (!serverUpdatedAt) return true;
  // A second of slack: the two clocks are not the same clock, and a false
  // "unsaved changes" bar on every load would train you to dismiss it.
  return new Date(draft.savedAt).getTime() > new Date(serverUpdatedAt).getTime() + 1000;
}
