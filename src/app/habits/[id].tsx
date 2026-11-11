// Edit habit: change the name and colour (the ticks stay), or delete it with all its ticks.
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { HabitForm } from "@/components/habit-form";
import { Button, Confirm, Loading, LoadError, Page, SaveError } from "@/components/ui";
import { deleteHabit, updateHabit } from "@/lib/store";
import { useHabit } from "@/lib/use-data";
import { useSave } from "@/lib/use-save";
import { tokens } from "@/theme/tokens";
import { usePalette } from "@/theme/use-palette";

export default function EditHabit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [habit, retry] = useHabit(decodeURIComponent(String(id ?? "")));
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
        {/* "Delete habit" sits in the header: always in view, above the keyboard. Gone while the prompt asks. */}
        <Stack.Screen
          options={{
            headerRight: () =>
              asking ? null : (
                <Pressable
                  role="button"
                  accessibilityRole="button"
                  accessibilityLabel="Delete habit"
                  onPress={() => setAsking(true)}
                  style={({ pressed }) => [styles.headerButton, { opacity: pressed ? 0.7 : 1 }]}
                >
                  <Text style={[styles.headerButtonText, { color: p.danger }]}>Delete habit</Text>
                </Pressable>
              ),
          }}
        />
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
  headerButton: { minHeight: tokens.size.tick, justifyContent: "center", paddingHorizontal: tokens.space.md },
  headerButtonText: { fontSize: tokens.type.body, fontWeight: "600" },
  gone: { gap: tokens.space.lg, paddingTop: tokens.space.xxl, alignItems: "flex-start" },
  goneText: { fontSize: tokens.type.headline },
});
