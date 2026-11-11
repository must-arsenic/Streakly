import { afterEach, beforeEach, expect, test } from "@jest/globals";

import { migrate, open, useDbForTests } from "./db";
import { today as todayDay } from "./days";
import { clearFaults, setSlowFail, setWritesFail } from "./faults";
import { nodeDb } from "./node-db.testutil";
import { addHabit, failedTick, isTicked, toggleTick } from "./store";
import { type Failed, saveQueue } from "./use-save";

beforeEach(async () => {
  useDbForTests(nodeDb());
  await migrate(await open());
});
afterEach(() => {
  clearFaults();
  useDbForTests(null);
});

function queue() {
  const state: { failed: Failed | null; pending: number } = { failed: null, pending: 0 };
  const save = saveQueue(
    (update) => void (state.failed = update(state.failed)),
    (delta) => void (state.pending += delta),
  );
  return { state, save };
}

test("[utest->ac~streakly.failed-tick-kept.waiting-refused~1] a tick waiting while another fails is refused", async () => {
  const today = todayDay();
  const stretch = await addHabit("Stretch", 0, today);
  const read = await addHabit("Read", 0, today);
  const { state, save } = queue();
  setWritesFail(true);
  const first = save(() => toggleTick(stretch, today), { tick: true });
  const second = save(
    async () => {
      setWritesFail(false);
      await toggleTick(read, today);
    },
    { tick: true },
  );
  expect(await first).toBe(false);
  expect(await second).toBe(false);
  setWritesFail(false);
  expect(await isTicked(read, today)).toBe(false);
  expect(await failedTick()).toEqual({ habitId: stretch, day: today, ticked: true });
  expect(state.failed?.tick).toBe(true);
  expect(state.pending).toBe(0);
  // a tick made after the failure runs (and is refused by the store until the failed one saves)
  await state.failed?.run();
  expect(await save(() => toggleTick(read, today), { tick: true })).toBe(true);
  expect(await isTicked(read, today)).toBe(true);
});

test("a slow failing tick (the next-tick-fails-slowly seed) refuses the tick waiting behind it", async () => {
  const today = todayDay();
  const stretch = await addHabit("Stretch", 0, today);
  const read = await addHabit("Read", 0, today);
  const { save } = queue();
  setSlowFail(true);
  const first = save(() => toggleTick(stretch, today), { tick: true });
  const second = save(() => toggleTick(read, today), { tick: true });
  expect(await first).toBe(false);
  expect(await second).toBe(false);
  expect(await isTicked(read, today)).toBe(false);
  expect(await isTicked(stretch, today)).toBe(false);
}, 10_000);
