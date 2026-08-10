import { useEffect, useRef, useState } from 'react';

/**
 * Elapsed seconds since the call started, anchored to the server's clock.
 *
 * The naive version — `useState(0)` counting up — is wrong in three ways that
 * all show up on a real call: a page refresh restarts it at zero, a laptop
 * sleeping pauses it, and opening the run screen on a second device shows a
 * different time. Deriving from a server `startedAt` plus a clock offset makes
 * all three correct.
 *
 * The offset must be measured ONCE, at mount. Recomputing it per tick makes
 * `now` resolve to the same instant every time, and the clock sits frozen at
 * whatever it read on first paint.
 */
export function useElapsed(startedAt: string | null, serverNow: string | null) {
  // Difference between this browser's clock and the server's, sampled at
  // mount. Usually milliseconds; occasionally minutes on a machine whose clock
  // has drifted, which is the case this exists to correct.
  const skew = useRef<number | null>(null);
  if (skew.current === null) {
    skew.current = serverNow ? Date.now() - new Date(serverNow).getTime() : 0;
  }

  const [seconds, setSeconds] = useState(() => compute(startedAt, skew.current!));

  useEffect(() => {
    if (!startedAt) {
      setSeconds(0);
      return;
    }

    setSeconds(compute(startedAt, skew.current!));
    const t = setInterval(() => setSeconds(compute(startedAt, skew.current!)), 1000);
    return () => clearInterval(t);
  }, [startedAt]);

  return seconds;
}

function compute(startedAt: string | null, skewMs: number): number {
  if (!startedAt) return 0;
  const serverTimeNow = Date.now() - skewMs;
  return Math.max(0, Math.floor((serverTimeNow - new Date(startedAt).getTime()) / 1000));
}
