// The first screen.
import { StyleSheet, Text, View } from "react-native";

import { tokens } from "@/theme/tokens";
import { usePalette } from "@/theme/use-palette";

export default function Home() {
  const palette = usePalette();
  return (
    <View style={styles.page}>
      <Text accessibilityRole="header" style={[styles.title, { color: palette.text }]}>
        A new app
      </Text>
      <Text style={[styles.body, { color: palette.muted }]}>Nothing here yet.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: tokens.space.lg, gap: tokens.space.sm },
  title: { fontSize: tokens.type.title, fontWeight: "700" },
  body: { fontSize: tokens.type.body },
});
