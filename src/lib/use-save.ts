// Changes that can fail: on failure the screen keeps showing the saved state, says "Couldn't save
// your change", and "Try again" runs the same change again (or, if the failure says exactly what it
// was saving, with `retry`, that). Changes made while one is saving wait their turn, in order: none
// is dropped, except tick changes waiting behind a tick that fails: those are refused, and the
// person makes them again once the failed one is resolved.
import { useCallback, useMemo, useRef, useState } from "react";

import { type FailedTick, saveTick, TickNotSaved, TickRefused } from "./store";

/** A change to try again; `tick` when it is a tick (a remembered failed one can clear it). */
export type Failed = { run: () => Promise<unknown>; tick: boolean };

type Saver = {
  failed: boolean;
  busy: boolean;
  /** `tick`: a tick change, refused if a tick before it fails while it waits. */
  save: (change: () => Promise<unknown>, options?: { tick?: boolean }) => Promise<boolean>;
  retry: () => void;
  /** Shows a change that failed earlier (before the app started again), to try again. */
  offer: (change: () => Promise<unknown>) => void;
  /** The remembered failed tick as stored now: offered, or (once it is gone) no longer shown. */
  sync: (tick: FailedTick | null) => void;
};

/** One order of saves: every screen's changes wait in it, and a failed tick refuses the ticks behind it. */
export type SaveLine = { queue: Promise<unknown>; generation: number };
export const newLine = (): SaveLine => ({ queue: Promise.resolve(), generation: 0 });

/** The app's one line: a tick waiting on Week behind a tick failing on Today is refused too. */
const appLine = newLine();

/** The queue behind `useSave`, without React; screens share `line`. */
export function saveQueue(
  setFailed: (update: (f: Failed | null) => Failed | null) => void,
  setPending: (delta: number) => void,
  line: SaveLine = newLine(),
) {
  return (change: () => Promise<unknown>, { tick = false } = {}): Promise<boolean> => {
    setPending(1);
    const mine = line.generation;
    const run = line.queue.then(async () => {
      try {
        // a tick failed while this tick waited: refused, nothing stored
        if (tick && mine !== line.generation) return false;
        await change();
        setFailed((f) => (f?.run === change ? null : f));
        return true;
      } catch (e) {
        if (e instanceof TickNotSaved) line.generation += 1;
        if (e instanceof TickNotSaved && e.cleared) {
          setFailed(() => null);
          return false;
        }
        const again = (e as { retry?: () => Promise<unknown> } | null)?.retry ?? change;
        const isTick = tick || e instanceof TickNotSaved || e instanceof TickRefused;
        setFailed(() => ({ run: again, tick: isTick }));
        return false;
      } finally {
        setPending(-1);
      }
    });
    line.queue = run.catch(() => undefined);
    return run;
  };
}

export function useSave(): Saver {
  const [failed, setFailed] = useState<Failed | null>(null);
  const [pending, setPending] = useState(0);
  const enqueue = useRef<ReturnType<typeof saveQueue> | null>(null);
  enqueue.current ??= saveQueue(
    (update) => setFailed(update),
    (delta) => setPending((n) => n + delta),
    appLine,
  );
  const save = useCallback((change: () => Promise<unknown>, options?: { tick?: boolean }) => enqueue.current!(change, options), []);
  // The banner stays (busy) until the change is saved, or refused for good.
  const retry = useCallback(() => {
    if (!failed) return;
    void save(failed.run, { tick: failed.tick });
  }, [failed, save]);
  const offer = useCallback((change: () => Promise<unknown>) => setFailed({ run: change, tick: false }), []);
  const sync = useCallback(
    (tick: FailedTick | null) =>
      setFailed((f) => (tick ? { run: () => saveTick(tick), tick: true } : f?.tick ? null : f)),
    [],
  );
  return useMemo(
    () => ({ failed: failed !== null, busy: pending > 0, save, retry, offer, sync }),
    [failed, pending, save, retry, offer, sync],
  );
}
