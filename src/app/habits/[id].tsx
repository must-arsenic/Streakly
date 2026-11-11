// Edit habit: change the name and colour (the ticks stay), archive it as last saved, or delete it
// with all its ticks.
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { HabitForm } from "@/components/habit-form";
import { Button, Confirm, Loading, LoadError, Page, SaveError } from "@/components/ui";
import { archiveHabit, deleteHabit, updateHabit } from "@/lib/store";
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
  const [archiving, setArchiving] = useState(false);
  const [archiveFailed, setArchiveFailed] = useState(false);
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
  if (!h || h.archivedAt !== undefined)
    return (
      <Page>
        <View style={styles.gone}>
          <Text style={[styles.goneText, { color: p.text }]}>This habit isn't here any more.</Text>
          <Button label="Back to Today" onPress={() => router.replace("/")} />
        </View>
      </Page>
    );

  // As last saved: only the id goes, so unsaved name or colour changes are dropped. No prompt.
  const archive = async () => {
    if (archiving) return;
    setArchiving(true);
    setArchiveFailed(false);
    try {
      await archiveHabit(h.id);
      router.replace("/");
    } catch {
      setArchiveFailed(true);
      setArchiving(false);
    }
  };

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
          {/* Not in the header: on the phone, Expo Go's tools button sits over the header's right end. */}
          <View style={styles.deleteLine}>
            {archiveFailed ? (
              <Text role="alert" style={[styles.error, { color: p.danger }]}>
                Couldn't save. Try again.
              </Text>
            ) : null}
            <Button label="Archive habit" kind="secondary" onPress={archive} busy={archiving} disabled={archiving} />
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
  deleteLine: { alignItems: "flex-end", gap: tokens.space.sm },
  error: { fontSize: tokens.type.small, fontWeight: "600" },
  gone: { gap: tokens.space.lg, paddingTop: tokens.space.xxl, alignItems: "flex-start" },
  goneText: { fontSize: tokens.type.headline },
});
