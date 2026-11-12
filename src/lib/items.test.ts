// The unit tests for the earlier items, each titled with its item's tag.
import { afterEach, beforeEach, expect, test } from "@jest/globals";

import { migrate, open, useDbForTests } from "./db";
import { addDays, today as todayDay } from "./days";
import { clearFaults, setWritesFail } from "./faults";
import { nodeDb } from "./node-db.testutil";
import { addHabit, countTicks, deleteHabit, failedTick, isTicked, loadList, reorder, saveTick, setTick, TickNotSaved, toggleTick } from "./store";
import { best, current } from "./streaks";

let db: ReturnType<typeof nodeDb>;
let today: string;

beforeEach(async () => {
  db = nodeDb();
  useDbForTests(db);
  await migrate(await open());
  today = todayDay();
});
afterEach(() => {
  clearFaults();
  useDbForTests(null);
});

const ticksOf = async (id: number) => (await loadList()).ticks[id] ?? [];

async function remember(tick: { habitId: number; day: string; ticked: boolean }): Promise<void> {
  const kv = await open();
  await kv.run("INSERT INTO kv (key, value) VALUES ('failedTick', ?);", JSON.stringify(tick));
}

test("[utest->ac~streakly.tick.on~1] ticking Stretch today stores the tick and makes a 1-day streak", async () => {
  const id = await addHabit("Stretch", 0, today);
  expect(await toggleTick(id, today)).toBe(true);
  expect(await isTicked(id, today)).toBe(true);
  const dates = await ticksOf(id);
  expect(current(dates, today)).toBe(1);
  expect(best(dates)).toBe(1);
});

test("[utest->ac~streakly.tick.off~1] unticking Stretch today removes the tick", async () => {
  const id = await addHabit("Stretch", 0, today);
  await setTick(id, today, true);
  expect(await toggleTick(id, today)).toBe(false);
  expect(await isTicked(id, today)).toBe(false);
});

test("[utest->ac~streakly.tick-window.too-old~1] a tick 7 days back is refused", async () => {
  const id = await addHabit("Stretch", 0, today);
  const before = await countTicks();
  await expect(setTick(id, addDays(today, -7), true)).rejects.toThrow("Only today and the 6 days before can be ticked");
  expect(await countTicks()).toBe(before);
});

test("[utest->ac~streakly.tick-window.future~1] a tick tomorrow is refused", async () => {
  const id = await addHabit("Stretch", 0, today);
  await expect(setTick(id, addDays(today, 1), true)).rejects.toThrow();
  expect(await isTicked(id, addDays(today, 1))).toBe(false);
});

test("[utest->ac~streakly.tick-window.edge~1] a tick 6 days back is stored", async () => {
  const id = await addHabit("Stretch", 0, today);
  await setTick(id, addDays(today, -6), true);
  expect(await isTicked(id, addDays(today, -6))).toBe(true);
});

test("[utest->ac~streakly.streaks.current-yesterday~1] ticks on the 3 days before today, none today: 3", () => {
  expect(current([addDays(today, -1), addDays(today, -2), addDays(today, -3)], today)).toBe(3);
});

test("[utest->ac~streakly.streaks.best~1] 4 days in a row, a gap, then 2: best is 4", () => {
  const days = [0, 1, 3, 4, 5, 6].map((n) => addDays(today, -n));
  expect(best(days)).toBe(4);
});

test("[utest->ac~streakly.habit-name.store-max~1] a 41-character name is refused and nothing is stored", async () => {
  await expect(addHabit("x".repeat(41), 0, today)).rejects.toThrow("Keep the name to 40 characters");
  expect((await loadList()).habits).toHaveLength(0);
});

test("[utest->ac~streakly.reorder.store~1] the order 3, 1, 2 loads as 3, 1, 2", async () => {
  const ids = [await addHabit("A", 0, today), await addHabit("B", 0, today), await addHabit("C", 0, today)];
  expect(ids).toEqual([1, 2, 3]);
  await reorder([3, 1, 2]);
  expect((await loadList()).habits.map((h) => h.id)).toEqual([3, 1, 2]);
});

