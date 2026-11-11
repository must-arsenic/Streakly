// Settings: pick the theme, or delete all data.
import { router, useIsFocused } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Button, Confirm, Page, SaveError, Title } from "@/components/ui";
import { useApp } from "@/lib/app-state";
import { deleteAll, setTheme, type Theme } from "@/lib/store";
import { useSave } from "@/lib/use-save";
import { tokens } from "@/theme/tokens";
import { usePalette } from "@/theme/use-palette";

const themes: { value: Theme; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export default function Settings() {
  const focused = useIsFocused();
  const { settings } = useApp();
  const saver = useSave();
  const p = usePalette();
  const [asking, setAsking] = useState(false);
  if (!focused) return null;

  const wipe = async () => {
    await deleteAll();
    router.replace("/welcome");
  };

  return (
    <>
      <Page behind={asking}>
        <Title>Settings</Title>
        {saver.failed ? <SaveError onRetry={saver.retry} busy={saver.busy} /> : null}
        <View style={[styles.section, { backgroundColor: p.surface, borderColor: p.border }]}>
          <Text role="heading" aria-level={2} accessibilityRole="header" style={[styles.heading, { color: p.text }]}>
            Theme
          </Text>
          <View role="radiogroup" accessibilityLabel="Theme" style={styles.options}>
            {themes.map((t) => {
              const on = settings.theme === t.value;
              return (
                <Pressable
                  key={t.value}
                  role="radio"
                  accessibilityRole="radio"
                  accessibilityLabel={t.label}
                  accessibilityState={{ checked: on, selected: on }}
                  aria-checked={on}
                  onPress={() => !on && void saver.save(() => setTheme(t.value))}
                  style={[styles.option, { borderColor: on ? p.accent : p.controlBorder, backgroundColor: on ? p.accentSoft : p.surface }]}
                >
                  <View style={[styles.radio, { borderColor: on ? p.accent : p.controlBorder }]}>
                    {on ? <View style={[styles.radioDot, { backgroundColor: p.accent }]} /> : null}
                  </View>
                  <Text style={[styles.optionText, { color: p.text }]}>{t.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.note, { color: p.muted }]}>"System" follows your phone's light or dark setting.</Text>
        </View>
        <View style={[styles.section, { backgroundColor: p.surface, borderColor: p.border }]}>
          <Text role="heading" aria-level={2} accessibilityRole="header" style={[styles.heading, { color: p.text }]}>
            Your data
          </Text>
          <Text style={[styles.note, { color: p.muted }]}>Your habits and history are kept on this phone only.</Text>
          <View style={styles.left}>
            <Button label="Delete all data" kind="ghost" onPress={() => setAsking(true)} />
          </View>
        </View>
      </Page>
      <Confirm
        visible={asking}
        message="Delete all habits and history? This can't be undone."
        confirmLabel="Delete everything"
        busy={saver.busy}
        onCancel={() => setAsking(false)}
        onConfirm={async () => {
          await saver.save(wipe);
          setAsking(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    borderWidth: tokens.size.border,
    borderRadius: tokens.radius.surface,
    padding: tokens.space.lg,
    gap: tokens.space.md,
    marginBottom: tokens.space.lg,
  },
  heading: { fontSize: tokens.type.headline, fontWeight: "600" },
  options: { flexDirection: "row", flexWrap: "wrap", gap: tokens.space.sm },
  option: {
    flexGrow: 1,
    flexBasis: 90,
    minHeight: tokens.size.tick,
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space.sm,
    paddingHorizontal: tokens.space.md,
    borderWidth: tokens.size.border,
    borderRadius: tokens.radius.control,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: tokens.radius.pill,
    borderWidth: tokens.size.borderThick,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: { width: 10, height: 10, borderRadius: tokens.radius.pill },
  optionText: { fontSize: tokens.type.body, fontWeight: "500" },
  note: { fontSize: tokens.type.small },
  left: { alignItems: "flex-start" },
});
