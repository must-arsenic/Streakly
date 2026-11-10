// Today: tick each habit for today and see its streaks; long-press and drag to reorder; "+" adds
// a habit and tapping a name edits it.
import { router, useIsFocused } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { CheckMark, PlusIcon } from "@/components/icons";
import { ReorderList } from "@/components/reorder-list";
import { Empty, Loading, LoadError, Page, SaveError, Title } from "@/components/ui";
import { useApp } from "@/lib/app-state";
import { longDate } from "@/lib/days";
import { type Habit, reorder, setTick } from "@/lib/store";
import { best, current } from "@/lib/streaks";
import { useHabitList } from "@/lib/use-data";
import { useSave } from "@/lib/use-save";
import { tokens } from "@/theme/tokens";
import { useHabitColours, usePalette } from "@/theme/use-palette";

export default function Today() {
  const focused = useIsFocused();
  const { today } = useApp();
  const [list, retryLoad] = useHabitList("/");
  const saver = useSave();
  const p = usePalette();
  if (!focused) return null;

  const add = () => router.push("/habits/new");
  let body;
  let summary: string | undefined;
  if (list.state === "loading") body = <Loading />;
  else if (list.state === "error") body = <LoadError onRetry={retryLoad} />;
  else if (list.data.habits.length === 0)
    body = <Empty onAdd={add} what="Add the daily habits you want to keep, then tick them off here." />;
  else {
    const { habits, ticks } = list.data;
    const byId = new Map(habits.map((h) => [h.id, h]));
    summary = `${habits.filter((h) => ticks[h.id]?.includes(today)).length} of ${habits.length} ticked`;
    body = (
      <ReorderList
        ids={habits.map((h) => h.id)}
        onMove={(ids) => void saver.save(() => reorder(ids))}
        renderRow={(id, { lifted }) => {
          const habit = byId.get(id) as Habit;
          const dates = ticks[id] ?? [];
          const ticked = dates.includes(today);
          return (
            <HabitRow
              habit={habit}
              ticked={ticked}
              streak={current(dates, today)}
              best={best(dates)}
              lifted={lifted}
              onTick={() => void saver.save(() => setTick(id, today, !ticked, today))}
            />
          );
        }}
      />
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: p.bg }]}>
      <Page>
        <Title over={longDate(today)}>Today</Title>
        {summary ? <Text style={[styles.summary, { color: p.muted }]}>{summary}</Text> : null}
        {saver.failed ? <SaveError onRetry={saver.retry} busy={saver.busy} /> : null}
        {body}
      </Page>
      <View pointerEvents="box-none" style={styles.fabLayer}>
        <View pointerEvents="box-none" style={styles.fabColumn}>
          <Pressable
            role="button"
            accessibilityRole="button"
            accessibilityLabel="+"
            accessibilityHint="Add a habit"
            onPress={add}
            style={({ pressed }) => [styles.fab, { backgroundColor: pressed ? p.accentHover : p.accent, shadowColor: p.shadow }]}
          >
            <PlusIcon colour={p.onAccent} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function HabitRow({
  habit,
  ticked,
  streak,
  best: bestRun,
  lifted,
  onTick,
}: {
  habit: Habit;
  ticked: boolean;
  streak: number;
  best: number;
  lifted: boolean;
  onTick: () => void;
}) {
  const p = usePalette();
  const colour = useHabitColours()[habit.colour] ?? p.accent;
  return (
    <View
      testID={`habit-row-${habit.id}`}
      style={[
        styles.row,
        { backgroundColor: p.surface, borderColor: lifted ? p.accent : p.border, shadowColor: p.shadow },
        lifted ? styles.lifted : null,
      ]}
    >
      <View style={[styles.bar, { backgroundColor: colour }]} />
      <Pressable
        role="link"
        accessibilityRole="link"
        accessibilityLabel={habit.name}
        accessibilityHint="Edit this habit"
        onPress={() => router.push(`/habits/${habit.id}`)}
        onLongPress={() => undefined}
        delayLongPress={500}
        style={styles.text}
      >
        <Text style={[styles.name, { color: p.text }]}>{habit.name}</Text>
        <View style={styles.meta}>
          <Text style={[styles.streak, { color: p.text }]}>{`${streak}-day streak`}</Text>
          <Text style={[styles.metaText, { color: p.muted }]}>·</Text>
          <Text style={[styles.metaText, { color: p.muted }]}>{`Best: ${bestRun}`}</Text>
        </View>
      </Pressable>
      <Pressable
        role="checkbox"
        accessibilityRole="checkbox"
        accessibilityLabel={habit.name}
        accessibilityState={{ checked: ticked }}
        aria-checked={ticked}
        onPress={onTick}
        onLongPress={() => undefined}
        delayLongPress={500}
        testID={`tick-${habit.id}`}
        style={[styles.box, { borderColor: ticked ? colour : p.controlBorder, backgroundColor: ticked ? colour : p.surface }]}
      >
        {ticked ? <CheckMark colour={p.onAccent} /> : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  summary: { fontSize: tokens.type.small, marginTop: -tokens.space.md, marginBottom: tokens.space.lg, paddingHorizontal: tokens.space.xs },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space.md,
    borderWidth: tokens.size.border,
    borderRadius: tokens.radius.surface,
    padding: tokens.space.md,
    minHeight: tokens.size.rowMin,
  },
  lifted: { shadowOpacity: 0.25, shadowRadius: tokens.space.md, shadowOffset: { width: 0, height: tokens.space.xs }, elevation: 6 },
  bar: { width: tokens.size.bar, alignSelf: "stretch", borderRadius: tokens.radius.pill },
  text: { flex: 1, minWidth: 0, justifyContent: "center", minHeight: tokens.size.tick },
  name: { fontSize: tokens.type.headline, fontWeight: "600" },
  meta: { flexDirection: "row", flexWrap: "wrap", gap: tokens.space.xs, marginTop: tokens.space.xs },
  streak: { fontSize: tokens.type.small, fontWeight: "600" },
  metaText: { fontSize: tokens.type.small },
  box: {
    width: tokens.size.tick,
    height: tokens.size.tick,
    borderRadius: tokens.radius.control,
    borderWidth: tokens.size.borderThick,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  fabLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: tokens.space.xl,
    alignItems: "center",
  },
  fabColumn: { width: "100%", maxWidth: tokens.size.content, alignItems: "flex-end", paddingHorizontal: tokens.space.xl },
  fab: {
    width: tokens.size.fab,
    height: tokens.size.fab,
    borderRadius: tokens.radius.pill,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.3,
    shadowRadius: tokens.space.md,
    shadowOffset: { width: 0, height: tokens.space.xs },
    elevation: 6,
  },
});
