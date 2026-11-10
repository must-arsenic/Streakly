// The app's frame: the data opened before the first screen, the chosen theme, and the screens.
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Platform, View } from "react-native";

import { AppProvider } from "@/lib/app-state";
import { open } from "@/lib/db";
import { tokens } from "@/theme/tokens";
import { ThemeChoice, usePalette, useScheme } from "@/theme/use-palette";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
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
    <AppProvider>
      {({ settings, loaded }) =>
        loaded ? (
          <ThemeChoice.Provider value={settings.theme}>
            <Frame />
          </ThemeChoice.Provider>
        ) : null
      }
    </AppProvider>
  );
}

function Frame() {
  const scheme = useScheme();
  const palette = usePalette();
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    document.documentElement.dataset.theme = scheme;
    document.documentElement.style.colorScheme = scheme;
    document.body.style.backgroundColor = palette.bg;
  }, [scheme, palette.bg]);
  const base = scheme === "dark" ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: { ...base.colors, background: palette.bg, card: palette.surface, text: palette.text, border: palette.border, primary: palette.accent },
  };
  return (
    <ThemeProvider value={navTheme}>
      <View testID="app-ready" style={{ flex: 1, backgroundColor: palette.bg }}>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: palette.bg },
            headerTintColor: palette.text,
            headerTitleStyle: { fontSize: tokens.type.headline, fontWeight: "600" },
            headerShadowVisible: false,
            headerBackButtonDisplayMode: "minimal",
            contentStyle: { backgroundColor: palette.bg },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false, title: "Streakly" }} />
          <Stack.Screen name="habits/new" options={{ title: "Add habit" }} />
          <Stack.Screen name="habits/[id]" options={{ title: "Edit habit" }} />
          <Stack.Screen name="welcome" options={{ headerShown: false, title: "Welcome to Streakly" }} />
          <Stack.Screen name="__test/[action]" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      </View>
    </ThemeProvider>
  );
}
