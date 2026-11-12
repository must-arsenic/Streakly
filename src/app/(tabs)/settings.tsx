// Settings: pick the theme, restore archived habits, or delete all data.
import { router, useIsFocused } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Button, Confirm, Loading, LoadError, Page, SaveError, Title } from "@/components/ui";
import { useApp } from "@/lib/app-state";
import { deleteAll, restoreHabit, setTheme, type Theme } from "@/lib/store";
import { best } from "@/lib/streaks";
import { useArchived } from "@/lib/use-data";
import { useSave } from "@/lib/use-save";
import { tokens } from "@/theme/tokens";
import { useHabitColours, usePalette } from "@/theme/use-palette";

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
        {/* Restored: it leaves this list and Today and Week show it again; Settings stays in view. */}
        <Archived onRestore={(id) => void saver.save(() => restoreHabit(id))} />
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

/** The "Archived habits" section: the most recently archived first, each with "Restore" (no delete). */
function Archived({ onRestore }: { onRestore: (id: number) => void }) {
  const p = usePalette();
  const colours = useHabitColours();
  const [archived, retry] = useArchived();
  let body;
  if (archived.state === "loading") body = <Loading label="Loading archived habits…" />;
  else if (archived.state === "error") body = <LoadError onRetry={retry} label="Couldn't load archived habits" />;
  else if (archived.data.habits.length === 0) body = <Text style={[styles.note, { color: p.muted }]}>No archived habits</Text>;
  else {
    const { habits, ticks } = archived.data;
    body = (
      <View role="list" accessibilityLabel="Archived habits" style={styles.archived}>
        {habits.map((h) => (
          <View key={h.id} role="listitem" testID={`archived-${h.id}`} style={[styles.archivedRow, { borderColor: p.border }]}>
            <View
              role="img"
              accessibilityLabel={tokens.habit.names[h.colour]}
              aria-label={tokens.habit.names[h.colour]}
              testID={`archived-colour-${h.id}`}
              style={[styles.dot, { backgroundColor: colours[h.colour] ?? p.accent }]}
            />
            <View style={styles.archivedText}>
              <Text numberOfLines={1} style={[styles.archivedName, { color: p.text }]}>
                {h.name}
              </Text>
              <Text style={[styles.note, { color: p.muted }]}>{`Best: ${best(ticks[h.id] ?? [])}`}</Text>
            </View>
            <Button label="Restore" kind="secondary" onPress={() => onRestore(h.id)} />
          </View>
        ))}
      </View>
    );
  }
  return (
    <View style={[styles.section, { backgroundColor: p.surface, borderColor: p.border }]}>
      <Text role="heading" aria-level={2} accessibilityRole="header" style={[styles.heading, { color: p.text }]}>
        Archived habits
      </Text>
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  archived: { gap: tokens.space.sm },
  archivedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space.md,
    borderTopWidth: tokens.size.border,
    paddingTop: tokens.space.sm,
  },
  dot: { width: tokens.space.md, height: tokens.space.md, borderRadius: tokens.radius.pill },
  archivedText: { flex: 1, minWidth: 0 },
  archivedName: { fontSize: tokens.type.body, fontWeight: "600" },
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
