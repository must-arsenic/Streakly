// The app's shared parts: buttons, the page column, the load states, the save-error banner and
// the confirm prompt. Styled from the tokens only.
import type { ReactNode } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { tokens } from "@/theme/tokens";
import { usePalette } from "@/theme/use-palette";

type ButtonKind = "primary" | "secondary" | "danger" | "ghost";

export function Button({
  label,
  onPress,
  kind = "primary",
  disabled,
  busy,
  testID,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  kind?: ButtonKind;
  disabled?: boolean;
  busy?: boolean;
  testID?: string;
  accessibilityLabel?: string;
}) {
  const p = usePalette();
  const colours: Record<ButtonKind, { bg: string; fg: string; border: string }> = {
    primary: { bg: p.accent, fg: p.onAccent, border: p.accent },
    secondary: { bg: p.surface, fg: p.text, border: p.controlBorder },
    danger: { bg: p.danger, fg: p.onAccent, border: p.danger },
    ghost: { bg: p.surface, fg: p.danger, border: p.controlBorder },
  };
  const c = colours[kind];
  return (
    <Pressable
      role="button"
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled, busy: !!busy }}
      aria-disabled={!!disabled}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: c.bg, borderColor: c.border, opacity: disabled ? 0.6 : pressed ? 0.85 : 1 },
      ]}
    >
      {busy ? <ActivityIndicator size="small" color={c.fg} /> : null}
      <Text style={[styles.buttonText, { color: c.fg }]}>{label}</Text>
    </Pressable>
  );
}

/** One centred column, capped at the content width. */
export function Page({ children, scroll = true, style }: { children: ReactNode; scroll?: boolean; style?: ViewStyle }) {
  const p = usePalette();
  const inner = <View style={[styles.column, style]}>{children}</View>;
  if (!scroll) return <View style={[styles.page, { backgroundColor: p.bg }]}>{inner}</View>;
  return (
    <ScrollView style={[styles.page, { backgroundColor: p.bg }]} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      {inner}
    </ScrollView>
  );
}

export function Title({ children, over }: { children: string; over?: string }) {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + tokens.space.xl }]}>
      {over ? <Text style={[styles.over, { color: p.muted }]}>{over}</Text> : null}
      <Text role="heading" aria-level={1} accessibilityRole="header" style={[styles.title, { color: p.text }]}>
        {children}
      </Text>
    </View>
  );
}

export function Loading({ label = "Loading your habits…" }: { label?: string }) {
  const p = usePalette();
  return (
    <View style={styles.state} accessibilityLiveRegion="polite">
      <ActivityIndicator color={p.accent} />
      <Text style={[styles.stateText, { color: p.muted }]}>{label}</Text>
    </View>
  );
}

export function LoadError({ onRetry, label = "Couldn't load your habits" }: { onRetry: () => void; label?: string }) {
  const p = usePalette();
  return (
    <View style={styles.state} role="alert">
      <Text style={[styles.stateTitle, { color: p.text }]}>{label}</Text>
      <Text style={[styles.stateText, { color: p.muted }]}>Your habits are still on the phone. Try loading them again.</Text>
      <Button label="Try again" onPress={onRetry} />
    </View>
  );
}

export function Empty({ onAdd, what }: { onAdd: () => void; what: string }) {
  const p = usePalette();
  return (
    <View style={styles.state}>
      <Text style={[styles.stateTitle, { color: p.text }]}>No habits yet</Text>
      <Text style={[styles.stateText, { color: p.muted }]}>{what}</Text>
      <Button label="Add a habit" onPress={onAdd} />
    </View>
  );
}

/** The banner for a change that couldn't be saved. */
export function SaveError({ onRetry, busy }: { onRetry: () => void; busy?: boolean }) {
  const p = usePalette();
  return (
    <View role="alert" style={[styles.banner, { backgroundColor: p.dangerSoft, borderColor: p.danger }]}>
      <Text style={[styles.bannerText, { color: p.text }]}>Couldn't save your change</Text>
      <Button label="Try again" kind="secondary" onPress={onRetry} busy={busy} disabled={busy} />
    </View>
  );
}

export function Confirm({
  visible,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  busy,
}: {
  visible: boolean;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}) {
  const p = usePalette();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={[styles.backdrop, { backgroundColor: p.backdrop }]}>
        <View role="alertdialog" aria-modal accessibilityViewIsModal aria-label={message} style={[styles.dialog, { backgroundColor: p.surface, borderColor: p.border }]}>
          <Text style={[styles.dialogText, { color: p.text }]}>{message}</Text>
          <View style={styles.dialogButtons}>
            <Button label="Cancel" kind="secondary" onPress={onCancel} disabled={busy} />
            <Button label={confirmLabel} kind="danger" onPress={onConfirm} disabled={busy} busy={busy} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: tokens.size.tick,
    paddingHorizontal: tokens.space.lg,
    borderRadius: tokens.radius.control,
    borderWidth: tokens.size.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.space.sm,
    flexShrink: 1,
  },
  buttonText: { fontSize: tokens.type.body, fontWeight: "600", textAlign: "center" },
  page: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  column: { width: "100%", maxWidth: tokens.size.content, alignSelf: "center", paddingHorizontal: tokens.space.lg, paddingBottom: tokens.space.xxxl * 2, flexGrow: 1 },
  header: { paddingBottom: tokens.space.lg, paddingHorizontal: tokens.space.xs },
  over: { fontSize: tokens.type.small, fontWeight: "500" },
  title: { fontSize: tokens.type.display, fontWeight: "700" },
  state: { alignItems: "center", justifyContent: "center", gap: tokens.space.md, paddingVertical: tokens.space.xxxl, paddingHorizontal: tokens.space.lg },
  stateTitle: { fontSize: tokens.type.headline, fontWeight: "600", textAlign: "center" },
  stateText: { fontSize: tokens.type.body, textAlign: "center" },
  banner: {
    borderWidth: tokens.size.border,
    borderRadius: tokens.radius.surface,
    padding: tokens.space.md,
    marginBottom: tokens.space.md,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.space.sm,
  },
  bannerText: { fontSize: tokens.type.body, fontWeight: "600", flexShrink: 1 },
  backdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: tokens.space.lg },
  dialog: { width: "100%", maxWidth: tokens.size.dialog, borderRadius: tokens.radius.surface, borderWidth: tokens.size.border, padding: tokens.space.xl, gap: tokens.space.xl },
  dialogText: { fontSize: tokens.type.headline, fontWeight: "600" },
  dialogButtons: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", gap: tokens.space.sm },
});
