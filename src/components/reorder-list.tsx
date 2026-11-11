// A list whose rows can be long-pressed (500 ms) to pick them up and dragged to a new place. A row
// stays picked up after the long press ends: the next drag (from anywhere on the list) moves it, and
// a tap puts it back down. Holding and moving in one touch works too. The new order is handed to
// `onMove`; the list itself only changes when the saved order comes back. Screen readers get
// "Move up" and "Move down" actions instead.
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { type LayoutRectangle, PanResponder, Platform, StyleSheet, View, type ViewStyle } from "react-native";

import { tokens } from "@/theme/tokens";

const HOLD_MS = 500;
const SLOP = 8;

type Drag = { id: number; dy: number };

export function ReorderList({
  ids,
  onMove,
  renderRow,
  labelOf,
  onLift,
}: {
  ids: number[];
  onMove: (ids: number[]) => void;
  renderRow: (id: number, state: { lifted: boolean }) => ReactNode;
  /** Each row's name for screen readers: the habit's name. */
  labelOf: (id: number) => string;
  /** A row is picked up (true) or put down (false): the page stops scrolling meanwhile. */
  onLift?: (lifted: boolean) => void;
}) {
  const layouts = useRef(new Map<number, LayoutRectangle>());
  const [drag, setDrag] = useState<Drag | null>(null);
  const picked = useRef<number | null>(null);
  const lifted = drag !== null;
  useEffect(() => onLift?.(lifted), [lifted, onLift]);
  const idsRef = useRef(ids);
  idsRef.current = ids;
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

  const pick = (id: number | null) => {
    picked.current = id;
    setDrag(id === null ? null : { id, dy: 0 });
  };

  const target = (id: number, dy: number): number[] => {
    const order = idsRef.current;
    const own = layouts.current.get(id);
    if (!own) return order;
    const centre = own.y + own.height / 2 + dy;
    const others = order.filter((x) => x !== id);
    let index = 0;
    for (const other of others) {
      const l = layouts.current.get(other);
      if (l && l.y + l.height / 2 < centre) index += 1;
    }
    const next = [...others];
    next.splice(index, 0, id);
    return next;
  };

  const move = (id: number, by: number) => {
    const order = [...idsRef.current];
    const at = order.indexOf(id);
    const to = at + by;
    if (at < 0 || to < 0 || to >= order.length) return;
    order.splice(at, 1);
    order.splice(to, 0, id);
    onMoveRef.current(order);
  };

  // The list moves the picked-up row: it takes every touch while a row is picked up.
  const list = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponderCapture: () => picked.current !== null,
        onMoveShouldSetPanResponderCapture: (_e, g) => picked.current !== null && (Math.abs(g.dy) > SLOP || Math.abs(g.dx) > SLOP),
        onPanResponderMove: (_e, g) => {
          if (picked.current !== null) setDrag({ id: picked.current, dy: g.dy });
        },
        onPanResponderRelease: (_e, g) => {
          const id = picked.current;
          pick(null);
          if (id === null || Math.abs(g.dy) <= SLOP) return; // a tap: put it back down
          const next = target(id, g.dy);
          if (next.join() !== idsRef.current.join()) onMoveRef.current(next);
        },
        onPanResponderTerminationRequest: () => false,
        onPanResponderTerminate: () => pick(null),
        onShouldBlockNativeResponder: () => true,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <View role="table" aria-label="Today's habits" style={styles.list} {...list.panHandlers}>
      {ids.map((id) => (
        <Row
          key={id}
          id={id}
          dy={drag?.id === id ? drag.dy : null}
          onPick={() => pick(id)}
          isPicked={() => picked.current !== null}
          onLayout={(l) => layouts.current.set(id, l)}
          onAction={(by) => move(id, by)}
          label={labelOf(id)}
        >
          {renderRow(id, { lifted: drag?.id === id })}
        </Row>
      ))}
    </View>
  );
}

function Row({
  id,
  dy,
  onPick,
  isPicked,
  onLayout,
  onAction,
  label,
  children,
}: {
  id: number;
  /** How far the row is dragged; null when it isn't picked up. */
  dy: number | null;
  onPick: () => void;
  isPicked: () => boolean;
  onLayout: (l: LayoutRectangle) => void;
  onAction: (by: number) => void;
  label: string;
  children: ReactNode;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handlers = useRef({ onPick, isPicked });
  handlers.current = { onPick, isPicked };

  // The row only watches for the long press; the list does the moving.
  const responder = useMemo(() => {
    const clear = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
    };
    return PanResponder.create({
      onStartShouldSetPanResponderCapture: () => {
        clear();
        if (!handlers.current.isPicked()) timer.current = setTimeout(() => handlers.current.onPick(), HOLD_MS);
        return false;
      },
      onMoveShouldSetPanResponderCapture: (_e, g) => {
        if (Math.abs(g.dx) > SLOP || Math.abs(g.dy) > SLOP) clear();
        return false;
      },
    });
  }, []);

  const end = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  return (
    <View
      {...responder.panHandlers}
      role="row"
      // the web names the row for role queries; on a phone the name and the tick box carry it
      aria-label={Platform.OS === "web" ? label : undefined}
      onTouchEnd={end}
      onTouchCancel={end}
      onLayout={(e) => onLayout(e.nativeEvent.layout)}
      accessibilityActions={[
        { name: "moveUp", label: "Move up" },
        { name: "moveDown", label: "Move down" },
      ]}
      onAccessibilityAction={(e) => onAction(e.nativeEvent.actionName === "moveUp" ? -1 : 1)}
      testID={`reorder-row-${id}`}
      style={[styles.row, dy !== null ? { zIndex: 2, transform: [{ translateY: dy }] } : null, Platform.OS === "web" ? noSelect : null]}
    >
      {children}
    </View>
  );
}

// Web only: a long press must not select the row's text.
const noSelect = { userSelect: "none" } as unknown as ViewStyle;

const styles = StyleSheet.create({
  list: { gap: tokens.space.sm },
  row: { position: "relative" },
});
