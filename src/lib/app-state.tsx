// What every screen shares: the stored settings (theme, guide finished) and today's date.
import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";

import type { Day } from "./days";
import { defaultSettings, loadSettings, onChange, type Settings } from "./store";
import { retryRead, testable } from "./test-hooks";
import { useToday } from "./use-today";

/** "error" only when the settings were never read: a failed re-read keeps the last ones. */
type Status = "loading" | "error" | "ready";
type AppState = { settings: Settings; status: Status; today: Day; retry: () => void };

const AppContext = createContext<AppState>({ settings: defaultSettings, status: "loading", today: "", retry: () => undefined });

export function AppProvider({ children }: { children: (state: AppState) => ReactNode }) {
  const today = useToday();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [status, setStatus] = useState<Status>("loading");
  const read = useRef(false);
  const load = useCallback(() => {
    testable("app", defaultSettings, loadSettings).then(
      (s) => {
        read.current = true;
        setSettings(s);
        setStatus("ready");
      },
      () => setStatus(read.current ? "ready" : "error"),
    );
  }, []);
  useEffect(() => {
    load();
    return onChange(() => load());
  }, [load]);
  const retry = useCallback(() => {
    retryRead("app");
    setStatus("loading");
    load();
  }, [load]);
  const state = { settings, status, today, retry };
  return <AppContext.Provider value={state}>{children(state)}</AppContext.Provider>;
}

export function useApp(): AppState {
  return useContext(AppContext);
}
