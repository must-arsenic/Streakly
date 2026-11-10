// Screens read their data through these hooks: every read goes through `testable()` with the
// screen's route, and is read again whenever stored data changes.
import { useCallback, useEffect, useRef, useState } from "react";

import { emptyList, type Habit, type HabitList, loadHabit, loadList, onChange } from "./store";
import { testable } from "./test-hooks";

export type Loaded<T> = { state: "loading" } | { state: "error" } | { state: "ready"; data: T };

function useRead<T>(read: () => Promise<T>, deps: unknown[]): [Loaded<T>, () => void] {
  const [loaded, setLoaded] = useState<Loaded<T>>({ state: "loading" });
  const run = useRef(0);
  const load = useCallback((showLoading: boolean) => {
    const mine = (run.current += 1);
    if (showLoading) setLoaded({ state: "loading" });
    read().then(
      (data) => mine === run.current && setLoaded({ state: "ready", data }),
      () => mine === run.current && setLoaded({ state: "error" }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => {
    load(true);
    return onChange((fresh) => load(fresh));
  }, [load]);
  const retry = useCallback(() => load(true), [load]);
  return [loaded, retry];
}

/** The habit list for a screen ("/" or "/week"). */
export function useHabitList(route: string): [Loaded<HabitList>, () => void] {
  return useRead(() => testable(route, emptyList, loadList), [route]);
}

/** One habit, for Edit habit. */
export function useHabit(id: number): [Loaded<Habit | null>, () => void] {
  return useRead(() => testable("/habits/[id]", null, () => loadHabit(id)), [id]);
}
