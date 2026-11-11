// Habits, ticks and settings on the phone. Every change is one transaction over everything it
// touches: it is saved whole, or nothing is. Screens show a change only after it is saved.
import { type Db, open } from "./db";
import { canTick, type Day, today } from "./days";
import { archivedReadPoint, readPoint, slowWritePoint, writePoint } from "./faults";

export const NAME_MAX = 40;
export const COLOURS = 8;

export type Theme = "system" | "light" | "dark";
/** `archivedAt` (ms) and `restorePlace` (0-based, among habits that aren't archived) only on an archived habit. */
export type Habit = { id: number; name: string; colour: number; position: number; createdOn: Day; archivedAt?: number; restorePlace?: number };
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

type HabitRow = {
  id: number;
  name: string;
  colour: number;
  position: number;
  created_on: string;
  archived_at?: number | null;
  restore_place?: number | null;
};
const toHabit = (r: HabitRow): Habit => ({
  id: r.id,
  name: r.name,
  colour: r.colour,
  position: r.position,
  createdOn: r.created_on,
  ...(r.archived_at != null ? { archivedAt: r.archived_at, restorePlace: r.restore_place ?? 0 } : {}),
});

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

async function withTicks(db: Db, habits: Habit[]): Promise<HabitList> {
  const rows = await db.all<{ habit_id: number; date: string }>("SELECT habit_id, date FROM ticks ORDER BY date;");
  const ticks: Record<number, Day[]> = {};
  for (const h of habits) ticks[h.id] = [];
  for (const r of rows) ticks[r.habit_id]?.push(r.date);
  return { habits, ticks };
}

/** The habits that aren't archived, in list order, with their ticks. */
export async function loadList(): Promise<HabitList> {
  readPoint();
  const db = await open();
  const habits = (await db.all<HabitRow>("SELECT * FROM habits WHERE archived_at IS NULL ORDER BY position, id;")).map(toHabit);
  return withTicks(db, habits);
}

