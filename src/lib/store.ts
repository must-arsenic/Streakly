// Habits, ticks and settings on the phone. Every change is one transaction over everything it
// touches: it is saved whole, or nothing is. Screens show a change only after it is saved.
import { type Db, open } from "./db";
import { canTick, type Day, today } from "./days";
import { readPoint, writePoint } from "./faults";

export const NAME_MAX = 40;
export const COLOURS = 8;

export type Theme = "system" | "light" | "dark";
export type Habit = { id: number; name: string; colour: number; position: number; createdOn: Day };
export type Settings = { theme: Theme; guideDone: boolean };
/** The habits in list order, with each habit's ticked days. */
export type HabitList = { habits: Habit[]; ticks: Record<number, Day[]> };

export const emptyList: HabitList = { habits: [], ticks: {} };
export const defaultSettings: Settings = { theme: "system", guideDone: false };

// Changes are announced, so every screen showing the data reads it again. `fresh` (the test
// hooks) means the stored data was replaced: screens show their loading state while they read.
const listeners = new Set<(fresh: boolean) => void>();
export function onChange(listener: (fresh: boolean) => void): () => void {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}
export function announce(fresh = false): void {
  for (const listener of listeners) listener(fresh);
}

type HabitRow = { id: number; name: string; colour: number; position: number; created_on: string };
const toHabit = (r: HabitRow): Habit => ({ id: r.id, name: r.name, colour: r.colour, position: r.position, createdOn: r.created_on });

export function cleanName(name: string): string {
  return name.trim();
}

export function nameError(name: string): string | null {
  const clean = cleanName(name);
  if (clean.length === 0) return "Give your habit a name";
  if (clean.length > NAME_MAX) return `Keep the name to ${NAME_MAX} characters`;
  return null;
}

function checkHabit(name: string, colour: number): string {
  const error = nameError(name);
  if (error) throw new RangeError(error);
  if (!Number.isInteger(colour) || colour < 0 || colour >= COLOURS) throw new RangeError("Pick one of the 8 colours");
  return cleanName(name);
}

export async function loadList(): Promise<HabitList> {
  readPoint();
  const db = await open();
  const habits = (await db.all<HabitRow>("SELECT * FROM habits ORDER BY position, id;")).map(toHabit);
  const rows = await db.all<{ habit_id: number; date: string }>("SELECT habit_id, date FROM ticks ORDER BY date;");
  const ticks: Record<number, Day[]> = {};
  for (const h of habits) ticks[h.id] = [];
  for (const r of rows) ticks[r.habit_id]?.push(r.date);
  return { habits, ticks };
}

export async function loadHabit(id: number): Promise<Habit | null> {
  const db = await open();
  const rows = await db.all<HabitRow>("SELECT * FROM habits WHERE id = ?;", id);
  return rows[0] ? toHabit(rows[0]) : null;
}

/** A habit by its id, or else by its name (the first in list order, ignoring case). */
export async function findHabit(idOrName: string): Promise<Habit | null> {
  const key = idOrName.trim();
  if (/^\d+$/.test(key)) {
    const byId = await loadHabit(Number(key));
    if (byId) return byId;
  }
  const db = await open();
  const rows = await db.all<HabitRow>("SELECT * FROM habits WHERE lower(name) = lower(?) ORDER BY position, id LIMIT 1;", key);
  return rows[0] ? toHabit(rows[0]) : null;
}

export async function loadSettings(): Promise<Settings> {
  const db = await open();
  const rows = await db.all<{ key: string; value: string }>("SELECT key, value FROM kv WHERE key IN ('theme', 'guideDone');");
  const kv = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const theme: Theme = kv.theme === "light" || kv.theme === "dark" ? kv.theme : "system";
  return { theme, guideDone: kv.guideDone === "1" };
}

export async function countTicks(habitId?: number): Promise<number> {
  const db = await open();
  const rows =
    habitId === undefined
      ? await db.all<{ n: number }>("SELECT COUNT(*) AS n FROM ticks;")
      : await db.all<{ n: number }>("SELECT COUNT(*) AS n FROM ticks WHERE habit_id = ?;", habitId);
  return rows[0]?.n ?? 0;
}

async function setKv(db: Db, key: string, value: string): Promise<void> {
  await db.run("INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value;", key, value);
}

/** Adds a habit at the end of the list; returns its id. */
export async function addHabit(name: string, colour: number, createdOn: Day): Promise<number> {
  const clean = checkHabit(name, colour);
  const db = await open();
  let id = 0;
  await db.tx(async (t = db) => {
    const max = await t.all<{ p: number | null }>("SELECT MAX(position) AS p FROM habits;");
    writePoint();
    await t.run("INSERT INTO habits (name, colour, position, created_on) VALUES (?, ?, ?, ?);", clean, colour, (max[0]?.p ?? -1) + 1, createdOn);
    const row = await t.all<{ id: number }>("SELECT last_insert_rowid() AS id;");
    id = row[0].id;
  });
  announce();
  return id;
}

export async function updateHabit(id: number, name: string, colour: number): Promise<void> {
  const clean = checkHabit(name, colour);
  const db = await open();
  await db.tx(async (t = db) => {
    writePoint();
    await t.run("UPDATE habits SET name = ?, colour = ? WHERE id = ?;", clean, colour, id);
  });
  announce();
}

/** Removes the habit and all its ticks, together. */
export async function deleteHabit(id: number): Promise<void> {
  const db = await open();
  await db.tx(async (t = db) => {
    await t.run("DELETE FROM ticks WHERE habit_id = ?;", id);
    writePoint();
    await t.run("DELETE FROM habits WHERE id = ?;", id);
  });
  announce();
}

