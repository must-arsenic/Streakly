// Edit habit: change the name and colour (the ticks stay), or delete it with all its ticks.
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { HabitForm } from "@/components/habit-form";
import { Button, Confirm, Loading, LoadError, Page, SaveError } from "@/components/ui";
import { deleteHabit, updateHabit } from "@/lib/store";
import { useHabit } from "@/lib/use-data";
import { useSave } from "@/lib/use-save";
import { tokens } from "@/theme/tokens";
import { usePalette } from "@/theme/use-palette";

export default function EditHabit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const habitId = Number(id);
  const [habit, retry] = useHabit(habitId);
  const saver = useSave();
  const p = usePalette();
  const [asking, setAsking] = useState(false);
  const close = () => (router.canGoBack() ? router.back() : router.replace("/"));

  if (habit.state === "loading")
    return (
      <Page>
        <Loading label="Loading your habit…" />
      </Page>
    );
  if (habit.state === "error")
    return (
      <Page>
        <LoadError onRetry={retry} label="Couldn't load your habit" />
      </Page>
    );
  const h = habit.data;
  if (!h)
    return (
      <Page>
        <View style={styles.gone}>
          <Text style={[styles.goneText, { color: p.text }]}>This habit isn't here any more.</Text>
          <Button label="Back to Today" onPress={() => router.replace("/")} />
        </View>
      </Page>
    );

  return (
    <>
      <Page behind={asking}>
        {saver.failed ? (
          <View style={styles.banner}>
            <SaveError onRetry={saver.retry} busy={saver.busy} />
          </View>
        ) : null}
        <HabitForm
          key={h.id}
          initialName={h.name}
          initialColour={h.colour}
          onCancel={close}
          onSave={async (name, colour) => {
            await updateHabit(h.id, name, colour);
            close();
          }}
        >
          <View style={[styles.danger, { borderColor: p.border }]}>
            <Button label="Delete habit" kind="ghost" onPress={() => setAsking(true)} />
          </View>
        </HabitForm>
      </Page>
      <Confirm
        visible={asking}
        message="Delete this habit and all its history?"
        confirmLabel="Delete"
        busy={saver.busy}
        onCancel={() => setAsking(false)}
        onConfirm={async () => {
          const done = await saver.save(async () => {
            await deleteHabit(h.id);
            router.replace("/");
          });
          if (!done) setAsking(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  banner: { paddingTop: tokens.space.lg },
  danger: { borderTopWidth: tokens.size.border, paddingTop: tokens.space.xl, alignItems: "flex-start" },
  gone: { gap: tokens.space.lg, paddingTop: tokens.space.xxl, alignItems: "flex-start" },
  goneText: { fontSize: tokens.type.headline },
});
