import { afterEach, beforeEach, expect, test } from "@jest/globals";

import { migrate, open, useDbForTests } from "./db";
import { addDays } from "./days";
import { clearFaults, setWritesFail } from "./faults";
import { nodeDb } from "./node-db.testutil";
import { addHabit, countTicks, deleteAll, deleteHabit, loadList, loadSettings, reorder, setGuideDone, setTheme, setTick } from "./store";

const T = "2026-11-10";
let db: ReturnType<typeof nodeDb>;

beforeEach(async () => {
  db = nodeDb();
  useDbForTests(db);
  await migrate(await open());
});
afterEach(() => {
  clearFaults();
  useDbForTests(null);
});

async function stretchWithFive(): Promise<number> {
  const id = await addHabit("Stretch", 2, T);
  for (let n = 0; n < 5; n += 1) await setTick(id, addDays(T, -n), true, T);
  return id;
}

async function threeHabitsDark(): Promise<void> {
  for (const name of ["Water", "Read", "Stretch"]) {
    const id = await addHabit(name, 0, T);
    await setTick(id, T, true, T);
    await setTick(id, addDays(T, -1), true, T);
  }
  await setTheme("dark");
  await setGuideDone(true);
}

test("[utest->ac~streakly.habit-delete.removes~1] deleting a habit removes it and its ticks", async () => {
  const keep = await addHabit("Water", 0, T);
  await setTick(keep, T, true, T);
  const id = await stretchWithFive();
  expect(await countTicks(id)).toBe(5);
  await deleteHabit(id);
  const list = await loadList();
  expect(list.habits.map((h) => h.name)).toEqual(["Water"]);
  expect(await countTicks(id)).toBe(0);
  expect(await countTicks(keep)).toBe(1);
});

test("[utest->ac~streakly.save-errors.delete-habit~1] a failed deletion keeps the habit and its 5 ticks", async () => {
  const id = await stretchWithFive();
  setWritesFail(true);
  await expect(deleteHabit(id)).rejects.toThrow();
  const list = await loadList();
  expect(list.habits.map((h) => h.name)).toEqual(["Stretch"]);
  expect(await countTicks(id)).toBe(5);
});

test("[utest->ac~streakly.no-partial-saves.delete~1] storage failing partway through a deletion removes nothing", async () => {
  const id = await stretchWithFive();
  // the ticks go first; the habit row's delete fails
  db.failWhen((sql) => sql.startsWith("DELETE FROM habits"));
  await expect(deleteHabit(id)).rejects.toThrow();
  db.failWhen(null);
  expect((await loadList()).habits).toHaveLength(1);
  expect(await countTicks(id)).toBe(5);
});

test("[utest->ac~streakly.delete-all.wipes~1] delete all wipes habits and ticks and resets the theme and guide", async () => {
  await threeHabitsDark();
  await deleteAll();
  expect((await loadList()).habits).toHaveLength(0);
  expect(await countTicks()).toBe(0);
  expect(await loadSettings()).toEqual({ theme: "system", guideDone: false });
});

test("[utest->ac~streakly.save-errors.delete-all~1] a failed delete-all keeps everything", async () => {
  await threeHabitsDark();
  setWritesFail(true);
  await expect(deleteAll()).rejects.toThrow();
  expect((await loadList()).habits).toHaveLength(3);
  expect(await countTicks()).toBe(6);
  expect(await loadSettings()).toEqual({ theme: "dark", guideDone: true });
  // and a failure partway through, at the habits' delete
  setWritesFail(false);
  db.failWhen((sql) => sql.startsWith("DELETE FROM habits"));
  await expect(deleteAll()).rejects.toThrow();
  expect(await countTicks()).toBe(6);
});

test("a failed reorder keeps the old order", async () => {
  const ids = [await addHabit("Water", 0, T), await addHabit("Read", 1, T), await addHabit("Stretch", 2, T)];
  setWritesFail(true);
  await expect(reorder([ids[2], ids[0], ids[1]])).rejects.toThrow();
  expect((await loadList()).habits.map((h) => h.name)).toEqual(["Water", "Read", "Stretch"]);
  setWritesFail(false);
  await reorder([ids[2], ids[0], ids[1]]);
  expect((await loadList()).habits.map((h) => h.name)).toEqual(["Stretch", "Water", "Read"]);
});

test("names are trimmed and must be 1 to 40 characters", async () => {
  await expect(addHabit("   ", 0, T)).rejects.toThrow("Give your habit a name");
  await expect(addHabit("x".repeat(41), 0, T)).rejects.toThrow();
  await addHabit("  Read  ", 0, T);
  expect((await loadList()).habits[0].name).toBe("Read");
});

test("[utest->ac~streakly.no-partial-saves.delete~1] saves started together never share a transaction", async () => {
  const id = await stretchWithFive();
  const other = await addHabit("Water", 0, T);
  // the habit's delete fails while a tick save for another habit runs at the same time
  db.failWhen((sql) => sql.startsWith("DELETE FROM habits"));
  const results = await Promise.allSettled([deleteHabit(id), setTick(other, T, true, T), loadList()]);
  db.failWhen(null);
  expect(results[0].status).toBe("rejected");
  expect(results[1].status).toBe("fulfilled");
  expect(await countTicks(id)).toBe(5);
  expect(await countTicks(other)).toBe(1);
});
