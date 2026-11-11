import { afterEach, beforeEach, expect, test } from "@jest/globals";

import { migrate, open, useDbForTests } from "./db";
import { addDays, today } from "./days";
import { failedTick, loadList } from "./store";
import { act } from "./test-hooks";
import { nodeDb } from "./node-db.testutil";

beforeEach(async () => {
  process.env.EXPO_PUBLIC_AIOS_TEST_HOOKS = "1";
  useDbForTests(nodeDb());
  await migrate(await open());
});
afterEach(() => {
  useDbForTests(null);
  delete process.env.EXPO_PUBLIC_AIOS_TEST_HOOKS;
});

test("seed stretch-failed-tick remembers a failed tick on Stretch today", async () => {
  expect(await act("seed", { name: "stretch-failed-tick" })).toBe(true);
  const { habits } = await loadList();
  expect(habits.map((h) => h.name)).toEqual(["Stretch", "Read"]);
  expect(await failedTick()).toEqual({ habitId: habits[0].id, day: today(), ticked: true });
});

test("seed stretch-failed-tick-expired remembers a failed tick 7 days back", async () => {
  await act("seed", { name: "stretch-failed-tick-expired" });
  expect((await failedTick())?.day).toBe(addDays(today(), -7));
});

test("seed stretch-3-ticks keeps a tick 30 days back", async () => {
  await act("seed", { name: "stretch-3-ticks" });
  const { habits, ticks } = await loadList();
  expect(ticks[habits[0].id]).toHaveLength(3);
});

test("an unknown seed does nothing", async () => {
  expect(await act("seed", { name: "nowhere" })).toBe(false);
  expect((await loadList()).habits).toEqual([]);
});