test("[utest->ac~streakly.save-error.intended-state~1] retrying a tick already stored keeps exactly 1 tick", async () => {
  const id = await addHabit("Stretch", 0, today);
  const yesterday = addDays(today, -1);
  await setTick(id, yesterday, true);
  const change = { habitId: id, day: yesterday, ticked: true };
  await remember(change);
  await saveTick(change);
  expect(await isTicked(id, yesterday)).toBe(true);
  expect((await ticksOf(id)).filter((d) => d === yesterday)).toHaveLength(1);
  expect(await failedTick()).toBeNull();
});

test("[utest->ac~streakly.save-error.original-day~1] a retried untick from before midnight unticks its own day only", async () => {
  const id = await addHabit("Stretch", 0, today);
  const before = addDays(today, -1);
  await setTick(id, before, true);
  await setTick(id, today, true);
  const change = { habitId: id, day: before, ticked: false };
  await remember(change);
  await saveTick(change);
  expect(await isTicked(id, before)).toBe(false);
  expect(await isTicked(id, today)).toBe(true);
});

test("[utest->ac~streakly.failed-tick-kept.restart~1] a failed tick is remembered in storage and Try again stores it", async () => {
  const id = await addHabit("Stretch", 0, today);
  setWritesFail(true);
  await expect(toggleTick(id, today)).rejects.toBeInstanceOf(TickNotSaved);
  setWritesFail(false);
  // the app starts again: what it knows comes from storage
  const remembered = await failedTick();
  expect(remembered).toEqual({ habitId: id, day: today, ticked: true });
  await saveTick(remembered!);
  expect(await isTicked(id, today)).toBe(true);
  expect(await failedTick()).toBeNull();
});

test("[utest->ac~streakly.failed-tick-kept.unblocks~1] a failed tick 7 days back doesn't block a tick today", async () => {
  const stretch = await addHabit("Stretch", 0, today);
  const read = await addHabit("Read", 0, today);
  await remember({ habitId: stretch, day: addDays(today, -7), ticked: true });
  await setTick(read, today, true);
  expect(await isTicked(read, today)).toBe(true);
});

test("[utest->ac~streakly.no-old-ticks.store~1] an untick 10 days back is refused and nothing changes", async () => {
  const id = await addHabit("Stretch", 0, today);
  const old = addDays(today, -10);
  await (await open()).run("INSERT INTO ticks (habit_id, date) VALUES (?, ?);", id, old);
  await expect(setTick(id, old, false)).rejects.toThrow();
  await expect(toggleTick(id, old)).rejects.toThrow();
  expect(await isTicked(id, old)).toBe(true);
  expect(await countTicks()).toBe(1);
});

test("[utest->ac~streakly.no-lost-tick.quick-taps~1] two quick taps tick and untick: no tick stored", async () => {
  const id = await addHabit("Stretch", 0, today);
  const [a, b] = await Promise.all([toggleTick(id, today), toggleTick(id, today)]);
  expect([a, b]).toEqual([true, false]);
  expect(await isTicked(id, today)).toBe(false);
});

test("[utest->ac~streakly.no-partial-delete.ticks~1] deleting Stretch removes all 3 ticks, one 30 days back", async () => {
  const id = await addHabit("Stretch", 0, today);
  await setTick(id, today, true);
  await setTick(id, addDays(today, -1), true);
  await (await open()).run("INSERT INTO ticks (habit_id, date) VALUES (?, ?);", id, addDays(today, -30));
  expect(await countTicks(id)).toBe(3);
  await deleteHabit(id);
  expect(await countTicks(id)).toBe(0);
});

test("[utest->ac~streakly.no-partial-delete.fail~1] storage failing partway through a delete keeps the habit and its 3 ticks", async () => {
  const id = await addHabit("Stretch", 0, today);
  for (const n of [0, 1, 2]) await setTick(id, addDays(today, -n), true);
  db.failWhen((sql) => sql.startsWith("DELETE FROM habits"));
  await expect(deleteHabit(id)).rejects.toThrow();
  db.failWhen(null);
  expect((await loadList()).habits.map((h) => h.name)).toEqual(["Stretch"]);
  expect(await countTicks(id)).toBe(3);
});

test("[utest->ac~streakly.streaks.current-gap~1] ticks today and 2 days ago, none yesterday: 1", () => {
  expect(current([today, addDays(today, -2)], today)).toBe(1);
});

test("[utest->ac~streakly.habit-name.trim~1] \"  Read  \" is stored as \"Read\"", async () => {
  await addHabit("  Read  ", 0, today);
  expect((await loadList()).habits[0].name).toBe("Read");
});
