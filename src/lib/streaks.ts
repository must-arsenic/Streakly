// Streaks, worked out again from the ticks every time: never stored.
import { addDays, type Day, dayOf, today } from "./days";

/** A day as "YYYY-MM-DD"; a Date counts as its local calendar day. */
function asDay(day: Day | Date): Day {
  return typeof day === "string" ? day.slice(0, 10) : dayOf(day);
}

/** Days in a row ticked, ending today if today is ticked, else yesterday. */
export function current(dates: Iterable<Day | Date>, todayDay: Day | Date = today()): number {
  const ticked = new Set(Array.from(dates, asDay));
  const now = asDay(todayDay);
  let day = ticked.has(now) ? now : addDays(now, -1);
  let n = 0;
  while (ticked.has(day)) {
    n += 1;
    day = addDays(day, -1);
  }
  return n;
}

/** The longest unbroken run of ticked days. */
export function best(dates: Iterable<Day | Date>): number {
  const ticked = new Set(Array.from(dates, asDay));
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

export { best as bestStreak, current as currentStreak };
