// A list whose rows can be long-pressed (500 ms) and dragged to a new place. The new order is
// handed to `onMove`; the list itself only changes when the saved order comes back. Screen readers
// get "Move up" and "Move down" actions instead.
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { type LayoutRectangle, PanResponder, Platform, StyleSheet, View, type ViewStyle } from "react-native";

import { tokens } from "@/theme/tokens";

const HOLD_MS = 500;
const SLOP = 8;

type Drag = { id: number; dy: number; moving: boolean };

export function ReorderList({
  ids,
  onMove,
  renderRow,
  labelOf,
}: {
  ids: number[];
  onMove: (ids: number[]) => void;
  renderRow: (id: number, state: { lifted: boolean }) => ReactNode;
  /** Each row's name for screen readers: the habit's name. */
  labelOf: (id: number) => string;
}) {
  const layouts = useRef(new Map<number, LayoutRectangle>());
  const [drag, setDrag] = useState<Drag | null>(null);
  const idsRef = useRef(ids);
  idsRef.current = ids;
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

  // A press anywhere ending without a drag drops the lifted row.
  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const up = () => setDrag((d) => (d && !d.moving ? null : d));
    window.addEventListener("pointerup", up);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("pointerup", up);
      window.removeEventListener("mouseup", up);
    };
  }, []);

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

  return (
    <View role="table" aria-label="Today's habits" style={styles.list}>
      {ids.map((id) => (
        <Row
          key={id}
          id={id}
          drag={drag?.id === id ? drag : null}
          setDrag={setDrag}
          onLayout={(l) => layouts.current.set(id, l)}
          onDrop={(dy) => {
            const next = target(id, dy);
            if (next.join() !== idsRef.current.join()) onMoveRef.current(next);
          }}
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
  drag,
  setDrag,
  onLayout,
  onDrop,
  onAction,
  label,
  children,
}: {
  id: number;
  drag: Drag | null;
  setDrag: (d: Drag | null | ((d: Drag | null) => Drag | null)) => void;
  onLayout: (l: LayoutRectangle) => void;
  onDrop: (dy: number) => void;
  onAction: (by: number) => void;
  label: string;
  children: ReactNode;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const armed = useRef(false);
  const handlers = useRef({ onDrop, setDrag });
  handlers.current = { onDrop, setDrag };

  const responder = useMemo(() => {
    const clear = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
    };
    return PanResponder.create({
      onStartShouldSetPanResponderCapture: () => {
        clear();
        armed.current = false;
        timer.current = setTimeout(() => {
          armed.current = true;
          handlers.current.setDrag({ id, dy: 0, moving: false });
        }, HOLD_MS);
        return false;
      },
      onMoveShouldSetPanResponderCapture: (_e, g) => {
        if (armed.current) return true;
        if (Math.abs(g.dx) > SLOP || Math.abs(g.dy) > SLOP) clear();
        return false;
      },
      onPanResponderGrant: () => handlers.current.setDrag({ id, dy: 0, moving: true }),
      onPanResponderMove: (_e, g) => handlers.current.setDrag({ id, dy: g.dy, moving: true }),
      onPanResponderRelease: (_e, g) => {
        armed.current = false;
        clear();
        handlers.current.setDrag(null);
        handlers.current.onDrop(g.dy);
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderTerminate: () => {
        armed.current = false;
        clear();
        handlers.current.setDrag(null);
      },
      onShouldBlockNativeResponder: () => true,
    });
  }, [id]);

  const end = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (!drag?.moving) {
      armed.current = false;
      setDrag((d) => (d?.id === id && !d.moving ? null : d));
    }
  };

  return (
    <View
      {...responder.panHandlers}
      role="row"
      aria-label={label}
      onTouchEnd={end}
      onTouchCancel={end}
      onLayout={(e) => onLayout(e.nativeEvent.layout)}
      accessibilityActions={[
        { name: "moveUp", label: "Move up" },
        { name: "moveDown", label: "Move down" },
      ]}
      onAccessibilityAction={(e) => onAction(e.nativeEvent.actionName === "moveUp" ? -1 : 1)}
      style={[styles.row, drag ? { zIndex: 2, transform: [{ translateY: drag.dy }] } : null, Platform.OS === "web" ? noSelect : null]}
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
