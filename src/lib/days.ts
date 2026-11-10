// Calendar days on the phone's clock, as "YYYY-MM-DD" strings. A day runs from local midnight to
// local midnight; dates are built from the local year, month and day, never from UTC.

export type Day = string;

const pad = (n: number) => String(n).padStart(2, "0");

export function dayOf(date: Date): Day {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function today(now: Date = new Date()): Day {
  return dayOf(now);
}

/** Local midnight at the start of `day`. */
export function toDate(day: Day): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function isDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return dayOf(toDate(value)) === value;
}

export function addDays(day: Day, n: number): Day {
  const date = toDate(day);
  return dayOf(new Date(date.getFullYear(), date.getMonth(), date.getDate() + n));
}

/** The last 7 days, from 6 days ago to today. */
export function lastSeven(todayDay: Day): Day[] {
  return [-6, -5, -4, -3, -2, -1, 0].map((n) => addDays(todayDay, n));
}

/** Only today and the 6 days before can be ticked. */
export function canTick(day: Day, todayDay: Day): boolean {
  return isDay(day) && lastSeven(todayDay).includes(day);
}

export function weekdayShort(day: Day, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(toDate(day));
}

export function dayNumber(day: Day): number {
  return toDate(day).getDate();
}

export function longDate(day: Day, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }).format(toDate(day));
}

/** Milliseconds from `now` to the next local midnight. */
export function msToMidnight(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return Math.max(0, next.getTime() - now.getTime());
}
