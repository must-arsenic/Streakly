// Week: one row per habit in list order, 7 columns from 6 days ago to today. Tap a cell to tick
// or untick that habit on that day.
import { router, useIsFocused } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { CheckMark } from "@/components/icons";
import { Empty, Loading, LoadError, Page, SaveError, Title } from "@/components/ui";
import { useApp } from "@/lib/app-state";
import { dayNumber, lastSeven, weekdayShort } from "@/lib/days";
import { toggleTick } from "@/lib/store";
import { useHabitList } from "@/lib/use-data";
import { useSave } from "@/lib/use-save";
import { tokens } from "@/theme/tokens";
import { useHabitColours, usePalette } from "@/theme/use-palette";

export default function Week() {
  const focused = useIsFocused();
  const { today } = useApp();
  const [list, retryLoad] = useHabitList("/week", focused);
  const saver = useSave();
  const p = usePalette();
  const colours = useHabitColours();
  if (!focused) return null;

  const days = lastSeven(today);
  let body;
  if (list.state === "loading") body = <Loading />;
  else if (list.state === "error") body = <LoadError onRetry={retryLoad} />;
  else if (list.data.habits.length === 0)
    body = (
      <Empty onAdd={() => router.push("/habits/new")} what="Each habit you keep gets a row here, with a box for each of the last 7 days." />
    );
  else {
    const { habits, ticks } = list.data;
    body = (
      <View role="grid" accessibilityLabel="Week view" style={styles.grid}>
        <View role="rowgroup" style={[styles.cells, styles.header]} testID="week-header">
          {days.map((day) => (
            <View
              key={day}
              role="columnheader"
              accessible
              accessibilityLabel={`${weekdayShort(day)} ${dayNumber(day)}`}
              style={styles.column}
              testID={`week-column-${day}`}
            >
              <Text style={[styles.head, { color: day === today ? p.accent : p.muted }]}>{`${weekdayShort(day)}\n${dayNumber(day)}`}</Text>
            </View>
          ))}
        </View>
        {habits.map((habit) => {
          const colour = colours[habit.colour] ?? p.accent;
          const ticked = new Set(ticks[habit.id] ?? []);
          return (
            <View
              key={habit.id}
              role="row"
              testID={`week-row-${habit.id}`}
              style={[styles.habit, { backgroundColor: p.surface, borderColor: p.border }]}
            >
              <View style={styles.nameLine}>
                <View style={[styles.dot, { backgroundColor: colour }]} />
                <Text role="rowheader" style={[styles.name, { color: p.text }]}>
                  {habit.name}
                </Text>
              </View>
              <View style={styles.cells}>
                {days.map((day) => {
                  const on = ticked.has(day);
                  return (
                    <View key={day} style={styles.column}>
                      <Pressable
                        role="checkbox"
                        accessibilityRole="checkbox"
                        accessibilityLabel={`${habit.name}, ${weekdayShort(day)} ${dayNumber(day)}`}
                        accessibilityState={{ checked: on }}
                        aria-checked={on}
                        testID={`cell-${habit.id}-${day}`}
                        onPress={() => void saver.save(() => toggleTick(habit.id, day), { tick: true })}
                        style={[styles.cell, { borderColor: on ? colour : p.controlBorder, backgroundColor: on ? colour : p.surface }]}
                      >
                        {on ? <CheckMark colour={p.onAccent} size={20} /> : null}
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
    );
  }

  return (
    <Page>
      <Title over="The last 7 days">Week</Title>
      {saver.failed ? <SaveError onRetry={saver.retry} busy={saver.busy} /> : null}
      {body}
    </Page>
  );
}

const styles = StyleSheet.create({
  grid: { gap: tokens.space.sm },
  cells: { flexDirection: "row", gap: tokens.space.xs },
  header: { paddingHorizontal: tokens.space.md + tokens.size.border },
  column: { flex: 1, minWidth: 0, alignItems: "center" },
  head: { fontSize: tokens.type.caption, fontWeight: "600", textAlign: "center" },
  habit: { borderWidth: tokens.size.border, borderRadius: tokens.radius.surface, padding: tokens.space.md, gap: tokens.space.sm },
  nameLine: { flexDirection: "row", alignItems: "center", gap: tokens.space.sm },
  dot: { width: tokens.space.md, height: tokens.space.md, borderRadius: tokens.radius.pill },
  name: { fontSize: tokens.type.body, fontWeight: "600", flex: 1, minWidth: 0 },
  cell: {
    width: "100%",
    maxWidth: tokens.size.cell,
    aspectRatio: 1,
    minHeight: tokens.size.dayColumn,
    borderRadius: tokens.radius.sm,
    borderWidth: tokens.size.borderThick,
    alignItems: "center",
    justifyContent: "center",
  },
});
