import { afterEach, beforeEach, expect, test } from "@jest/globals";

import { migrate, open, useDbForTests } from "./db";
import { addDays, today as todayDay } from "./days";
import { clearFaults, setWritesFail } from "./faults";
import { nodeDb } from "./node-db.testutil";
import {
  addHabit,
  archiveHabit,
  countTicks,
  deleteAll,
  deleteHabit,
  failedTick,
  isTicked,
  loadArchived,
  loadHabit,
  loadList,
  restoreHabit,
  saveTick,
  setTick,
  TickNotSaved,
  toggleTick,
} from "./store";
import { best } from "./streaks";
import { act } from "./test-hooks";

let today: string;

beforeEach(async () => {
  useDbForTests(nodeDb());
  await migrate(await open());
  today = todayDay();
});
afterEach(() => {
  clearFaults();
  useDbForTests(null);
  delete process.env.EXPO_PUBLIC_AIOS_TEST_HOOKS;
});

const names = async () => (await loadList()).habits.map((h) => h.name);

/** A tick on an unticked day that fails to save, so it is remembered. */
async function remember(habitId: number, day: string): Promise<void> {
  setWritesFail(true);
  await expect(toggleTick(habitId, day)).rejects.toBeInstanceOf(TickNotSaved);
  setWritesFail(false);
}

test("archiving keeps the habit and its ticks, marks it archived and leaves it out of the list", async () => {
  const stretch = await addHabit("Stretch", 4, today);
  await addHabit("Read", 0, today);
  await setTick(stretch, today, true);
  await setTick(stretch, addDays(today, -1), true);
  await archiveHabit(stretch);
  expect(await names()).toEqual(["Read"]);
  const stored = await loadHabit(stretch);
  expect(stored?.name).toBe("Stretch");
  expect(stored?.archivedAt).toEqual(expect.any(Number));
  expect(await countTicks(stretch)).toBe(2);
  const archived = await loadArchived();
  expect(archived.habits.map((h) => h.name)).toEqual(["Stretch"]);
  expect(archived.ticks[stretch]).toHaveLength(2);
});

test("[utest->ac~streakly.archive.clears-failed~1] archiving clears its failed tick, and other ticks save again", async () => {
  const stretch = await addHabit("Stretch", 0, today);
  const read = await addHabit("Read", 0, today);
  await remember(stretch, today);
  expect(await failedTick()).toEqual({ habitId: stretch, day: today, ticked: true });
  await expect(toggleTick(read, today)).rejects.toBeInstanceOf(RangeError);
  await archiveHabit(stretch);
  expect(await failedTick()).toBeNull();
  await toggleTick(read, today);
  expect(await isTicked(read, today)).toBe(true);
});

test("archiving another habit keeps the failed tick", async () => {
  const stretch = await addHabit("Stretch", 0, today);
  const read = await addHabit("Read", 0, today);
  await remember(stretch, today);
  await archiveHabit(read);
  expect(await failedTick()).toEqual({ habitId: stretch, day: today, ticked: true });
});

test("a failed archive leaves the habit as it was", async () => {
  const stretch = await addHabit("Stretch", 0, today);
  setWritesFail(true);
  await expect(archiveHabit(stretch)).rejects.toThrow();
  setWritesFail(false);
  expect(await names()).toEqual(["Stretch"]);
  expect((await loadHabit(stretch))?.archivedAt).toBeUndefined();
});

test("[utest->ac~streakly.archived-list.order~1] the most recently archived comes first", async () => {
  const stretch = await addHabit("Stretch", 0, today);
  const read = await addHabit("Read", 0, today);
  await archiveHabit(stretch);
  await archiveHabit(read);
  expect((await loadArchived()).habits.map((h) => h.name)).toEqual(["Read", "Stretch"]);
});

test("restore puts the habit back at its place", async () => {
  await addHabit("Stretch", 0, today);
  const read = await addHabit("Read", 0, today);
  await addHabit("Walk", 0, today);
  await archiveHabit(read);
  expect(await names()).toEqual(["Stretch", "Walk"]);
  await restoreHabit(read);
  expect(await names()).toEqual(["Stretch", "Read", "Walk"]);
  expect((await loadArchived()).habits).toEqual([]);
  expect((await loadHabit(read))?.archivedAt).toBeUndefined();
});

test("[utest->ac~streakly.restore.place-fewer~1] with fewer habits than its place, restore puts it at the end", async () => {
  const stretch = await addHabit("Stretch", 0, today);
  await addHabit("Read", 0, today);
  const walk = await addHabit("Walk", 0, today);
  await archiveHabit(walk);
  await deleteHabit(stretch);
  await restoreHabit(walk);
  expect(await names()).toEqual(["Read", "Walk"]);
});

test("[utest->ac~streakly.restore.keeps-ticks~1] restore keeps the ticks", async () => {
  const stretch = await addHabit("Stretch", 0, today);
  for (const n of [0, 1, 2]) await setTick(stretch, addDays(today, -n), true);
  await archiveHabit(stretch);
  await restoreHabit(stretch);
  expect(await countTicks(stretch)).toBe(3);
  expect((await loadList()).ticks[stretch]).toHaveLength(3);
});

test("a failed restore keeps the habit archived", async () => {
  const stretch = await addHabit("Stretch", 0, today);
  await archiveHabit(stretch);
  setWritesFail(true);
  await expect(restoreHabit(stretch)).rejects.toThrow();
  setWritesFail(false);
  expect((await loadArchived()).habits.map((h) => h.name)).toEqual(["Stretch"]);
  expect(await names()).toEqual([]);
});

test("days spent archived can be ticked after restore, inside the window", async () => {
  const stretch = await addHabit("Stretch", 0, today);
  await archiveHabit(stretch);
  await restoreHabit(stretch);
  await setTick(stretch, addDays(today, -2), true);
  expect(await isTicked(stretch, addDays(today, -2))).toBe(true);
});

