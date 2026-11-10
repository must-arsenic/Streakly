// A change that can fail: on failure the screen keeps showing the saved state, says "Couldn't save
// your change", and "Try again" runs the same change again.
import { useCallback, useRef, useState } from "react";

export function useSave(): { failed: boolean; busy: boolean; save: (change: () => Promise<unknown>) => Promise<boolean>; retry: () => void } {
  const [failed, setFailed] = useState<(() => Promise<unknown>) | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const save = useCallback(async (change: () => Promise<unknown>) => {
    if (busyRef.current) return false;
    busyRef.current = true;
    setBusy(true);
    try {
      await change();
      setFailed(null);
      return true;
    } catch {
      setFailed(() => change);
      return false;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, []);
  const retry = useCallback(() => {
    if (failed) void save(failed);
  }, [failed, save]);
  return { failed: failed !== null, busy, save, retry };
}
