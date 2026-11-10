// Interface icons drawn with plain views, in the given (text) colour.
import { StyleSheet, View } from "react-native";

import { tokens } from "@/theme/tokens";

const S = tokens.size.icon;
const B = tokens.size.borderThick;

export function CheckMark({ colour, size = 28 }: { colour: string; size?: number }) {
  return (
    <View accessible={false} style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          width: size * 0.32,
          height: size * 0.62,
          borderColor: colour,
          borderRightWidth: size * 0.11,
          borderBottomWidth: size * 0.11,
          transform: [{ translateY: -size * 0.06 }, { rotate: "45deg" }],
        }}
      />
    </View>
  );
}

export function TodayIcon({ colour }: { colour: string }) {
  return (
    <View style={[styles.box, { borderRadius: S / 2, borderColor: colour, borderWidth: B }]}>
      <CheckMark colour={colour} size={S * 0.7} />
    </View>
  );
}

export function WeekIcon({ colour }: { colour: string }) {
  return (
    <View style={[styles.box, { borderRadius: tokens.radius.sm / 2, borderColor: colour, borderWidth: B, justifyContent: "flex-end" }]}>
      <View style={{ position: "absolute", top: S * 0.2, left: 0, right: 0, height: B, backgroundColor: colour }} />
      <View style={{ position: "absolute", top: S * 0.2, bottom: 0, left: S * 0.3, width: B, backgroundColor: colour }} />
      <View style={{ position: "absolute", top: S * 0.2, bottom: 0, right: S * 0.3, width: B, backgroundColor: colour }} />
    </View>
  );
}

export function SettingsIcon({ colour }: { colour: string }) {
  const dot = { position: "absolute" as const, width: S * 0.3, height: S * 0.3, borderRadius: S, borderWidth: B, borderColor: colour };
  return (
    <View style={[styles.box, { width: S, height: S }]}>
      <View style={{ position: "absolute", top: S * 0.25, left: 0, right: 0, height: B, backgroundColor: colour }} />
      <View style={{ position: "absolute", top: S * 0.7, left: 0, right: 0, height: B, backgroundColor: colour }} />
      <View style={[dot, { top: S * 0.25 - S * 0.15 + B / 2, left: S * 0.2 }]} />
      <View style={[dot, { top: S * 0.7 - S * 0.15 + B / 2, right: S * 0.2 }]} />
    </View>
  );
}

export function PlusIcon({ colour }: { colour: string }) {
  return (
    <View style={[styles.box, { alignItems: "center", justifyContent: "center" }]}>
      <View style={{ position: "absolute", width: S, height: B + 1, backgroundColor: colour, borderRadius: B }} />
      <View style={{ position: "absolute", width: B + 1, height: S, backgroundColor: colour, borderRadius: B }} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: S, height: S, overflow: "hidden" },
});

export function BackIcon({ colour }: { colour: string }) {
  return (
    <View style={[styles.box, { alignItems: "center", justifyContent: "center" }]}>
      <View
        style={{
          width: S * 0.45,
          height: S * 0.45,
          borderColor: colour,
          borderLeftWidth: B + 0.5,
          borderBottomWidth: B + 0.5,
          transform: [{ translateX: S * 0.08 }, { rotate: "45deg" }],
        }}
      />
    </View>
  );
}
