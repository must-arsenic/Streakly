import { expect, test } from "@jest/globals";

import { addDays } from "./days";
import { best, current } from "./streaks";

const T = "2026-11-10";
const ago = (...ns: number[]) => ns.map((n) => addDays(T, -n));

test("[utest->ac~streakly.streak-current.today-open~1] ticked the 4 days before today, not today: 4", () => {
  expect(current(ago(1, 2, 3, 4), T)).toBe(4);
});

test("[utest->ac~streakly.streak-current.missed~1] ticked 2 and 3 days ago only: 0", () => {
  expect(current(ago(2, 3), T)).toBe(0);
});

test("[utest->ac~streakly.streak-current.with-today~1] ticked today and the 2 days before: 3", () => {
  expect(current(ago(0, 1, 2), T)).toBe(3);
});

test("[utest->ac~streakly.streak-best.longest~1] runs of 3, 7 then 2 ending today: best 7, current 2", () => {
  const dates = [...ago(20, 19, 18), ...ago(15, 14, 13, 12, 11, 10, 9), ...ago(1, 0)];
  expect(best(dates)).toBe(7);
  expect(current(dates, T)).toBe(2);
  expect(best([])).toBe(0);
});