/** The archived habits, the most recently archived first, with their ticks. */
export async function loadArchived(): Promise<HabitList> {
  archivedReadPoint();
  const db = await open();
  const habits = (await db.all<HabitRow>("SELECT * FROM habits WHERE archived_at IS NOT NULL ORDER BY archived_at DESC, id DESC;")).map(toHabit);
  return withTicks(db, habits);
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

/** Removes the habit and all its ticks, together, and its remembered failed tick. */
export async function deleteHabit(id: number): Promise<void> {
  const db = await open();
  await db.tx(async (t = db) => {
    await t.run("DELETE FROM ticks WHERE habit_id = ?;", id);
    writePoint();
    await t.run("DELETE FROM habits WHERE id = ?;", id);
    if ((await readFailedTick(t))?.habitId === id) await t.run("DELETE FROM kv WHERE key = ?;", FAILED_TICK);
  });
  announce();
}

/**
 * Archives the habit as it is stored: remembers its place among the habits that aren't archived,
 * keeps its ticks and clears its remembered failed tick.
 */
export async function archiveHabit(id: number): Promise<void> {
  const db = await open();
  await db.tx(async (t = db) => {
    const ids = (await t.all<{ id: number }>("SELECT id FROM habits WHERE archived_at IS NULL ORDER BY position, id;")).map((r) => r.id);
    const place = ids.indexOf(id);
    if (place < 0) throw new RangeError("This habit isn't here any more.");
    const last = await t.all<{ at: number | null }>("SELECT MAX(archived_at) AS at FROM habits;");
    // later archives always sort later, even if the clock goes back
    const at = Math.max(Date.now(), (last[0]?.at ?? 0) + 1);
    writePoint();
    await t.run("UPDATE habits SET archived_at = ?, restore_place = ? WHERE id = ?;", at, place, id);
    if ((await readFailedTick(t))?.habitId === id) await t.run("DELETE FROM kv WHERE key = ?;", FAILED_TICK);
  });
  announce();
}

/** Puts an archived habit back at its place, or at the end if fewer habits are left; its ticks stay. */
export async function restoreHabit(id: number): Promise<void> {
  const db = await open();
  await db.tx(async (t = db) => {
    const rows = await t.all<HabitRow>("SELECT * FROM habits WHERE id = ? AND archived_at IS NOT NULL;", id);
    if (!rows[0]) throw new RangeError("This habit isn't archived");
    const ids = (await t.all<{ id: number }>("SELECT id FROM habits WHERE archived_at IS NULL ORDER BY position, id;")).map((r) => r.id);
    ids.splice(Math.min(Math.max(rows[0].restore_place ?? ids.length, 0), ids.length), 0, id);
    writePoint();
    await t.run("UPDATE habits SET archived_at = NULL, restore_place = NULL WHERE id = ?;", id);
    for (let i = 0; i < ids.length; i += 1) await t.run("UPDATE habits SET position = ? WHERE id = ?;", i, ids[i]);
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
    await tickAllowed(t, { habitId, day, ticked }, todayDay);
    await slowWritePoint();
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

/**
 * The error of a failed tick, carrying the change to try again. `cleared`: a retry refused because
 * its day is no longer tickable; the change is forgotten, there is nothing left to try again.
 */
export class TickNotSaved extends Error {
  constructor(
    readonly tick: FailedTick,
    cause: unknown,
    readonly cleared = false,
  ) {
    super("Couldn't save the tick", { cause });
  }

  /** Try again: the same tick, not another flip. */
  retry = () => saveTick(this.tick);
}

/**
 * A tick change refused with nothing stored: its habit is archived, or another failed tick is
 * remembered (`retry` saves that one, which has to go first).
 */
export class TickRefused extends RangeError {
  constructor(
    message: string,
    readonly retry?: () => Promise<void>,
  ) {
    super(message);
  }
}

const same = (a: FailedTick, b: FailedTick) => a.habitId === b.habitId && a.day === b.day && a.ticked === b.ticked;

/**
 * Inside a tick's transaction: refuses a tick on an archived habit, and any tick but the
 * remembered failed one while that one can still be saved (its day tickable, its habit here and
 * not archived).
 */
async function tickAllowed(t: Db, change: FailedTick, todayDay: Day): Promise<void> {
  const archived = async (id: number) =>
    (await t.all<{ archived_at: number | null }>("SELECT archived_at FROM habits WHERE id = ?;", id))[0]?.archived_at;
  if ((await archived(change.habitId)) != null) throw new TickRefused("An archived habit can't be ticked");
  const waiting = await readFailedTick(t);
  if (!waiting || same(waiting, change) || !canTick(waiting.day, todayDay)) return;
  const owner = await archived(waiting.habitId);
  if (owner !== null) return;
  throw new TickRefused("Couldn't save your change", () => saveTick(waiting));
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
      const tick: FailedTick = { habitId, day, ticked: (rows[0]?.n ?? 0) === 0 };
      await tickAllowed(t, tick, todayDay);
      made.tick = tick;
      await slowWritePoint();
      writePoint();
      if (tick.ticked) await t.run("INSERT OR IGNORE INTO ticks (habit_id, date) SELECT id, ? FROM habits WHERE id = ?;", day, habitId);
      else await t.run("DELETE FROM ticks WHERE habit_id = ? AND date = ?;", habitId, day);
    });
  } catch (e) {
    if (!made.tick) throw e;
    await rememberFailedTick(made.tick);
    throw new TickNotSaved(made.tick, e);
  }
  if (made.tick) await forgetFailedTick(made.tick);
  announce();
  return made.tick?.ticked ?? false;
}

/** Saves a tick change; on failure remembers it (see `failedTick`). */
export async function saveTick(tick: FailedTick): Promise<void> {
  try {
    await setTick(tick.habitId, tick.day, tick.ticked);
  } catch (e) {
    if (e instanceof TickRefused) throw e;
    if (e instanceof RangeError) {
      // its day is no longer tickable: refused, and forgotten
      await forgetFailedTick(tick);
      throw new TickNotSaved(tick, e, true);
    }
    await rememberFailedTick(tick);
    throw new TickNotSaved(tick, e);
  }
  await forgetFailedTick(tick);
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

/** Forgets the remembered failed tick if it is `tick`. */
async function forgetFailedTick(tick: FailedTick): Promise<void> {
  try {
    const db = await open();
    await db.tx(async (t = db) => {
      const waiting = await readFailedTick(t);
      if (waiting && same(waiting, tick)) await t.run("DELETE FROM kv WHERE key = ?;", FAILED_TICK);
    });
  } catch {
    // nothing to forget
  }
}

/** The tick that couldn't be saved before the app last closed, if any. */
export async function failedTick(): Promise<FailedTick | null> {
  return readFailedTick(await open());
}

async function readFailedTick(db: Db): Promise<FailedTick | null> {
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
    await t.run("DELETE FROM kv WHERE key = ?;", FAILED_TICK);
    await setKv(t, "theme", "system");
    await setKv(t, "guideDone", "0");
  });
  announce();
}