test("[utest->ac~streakly.delete-all.archived~1] delete all removes archived habits and their ticks", async () => {
  const stretch = await addHabit("Stretch", 0, today);
  const read = await addHabit("Read", 0, today);
  for (const n of [0, 1, 2]) await setTick(stretch, addDays(today, -n), true);
  await setTick(read, today, true);
  await archiveHabit(stretch);
  await deleteAll();
  expect((await loadList()).habits).toHaveLength(0);
  expect((await loadArchived()).habits).toHaveLength(0);
  expect(await countTicks()).toBe(0);
});

test("[utest->ac~streakly.no-archived-ticks.store~1] an archived habit can't be ticked", async () => {
  const stretch = await addHabit("Stretch", 0, today);
  await archiveHabit(stretch);
  await expect(setTick(stretch, today, true)).rejects.toBeInstanceOf(RangeError);
  await expect(toggleTick(stretch, today)).rejects.toBeInstanceOf(RangeError);
  expect(await isTicked(stretch, today)).toBe(false);
  expect(await failedTick()).toBeNull();
});

test("[utest->ac~streakly.no-archived-ticks.untick~1] an archived habit can't be unticked", async () => {
  const stretch = await addHabit("Stretch", 0, today);
  const yesterday = addDays(today, -1);
  await setTick(stretch, yesterday, true);
  await archiveHabit(stretch);
  await expect(setTick(stretch, yesterday, false)).rejects.toBeInstanceOf(RangeError);
  await expect(toggleTick(stretch, yesterday)).rejects.toBeInstanceOf(RangeError);
  expect(await isTicked(stretch, yesterday)).toBe(true);
});

test("[utest->ac~streakly.failed-tick-kept.blocks~1] other ticks are refused while a failed tick is remembered", async () => {
  const stretch = await addHabit("Stretch", 0, today);
  const read = await addHabit("Read", 0, today);
  await remember(stretch, today);
  await expect(toggleTick(read, today)).rejects.toBeInstanceOf(RangeError);
  await expect(setTick(read, today, true)).rejects.toBeInstanceOf(RangeError);
  expect(await isTicked(read, today)).toBe(false);
  // the failed change itself saves
  await saveTick({ habitId: stretch, day: today, ticked: true });
  expect(await failedTick()).toBeNull();
  await toggleTick(read, today);
  expect(await isTicked(read, today)).toBe(true);
});

test("[utest->ac~streakly.failed-tick-kept.waiting-refused~1] a tick waiting behind a failed one is refused", async () => {
  const stretch = await addHabit("Stretch", 0, today);
  const read = await addHabit("Read", 0, today);
  setWritesFail(true);
  const first = toggleTick(stretch, today);
  const waiting = first.catch(() => undefined).then(() => {
    setWritesFail(false);
    return toggleTick(read, today);
  });
  await expect(first).rejects.toBeInstanceOf(TickNotSaved);
  await expect(waiting).rejects.toBeInstanceOf(RangeError);
  expect(await isTicked(read, today)).toBe(false);
});

test("[utest->ac~streakly.failed-tick-kept.expired~1] an expired retry is refused and forgotten", async () => {
  const stretch = await addHabit("Stretch", 0, today);
  const old = addDays(today, -7);
  const db = await open();
  await db.run("INSERT INTO kv (key, value) VALUES ('failedTick', ?);", JSON.stringify({ habitId: stretch, day: old, ticked: true }));
  await expect(saveTick({ habitId: stretch, day: old, ticked: true })).rejects.toThrow();
  expect(await isTicked(stretch, old)).toBe(false);
  expect(await failedTick()).toBeNull();
});

test("[utest->ac~streakly.delete-habit.clears-failed~1] deleting a habit clears its failed tick", async () => {
  const stretch = await addHabit("Stretch", 0, today);
  await remember(stretch, today);
  await deleteHabit(stretch);
  expect(await failedTick()).toBeNull();
});

test("[utest->ac~streakly.delete-all.clears-failed~1] delete all clears the failed tick", async () => {
  const stretch = await addHabit("Stretch", 0, today);
  await remember(stretch, today);
  await deleteAll();
  expect(await failedTick()).toBeNull();
});

test("the archived seeds", async () => {
  process.env.EXPO_PUBLIC_AIOS_TEST_HOOKS = "1";
  await act("seed", { name: "stretch-archived-id-5" });
  expect((await loadHabit(5))?.archivedAt).toEqual(expect.any(Number));
  await act("reset", {});
  await act("seed", { name: "stretch-read-walk-read-archived" });
  expect(await names()).toEqual(["Stretch", "Walk"]);
  await restoreHabit(2);
  expect(await names()).toEqual(["Stretch", "Read", "Walk"]);
  await act("reset", {});
  await act("seed", { name: "read-walk-archived-third" });
  await restoreHabit((await loadArchived()).habits[0].id);
  expect(await names()).toEqual(["Read", "Walk"]);
  await act("reset", {});
  await act("seed", { name: "stretch-teal-best-4-archived" });
  const archived = await loadArchived();
  expect(archived.habits[0]).toMatchObject({ name: "Stretch", colour: 4 });
  expect(best(archived.ticks[archived.habits[0].id])).toBe(4);
  await act("reset", {});
  await act("seed", { name: "stretch-then-read-archived" });
  expect((await loadArchived()).habits.map((h) => h.name)).toEqual(["Read", "Stretch"]);
  await act("reset", {});
  await act("seed", { name: "stretch-archived-3-ticks-read" });
  expect(await countTicks()).toBe(4);
  expect(await names()).toEqual(["Read"]);
});
