// Today's date, worked out again at local midnight and whenever the app comes back to the
// foreground (and checked every few seconds, in case the clock jumped).
import { useEffect, useState } from "react";
import { AppState, Platform } from "react-native";

import { type Day, msToMidnight, today } from "./days";

export function useToday(): Day {
  const [day, setDay] = useState(today);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = () => setDay((old) => (old === today() ? old : today()));
    const arm = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        check();
        arm();
      }, msToMidnight() + 50);
    };
    const wake = () => {
      check();
      arm();
    };
    arm();
    const poll = setInterval(check, 5000);
    const sub = AppState.addEventListener("change", (state) => state === "active" && wake());
    const doc = Platform.OS === "web" && typeof document !== "undefined" ? document : undefined;
    const onVisible = () => doc?.visibilityState !== "hidden" && wake();
    doc?.addEventListener("visibilitychange", onVisible);
    if (typeof window !== "undefined" && Platform.OS === "web") {
      window.addEventListener("focus", wake);
      window.addEventListener("pageshow", wake);
    }
    return () => {
      if (timer) clearTimeout(timer);
      clearInterval(poll);
      sub.remove();
      doc?.removeEventListener("visibilitychange", onVisible);
      if (typeof window !== "undefined" && Platform.OS === "web") {
        window.removeEventListener("focus", wake);
        window.removeEventListener("pageshow", wake);
      }
    };
  }, []);
  return day;
}
