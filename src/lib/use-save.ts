// Changes that can fail: on failure the screen keeps showing the saved state, says "Couldn't save
// your change", and "Try again" runs the same change again. Changes made while one is saving wait
// their turn, in order: none is dropped.
import { useCallback, useRef, useState } from "react";

export function useSave(): { failed: boolean; busy: boolean; save: (change: () => Promise<unknown>) => Promise<boolean>; retry: () => void } {
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
      } catch {
        setFailed(() => change);
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
  return { failed: failed !== null, busy: pending > 0, save, retry };
}
