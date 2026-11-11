// Changes that can fail: on failure the screen keeps showing the saved state, says "Couldn't save
// your change", and "Try again" runs the same change again (or, if the failure says exactly what it
// was saving, with `retry`, that). Changes made while one is saving wait their turn, in order: none
// is dropped.
import { useCallback, useRef, useState } from "react";

type Saver = {
  failed: boolean;
  busy: boolean;
  save: (change: () => Promise<unknown>) => Promise<boolean>;
  retry: () => void;
  /** Shows a change that failed earlier (before the app started again), to try again. */
  offer: (change: () => Promise<unknown>) => void;
};

export function useSave(): Saver {
  const [failed, setFailed] = useState<(() => Promise<unknown>) | null>(null);
  const [pending, setPending] = useState(0);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const save = useCallback((change: () => Promise<unknown>) => {
    setPending((n) => n + 1);
    const run = queue.current.then(async () => {
      try {
        await change();
        setFailed((f) => (f === change ? null : f));
        return true;
      } catch (e) {
        const again = (e as { retry?: () => Promise<unknown> } | null)?.retry ?? change;
        setFailed(() => again);
        return false;
      } finally {
        setPending((n) => n - 1);
      }
    });
    queue.current = run;
    return run;
  }, []);
  const retry = useCallback(() => {
    if (!failed) return;
    const change = failed;
    setFailed(null);
    void save(change);
  }, [failed, save]);
  const offer = useCallback((change: () => Promise<unknown>) => setFailed(() => change), []);
  return { failed: failed !== null, busy: pending > 0, save, retry, offer };
}
