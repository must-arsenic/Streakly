// Calendar days on the phone's clock, as "YYYY-MM-DD" strings. A day runs from local midnight to
// local midnight; dates are built from the local year, month and day, never from UTC.

export type Day = string;

const pad = (n: number) => String(n).padStart(2, "0");

export function dayOf(date: Date): Day {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * A day given as "YYYY-MM-DD" (anything after the date is ignored) or as a Date. A Date at exactly
 * UTC midnight is a date-only value (`new Date("2026-11-09")`): its UTC date is the day. Any other
 * Date is a moment on the phone's clock: its local date is the day.
 */
export function asDay(day: Day | Date): Day {
  if (typeof day === "string") return day.slice(0, 10);
  const utcMidnight = day.getUTCHours() === 0 && day.getUTCMinutes() === 0 && day.getUTCSeconds() === 0 && day.getUTCMilliseconds() === 0;
  return utcMidnight ? day.toISOString().slice(0, 10) : dayOf(day);
}

// "Now" is read through Date.now(), so a stubbed clock is the clock.
export function today(now: Date = new Date(Date.now())): Day {
  return dayOf(now);
}

/** Local midnight at the start of `day`. */
export function toDate(day: Day | Date): Date {
  const [y, m, d] = asDay(day).split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function isDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return dayOf(toDate(value)) === value;
}

export function addDays(day: Day | Date, n: number): Day {
  const date = toDate(day);
  return dayOf(new Date(date.getFullYear(), date.getMonth(), date.getDate() + n));
}

/** The last 7 days, from 6 days ago to today. */
export function lastSeven(todayDay: Day | Date): Day[] {
  return [-6, -5, -4, -3, -2, -1, 0].map((n) => addDays(todayDay, n));
}

/** Only today and the 6 days before can be ticked. */
export function canTick(day: Day | Date, todayDay: Day | Date = today()): boolean {
  return isDay(asDay(day)) && lastSeven(todayDay).includes(asDay(day));
}

export function weekdayShort(day: Day | Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(toDate(day));
}

export function dayNumber(day: Day | Date): number {
  return toDate(day).getDate();
}

export function longDate(day: Day, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }).format(toDate(day));
}

/** Milliseconds from `now` to the next local midnight. */
export function msToMidnight(now: Date = new Date(Date.now())): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return Math.max(0, next.getTime() - now.getTime());
}
