// Streaks, worked out again from the ticks every time: never stored.
import { addDays, type Day } from "./days";

/** Days in a row ticked, ending today if today is ticked, else yesterday. */
export function current(dates: Iterable<Day>, todayDay: Day): number {
  const ticked = new Set(dates);
  let day = ticked.has(todayDay) ? todayDay : addDays(todayDay, -1);
  let n = 0;
  while (ticked.has(day)) {
    n += 1;
    day = addDays(day, -1);
  }
  return n;
}

/** The longest unbroken run of ticked days. */
export function best(dates: Iterable<Day>): number {
  const ticked = new Set(dates);
  let longest = 0;
  for (const day of ticked) {
    if (ticked.has(addDays(day, -1))) continue;
    let n = 0;
    let d = day;
    while (ticked.has(d)) {
      n += 1;
      d = addDays(d, 1);
    }
    longest = Math.max(longest, n);
  }
  return longest;
}
