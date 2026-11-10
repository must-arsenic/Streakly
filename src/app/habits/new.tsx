// Add habit: it goes at the end of the list.
import { router } from "expo-router";

import { HabitForm } from "@/components/habit-form";
import { Page } from "@/components/ui";
import { useApp } from "@/lib/app-state";
import { addHabit } from "@/lib/store";

export default function AddHabit() {
  const { today } = useApp();
  const close = () => (router.canGoBack() ? router.back() : router.replace("/"));
  return (
    <Page>
      <HabitForm
        onCancel={close}
        onSave={async (name, colour) => {
          await addHabit(name, colour, today);
          close();
        }}
      />
    </Page>
  );
}
