// The app's frame: the data opened before the first screen, the chosen theme, and the screens.
import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import { BackIcon } from "@/components/icons";
import { Loading, LoadError } from "@/components/ui";

import { AppProvider } from "@/lib/app-state";
import { open } from "@/lib/db";
import { loadHookState } from "@/lib/test-hooks";
import { tokens } from "@/theme/tokens";
import { ThemeChoice, usePalette, useScheme } from "@/theme/use-palette";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    open()
      .then(loadHookState)
      .catch(() => undefined)
      .finally(() => {
        setReady(true);
        SplashScreen.hideAsync();
      });
  }, []);
  if (!ready) return <Starting />;
  return (
    <AppProvider>
      {({ settings, status, retry }) =>
        status === "loading" ? (
          <Starting />
        ) : (
          <ThemeChoice.Provider value={settings.theme}>
            {status === "error" ? <CantLoad onRetry={retry} /> : <Frame />}
          </ThemeChoice.Provider>
        )
      }
    </AppProvider>
  );
}

/** Stored data is still being read (the phone's light or dark until the theme is known). */
function Starting() {
  const palette = usePalette();
  return (
    <View style={[styles.cantLoad, { backgroundColor: palette.bg }]}>
      <Loading />
    </View>
  );
}

/** The stored settings couldn't be read: never guess (the guide would show), offer a retry. */
function CantLoad({ onRetry }: { onRetry: () => void }) {
  const palette = usePalette();
  return (
    <View testID="app-ready" style={[styles.cantLoad, { backgroundColor: palette.bg }]}>
      <LoadError onRetry={onRetry} />
    </View>
  );
}

function Frame() {
  const scheme = useScheme();
  const palette = usePalette();
  // A test hook's page isn't ready until the hook has run and moved on.
  const hooking = usePathname().startsWith("/__test");
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
      <View testID={hooking ? "app-hook" : "app-ready"} style={{ flex: 1, backgroundColor: palette.bg }}>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: palette.bg },
            headerTintColor: palette.text,
            headerTitleStyle: { fontSize: tokens.type.headline, fontWeight: "600" },
            headerShadowVisible: false,
            headerBackButtonDisplayMode: "minimal",
            headerLeft: () => (
              <Pressable
                role="button"
                accessibilityRole="button"
                accessibilityLabel="Back"
                onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
                style={styles.back}
              >
                <BackIcon colour={palette.text} />
              </Pressable>
            ),
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

const styles = StyleSheet.create({
  cantLoad: { flex: 1, justifyContent: "center" },
  back: { width: tokens.size.tick, height: tokens.size.tick, alignItems: "center", justifyContent: "center" },
});
