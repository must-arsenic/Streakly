import { afterEach, expect, jest, test } from "@jest/globals";

import { migrate, open, useDbForTests } from "./db";
import { addDays, canTick, dayNumber, msToMidnight, today } from "./days";
import { nodeDb } from "./node-db.testutil";
import { addHabit, loadList, setTick } from "./store";
import { current } from "./streaks";

afterEach(() => {
  useDbForTests(null);
});

test("[utest->ac~streakly.streak-current.midnight~1] the day turns at local midnight", () => {
  const before = new Date(2026, 10, 10, 23, 59, 0);
  const after = new Date(2026, 10, 11, 0, 0, 30);
  const ticks = [today(before)];
  expect(today(before)).toBe("2026-11-10");
  expect(today(after)).toBe("2026-11-11");
  expect(ticks.includes(today(after))).toBe(false);
  expect(current(ticks, today(after))).toBe(1);
  expect(msToMidnight(before)).toBe(60_000);
});

/** today() and the week's days for one instant, worked out by Node in another time zone. */
function inZone(tz: string, instant: string): { today: string; week: string[]; local: string } {
  const { spawnSync } = jest.requireActual<{ spawnSync: (cmd: string, args: string[], o: object) => { stdout: { toString(): string }; status: number } }>("node:child_process");
  const { resolve } = jest.requireActual<{ resolve: (...p: string[]) => string }>("node:path");
  const days = resolve(process.cwd(), "src/lib/days.ts");
  const script = `import { today, lastSeven, dayOf } from ${JSON.stringify(days)};
    const now = new Date(${JSON.stringify(instant)});
    console.log(JSON.stringify({ today: today(now), week: lastSeven(today(now)), local: dayOf(now) }));`;
  const out = spawnSync(process.execPath, ["--input-type=module", "-e", script], { env: { ...process.env, TZ: tz } });
  return JSON.parse(out.stdout.toString());
}

test("[utest->ac~streakly.tick-dates.time-zone~1] a tick keeps its calendar date when the time zone changes", async () => {
  useDbForTests(nodeDb());
  await migrate(await open());
  // 2026-11-10 08:00 in UTC+1 (07:00 UTC): the person ticks yesterday, 2026-11-09
  const instant = "2026-11-10T07:00:00Z";
  const plusOne = inZone("Etc/GMT-1", instant);
  expect(plusOne.today).toBe("2026-11-10");
  const id = await addHabit("Read", 0, plusOne.today);
  await setTick(id, addDays(plusOne.today, -1), true, plusOne.today);
  expect((await loadList()).ticks[id]).toEqual(["2026-11-09"]);

  // the phone moves to UTC-8: the same instant is 2026-11-09 23:00 there
  const minusEight = inZone("Etc/GMT+8", instant);
  expect(minusEight.today).toBe("2026-11-09");
  expect((await loadList()).ticks[id]).toEqual(["2026-11-09"]);
  expect(minusEight.week).toContain("2026-11-09");
  expect(minusEight.week[6]).toBe("2026-11-09");
  expect(dayNumber("2026-11-09")).toBe(9);
});

test("[utest->ac~streakly.no-out-of-range-ticks.refused~1] tomorrow and 7 days ago are refused", async () => {
  const db = nodeDb();
  useDbForTests(db);
  await migrate(await open());
  const T = "2026-11-10";
  expect(canTick(T, T)).toBe(true);
  expect(canTick(addDays(T, -6), T)).toBe(true);
  expect(canTick(addDays(T, 1), T)).toBe(false);
  expect(canTick(addDays(T, -7), T)).toBe(false);
  const id = await addHabit("Water", 0, T);
  await expect(setTick(id, addDays(T, 1), true, T)).rejects.toThrow(RangeError);
  await expect(setTick(id, addDays(T, -7), true, T)).rejects.toThrow(RangeError);
  expect((await loadList()).ticks[id]).toEqual([]);
});

test("[utest->ac~streakly.no-out-of-range-ticks.refused~1] a tick is checked against the date when it is saved", async () => {
  useDbForTests(nodeDb());
  await migrate(await open());
  const now = today();
  const id = await addHabit("Water", 0, now);
  // a change made 7 days ago for its own today, retried now, is refused
  await expect(setTick(id, addDays(now, -7), true)).rejects.toThrow(RangeError);
  await expect(setTick(id, addDays(now, 1), true)).rejects.toThrow(RangeError);
  await setTick(id, now, true);
  expect((await loadList()).ticks[id]).toEqual([now]);
});

test("a date-only Date is the same day in every time zone", () => {
  const { spawnSync } = jest.requireActual<{ spawnSync: (cmd: string, args: string[], o: object) => { stdout: { toString(): string } } }>("node:child_process");
  const { resolve } = jest.requireActual<{ resolve: (...p: string[]) => string }>("node:path");
  const days = resolve(process.cwd(), "src/lib/days.ts");
  const script = `import { asDay, addDays, lastSeven } from ${JSON.stringify(days)};
    console.log(JSON.stringify([asDay(new Date("2026-11-10")), addDays(new Date("2026-11-10"), -1), lastSeven(new Date("2026-11-10"))[6], asDay(new Date(2026, 10, 10, 23, 30))]));`;
  for (const tz of ["America/Los_Angeles", "Asia/Tokyo", "UTC"]) {
    const out = spawnSync(process.execPath, ["--input-type=module", "-e", script], { env: { ...process.env, TZ: tz } });
    expect([tz, ...JSON.parse(out.stdout.toString())]).toEqual([tz, "2026-11-10", "2026-11-09", "2026-11-10", "2026-11-10"]);
  }
});
