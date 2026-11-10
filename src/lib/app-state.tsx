// What every screen shares: the stored settings (theme, guide finished) and today's date.
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";

import type { Day } from "./days";
import { defaultSettings, loadSettings, onChange, type Settings } from "./store";
import { testable } from "./test-hooks";
import { useToday } from "./use-today";

type AppState = { settings: Settings; loaded: boolean; today: Day };

const AppContext = createContext<AppState>({ settings: defaultSettings, loaded: false, today: "" });

export function AppProvider({ children }: { children: (state: AppState) => ReactNode }) {
  const today = useToday();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);
  const load = useCallback(() => {
    testable("app", defaultSettings, loadSettings)
      .then(setSettings, () => undefined)
      .finally(() => setLoaded(true));
  }, []);
  useEffect(() => {
    load();
    return onChange(load);
  }, [load]);
  const state = { settings, loaded, today };
  return <AppContext.Provider value={state}>{children(state)}</AppContext.Provider>;
}

export function useApp(): AppState {
  return useContext(AppContext);
}