/**
 * Ticks or unticks a habit on a day; only today and the 6 days before are allowed, checked against
 * the phone's date when the save runs (so a retry the next day is checked again).
 */
export async function setTick(habitId: number, day: Day, ticked: boolean, todayDay: Day = today()): Promise<void> {
  if (!canTick(day, todayDay)) throw new RangeError("Only today and the 6 days before can be ticked");
  const db = await open();
  await db.tx(async (t = db) => {
    writePoint();
    if (ticked) await t.run("INSERT OR IGNORE INTO ticks (habit_id, date) SELECT id, ? FROM habits WHERE id = ?;", day, habitId);
    else await t.run("DELETE FROM ticks WHERE habit_id = ? AND date = ?;", habitId, day);
  });
  announce();
}

export async function isTicked(habitId: number, day: Day): Promise<boolean> {
  const db = await open();
  const rows = await db.all<{ n: number }>("SELECT COUNT(*) AS n FROM ticks WHERE habit_id = ? AND date = ?;", habitId, day);
  return (rows[0]?.n ?? 0) > 0;
}

/** A tick that couldn't be saved: what it was, so "Try again" saves exactly that. */
export type FailedTick = { habitId: number; day: Day; ticked: boolean };

/** The error of a failed tick, carrying the change to try again. */
export class TickNotSaved extends Error {
  constructor(readonly tick: FailedTick, cause: unknown) {
    super("Couldn't save the tick", { cause });
  }

  /** Try again: the same tick, not another flip. */
  retry = () => saveTick(this.tick);
}

/**
 * Flips a habit's tick on a day, from what is stored when the save runs (so two quick taps tick
 * and untick). A failure throws TickNotSaved and remembers the tick, so it can be tried again,
 * even after the app starts again.
 */
export async function toggleTick(habitId: number, day: Day, todayDay: Day = today()): Promise<boolean> {
  if (!canTick(day, todayDay)) throw new RangeError("Only today and the 6 days before can be ticked");
  const db = await open();
  const made: { tick: FailedTick | null } = { tick: null };
  try {
    // the read and the write in one transaction: nothing can tick in between
    await db.tx(async (t = db) => {
      const rows = await t.all<{ n: number }>("SELECT COUNT(*) AS n FROM ticks WHERE habit_id = ? AND date = ?;", habitId, day);
      const tick = (made.tick = { habitId, day, ticked: (rows[0]?.n ?? 0) === 0 });
      writePoint();
      if (tick.ticked) await t.run("INSERT OR IGNORE INTO ticks (habit_id, date) SELECT id, ? FROM habits WHERE id = ?;", day, habitId);
      else await t.run("DELETE FROM ticks WHERE habit_id = ? AND date = ?;", habitId, day);
    });
  } catch (e) {
    if (!made.tick) throw e;
    await rememberFailedTick(made.tick);
    throw new TickNotSaved(made.tick, e);
  }
  await forgetFailedTick();
  announce();
  return made.tick?.ticked ?? false;
}

/** Saves a tick change; on failure remembers it (see `failedTick`). */
export async function saveTick(tick: FailedTick): Promise<void> {
  try {
    await setTick(tick.habitId, tick.day, tick.ticked);
  } catch (e) {
    if (!(e instanceof RangeError)) await rememberFailedTick(tick);
    throw new TickNotSaved(tick, e);
  }
  await forgetFailedTick();
}

const FAILED_TICK = "failedTick";

// Kept outside the save's own transaction: if storage takes it, the next start can offer it again.
async function rememberFailedTick(tick: FailedTick): Promise<void> {
  try {
    await setKv(await open(), FAILED_TICK, JSON.stringify(tick));
  } catch {
    // storage refused this too: the change is offered again until the app closes
  }
}

async function forgetFailedTick(): Promise<void> {
  try {
    const db = await open();
    await db.run("DELETE FROM kv WHERE key = ?;", FAILED_TICK);
  } catch {
    // nothing to forget
  }
}

/** The tick that couldn't be saved before the app last closed, if any. */
export async function failedTick(): Promise<FailedTick | null> {
  const db = await open();
  const rows = await db.all<{ value: string }>("SELECT value FROM kv WHERE key = ?;", FAILED_TICK);
  if (!rows[0]) return null;
  try {
    return JSON.parse(rows[0].value) as FailedTick;
  } catch {
    return null;
  }
}

/** Saves a new list order: `ids` from first to last. */
export async function reorder(ids: number[]): Promise<void> {
  const db = await open();
  await db.tx(async (t = db) => {
    for (let i = 0; i < ids.length; i += 1) {
      await t.run("UPDATE habits SET position = ? WHERE id = ?;", i, ids[i]);
      if (i === 0) writePoint();
    }
  });
  announce();
}

export async function setTheme(theme: Theme): Promise<void> {
  const db = await open();
  await db.tx(async (t = db) => {
    writePoint();
    await setKv(t, "theme", theme);
  });
  announce();
}

export async function setGuideDone(done: boolean): Promise<void> {
  const db = await open();
  await db.tx(async (t = db) => {
    writePoint();
    await setKv(t, "guideDone", done ? "1" : "0");
  });
  announce();
}

/** Removes every habit and tick, resets the theme to "System" and brings the guide back. */
export async function deleteAll(): Promise<void> {
  const db = await open();
  await db.tx(async (t = db) => {
    await t.run("DELETE FROM ticks;");
    writePoint();
    await t.run("DELETE FROM habits;");
    await setKv(t, "theme", "system");
    await setKv(t, "guideDone", "0");
  });
  announce();
}
