// Screens read their data through these hooks: every read goes through `testable()` with the
// screen's route, and is read again whenever stored data changes.
import { useCallback, useEffect, useRef, useState } from "react";

import { emptyList, findHabit, type Habit, type HabitList, loadArchived, loadList, onChange } from "./store";
import { retryRead, testable } from "./test-hooks";

export type Loaded<T> = { state: "loading" } | { state: "error" } | { state: "ready"; data: T };

function useRead<T>(route: string, read: () => Promise<T>, deps: unknown[]): [Loaded<T>, () => void] {
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
  const retry = useCallback(() => {
    retryRead(route);
    load(true);
  }, [load, route]);
  return [loaded, retry];
}

/** The habit list for a screen ("/" or "/week"). */
export function useHabitList(route: string): [Loaded<HabitList>, () => void] {
  return useRead(route, () => testable(route, emptyList, loadList), [route]);
}

/** One habit, for Edit habit: by its id, or by its name. */
export function useHabit(idOrName: string): [Loaded<Habit | null>, () => void] {
  return useRead("/habits/[id]", () => testable("/habits/[id]", null, () => findHabit(idOrName)), [idOrName]);
}

/** The archived habits, for Settings' "Archived habits" section. */
export function useArchived(): [Loaded<HabitList>, () => void] {
  return useRead("/settings/archived", () => testable("/settings/archived", emptyList, loadArchived), []);
}
