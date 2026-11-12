// The Add and Edit habit form: a name of 1 to 40 characters and one of 8 colours.
import { type ComponentRef, type ReactNode, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Button } from "@/components/ui";
import { CheckMark } from "@/components/icons";
import { NAME_MAX, nameError } from "@/lib/store";
import { tokens } from "@/theme/tokens";
import { useHabitColours, usePalette } from "@/theme/use-palette";

export function HabitForm({
  initialName = "",
  initialColour = 0,
  onSave,
  onCancel,
  children,
}: {
  initialName?: string;
  initialColour?: number;
  onSave: (name: string, colour: number) => Promise<void>;
  onCancel: () => void;
  children?: ReactNode;
}) {
  const p = usePalette();
  const colours = useHabitColours();
  const [name, setName] = useState(initialName);
  const [colour, setColour] = useState(initialColour);
  const [error, setError] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const input = useRef<ComponentRef<typeof TextInput>>(null);

  const submit = async () => {
    if (saving) return;
    const problem = nameError(name);
    setError(problem);
    if (problem) return;
    setSaving(true);
    setFailed(false);
    try {
      await onSave(name, colour);
    } catch {
      setFailed(true);
      setSaving(false);
    }
  };

  return (
    <View style={styles.form}>
      <View style={styles.field}>
        <Text nativeID="habit-name-label" onPress={() => input.current?.focus()} style={[styles.label, { color: p.text }]}>
          Name
        </Text>
        <TextInput
          ref={input}
          testID="habit-name"
          accessibilityLabel="Name"
          aria-labelledby="habit-name-label"
          value={name}
          maxLength={NAME_MAX}
          onChangeText={(text) => setName(text.slice(0, NAME_MAX))}
          onBlur={() => error && setError(nameError(name))}
          onSubmitEditing={submit}
          autoCapitalize="sentences"
          autoComplete="off"
          returnKeyType="done"
          aria-invalid={!!error}
          style={[styles.input, { color: p.text, backgroundColor: p.surface, borderColor: error ? p.danger : p.controlBorder }]}
        />
        <View style={styles.hintLine}>
          {error ? (
            <Text role="alert" style={[styles.error, { color: p.danger }]}>
              {error}
            </Text>
          ) : (
            <View />
          )}
          <Text style={[styles.count, { color: p.muted }]}>{`${name.length}/${NAME_MAX}`}</Text>
        </View>
      </View>
      <View style={styles.field}>
        <Text style={[styles.label, { color: p.text }]}>Colour</Text>
        <View role="radiogroup" accessibilityLabel="Colour" style={styles.swatches}>
          {colours.map((c, i) => {
            const on = colour === i;
            return (
              <Pressable
                key={tokens.habit.names[i]}
                role="radio"
                accessibilityRole="radio"
                accessibilityLabel={tokens.habit.names[i]}
                // checked and selected: phone test runners read either
                accessibilityState={{ checked: on, selected: on }}
                aria-checked={on}
                testID={`swatch-${i}`}
                onPress={() => setColour(i)}
                style={[styles.swatchRing, { borderColor: on ? p.text : "transparent" }]}
              >
                <View style={[styles.swatch, { backgroundColor: c }]}>{on ? <CheckMark colour={p.onAccent} size={22} /> : null}</View>
              </Pressable>
            );
          })}
        </View>
      </View>
      {failed ? (
        <Text role="alert" style={[styles.error, { color: p.danger }]}>
          Couldn't save. Try again.
        </Text>
      ) : null}
      <View style={styles.buttons}>
        <Button label="Cancel" kind="secondary" onPress={onCancel} />
        <Button label="Save" onPress={submit} disabled={saving} busy={saving} />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: tokens.space.xl, paddingTop: tokens.space.lg },
  field: { gap: tokens.space.sm },
  label: { fontSize: tokens.type.body, fontWeight: "600" },
  input: {
    minHeight: tokens.size.tick,
    borderWidth: tokens.size.border,
    borderRadius: tokens.radius.control,
    paddingHorizontal: tokens.space.md,
    fontSize: tokens.type.body,
  },
  hintLine: { flexDirection: "row", justifyContent: "space-between", gap: tokens.space.sm },
  error: { fontSize: tokens.type.small, fontWeight: "600", flexShrink: 1 },
  count: { fontSize: tokens.type.small, fontVariant: ["tabular-nums"] },
  swatches: { flexDirection: "row", flexWrap: "wrap", gap: tokens.space.sm },
  swatchRing: { borderWidth: tokens.size.borderThick, borderRadius: tokens.radius.pill, padding: tokens.space.xxs },
  swatch: { width: tokens.size.swatch, height: tokens.size.swatch, borderRadius: tokens.radius.pill, alignItems: "center", justifyContent: "center" },
  buttons: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", gap: tokens.space.sm },
});
