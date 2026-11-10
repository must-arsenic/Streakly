// The app's frame: the data opened before the first screen, light and dark, and the screens.
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";

import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { useColorScheme, View } from "react-native";

import { open } from "@/lib/db";
import { usePalette } from "@/theme/use-palette";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const scheme = useColorScheme();
  const palette = usePalette();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    open()
      .catch(() => undefined)
      .finally(() => {
        setReady(true);
        SplashScreen.hideAsync();
      });
  }, []);
  if (!ready) return null;
  return (
    <ThemeProvider value={scheme === "dark" ? DarkTheme : DefaultTheme}>
      <View testID="app-ready" style={{ flex: 1, backgroundColor: palette.bg }}>
        <Stack screenOptions={{ headerStyle: { backgroundColor: palette.bg }, headerTintColor: palette.text, contentStyle: { backgroundColor: palette.bg } }}>
          <Stack.Screen name="index" options={{ title: "A new app" }} />
          <Stack.Screen name="__test/[action]" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </View>
    </ThemeProvider>
  );
}
