// The first-run guide: three cards (adding a habit, ticking it, the week view) with "Next" and
// "Skip", and "Get started" on the last. Finishing or skipping means it never shows again.
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Page, SaveError } from "@/components/ui";
import { useApp } from "@/lib/app-state";
import { setGuideDone } from "@/lib/store";
import { useSave } from "@/lib/use-save";
import { tokens } from "@/theme/tokens";
import { usePalette } from "@/theme/use-palette";

const cards = [
  { title: "Add the habits you want to keep", body: "Tap + on Today to add a daily habit, like \"Drink water\" or \"Stretch\", and pick its colour." },
  { title: "Tick a habit when you do it", body: "Tap the box next to a habit to tick it for today. Your current and best streaks count up as you go." },
  { title: "See your week at a glance", body: "The Week view shows the last 7 days. Forgot to tick a day? Tap its cell there to fix it." },
];

export default function Welcome() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const card = cards[index];
  const last = index === cards.length - 1;

  const { settings } = useApp();
  const saver = useSave();
  const [leaving, setLeaving] = useState(false);
  // Leave once the finished guide is saved and the app has it, so Today doesn't send us back.
  useEffect(() => {
    if (leaving && settings.guideDone) router.replace("/");
  }, [leaving, settings.guideDone]);
  const finish = async () => {
    if (await saver.save(() => setGuideDone(true))) setLeaving(true);
  };

  return (
    <Page>
      <View style={[styles.wrap, { paddingTop: insets.top + tokens.space.xxl }]}>
        {saver.failed ? <SaveError onRetry={() => void finish()} busy={saver.busy} /> : null}
        <Image
          source={require("@/assets/images/logo-mark.png")}
          style={[styles.logo, { backgroundColor: p.accent }]}
          resizeMode="contain"
          accessibilityLabel="White woven ribbon mark on a transparent background"
          alt="White woven ribbon mark on a transparent background"
        />
        <View role="group" accessibilityLabel={`Guide card ${index + 1} of ${cards.length}`} testID={`guide-card-${index + 1}`} style={[styles.card, { backgroundColor: p.surface, borderColor: p.border }]}>
          <Text style={[styles.step, { color: p.muted }]}>{`${index + 1} of ${cards.length}`}</Text>
          <Text role="heading" aria-level={1} accessibilityRole="header" style={[styles.title, { color: p.text }]}>
            {card.title}
          </Text>
          <Text style={[styles.body, { color: p.muted }]}>{card.body}</Text>
        </View>
        <View style={styles.dots}>
          {cards.map((c, i) => (
            <View key={c.title} style={[styles.dot, { backgroundColor: i === index ? p.accent : p.borderStrong }]} />
          ))}
        </View>
        <View style={styles.buttons}>
          {last ? (
            <Button label="Get started" onPress={finish} />
          ) : (
            <>
              <Button label="Skip" kind="secondary" onPress={finish} />
              <Button label="Next" onPress={() => setIndex(index + 1)} />
            </>
          )}
        </View>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: tokens.space.xl, alignItems: "stretch" },
  logo: { width: tokens.size.logo, height: tokens.size.logo, borderRadius: tokens.radius.surface, alignSelf: "center" },
  card: { borderWidth: tokens.size.border, borderRadius: tokens.radius.surface, padding: tokens.space.xl, gap: tokens.space.md },
  step: { fontSize: tokens.type.small, fontWeight: "600" },
  title: { fontSize: tokens.type.title, fontWeight: "700" },
  body: { fontSize: tokens.type.body, lineHeight: tokens.type.body * 1.5 },
  dots: { flexDirection: "row", justifyContent: "center", gap: tokens.space.sm },
  dot: { width: tokens.space.sm, height: tokens.space.sm, borderRadius: tokens.radius.pill },
  buttons: { flexDirection: "row", justifyContent: "flex-end", gap: tokens.space.sm, flexWrap: "wrap" },
});
