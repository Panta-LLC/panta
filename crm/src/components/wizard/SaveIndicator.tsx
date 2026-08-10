import { useEffect, useState } from 'react';

import type { SaveStatus } from './useAutosave.ts';

/**
 * Three states, none of which block anything.
 *
 * "Offline — saved on this device" is deliberately reassuring rather than
 * alarming, because it is true: the answers are in localStorage and will flush
 * when the connection returns. An alarming indicator mid-interview makes you
 * stop listening to the client and start looking at the tool.
 */
export function SaveIndicator({
  status,
  savedAt,
}: {
  status: SaveStatus;
  savedAt: Date | null;
}) {
  const [, tick] = useState(0);

  // Re-render so "saved 3s ago" keeps counting without the parent re-rendering
  // the whole wizard on a timer.
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 5000);
    return () => clearInterval(t);
  }, []);

  const ago = savedAt ? Math.round((Date.now() - savedAt.getTime()) / 1000) : null;

  const text =
    status === 'saving'
      ? 'Saving…'
      : status === 'offline'
        ? 'Offline — saved on this device'
        : ago == null
          ? 'Not saved yet'
          : ago < 5
            ? 'Saved'
            : ago < 60
              ? `Saved ${ago}s ago`
              : `Saved ${Math.round(ago / 60)}m ago`;

  return (
    <span className={`save save--${status}`} aria-live="polite">
      {text}
    </span>
  );
}
