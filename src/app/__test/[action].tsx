// A test hook, opened as a deep link by the engine's tests; without the hooks switched on it is
// the not-found screen.
import { Redirect, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Text } from "react-native";

import { act, hooksOn } from "@/lib/test-hooks";

export default function TestHook() {
  const { action, ...params } = useLocalSearchParams<{ action: string; name?: string; email?: string; route?: string; mode?: string }>();
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (hooksOn()) act(String(action), params).finally(() => setDone(true));
  }, [action]);
  if (!hooksOn()) return <Text>This screen doesn't exist.</Text>;
  return done ? <Redirect href="/" /> : null;
}
