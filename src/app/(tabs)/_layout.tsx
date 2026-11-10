// The bottom tab bar: Today, Week and Settings. The first-run guide shows first until finished.
import { Redirect, Tabs } from "expo-router";

import { SettingsIcon, TodayIcon, WeekIcon } from "@/components/icons";
import { useApp } from "@/lib/app-state";
import { tokens } from "@/theme/tokens";
import { usePalette } from "@/theme/use-palette";

export default function TabsLayout() {
  const { settings } = useApp();
  const p = usePalette();
  if (!settings.guideDone) return <Redirect href="/welcome" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: p.accent,
        tabBarInactiveTintColor: p.muted,
        tabBarStyle: { backgroundColor: p.surface, borderTopColor: p.border, minHeight: tokens.size.tabBar },
        tabBarLabelStyle: { fontSize: tokens.type.caption, fontWeight: "500" },
        sceneStyle: { backgroundColor: p.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Today", tabBarIcon: ({ color }) => <TodayIcon colour={String(color)} /> }} />
      <Tabs.Screen name="week" options={{ title: "Week", tabBarIcon: ({ color }) => <WeekIcon colour={String(color)} /> }} />
      <Tabs.Screen name="settings" options={{ title: "Settings", tabBarIcon: ({ color }) => <SettingsIcon colour={String(color)} /> }} />
    </Tabs>
  );
}
