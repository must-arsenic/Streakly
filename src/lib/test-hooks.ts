// The test hooks: only when Metro started with EXPO_PUBLIC_AIOS_TEST_HOOKS=1 (the engine's judged
// run). The person's app never has them. Opened as deep links: /__test/reset, /__test/seed?name=,
// /__test/sign-in?email=, /__test/force?route=&mode=empty|slow|error.
import { open, reset } from "./db";
import { addDays, type Day, today } from "./days";
import { clearFaults, failNextReads, type Faults, faultState, persistWith, restoreFaults, retried, setReadsFail, setWritesFail } from "./faults";
import { announce, type Theme } from "./store";

export type Mode = "empty" | "slow" | "error";
const forced = new Map<string, Mode>();
const FORCED_KEY = "streakly.forced";

export function hooksOn(env: string | undefined = process.env.EXPO_PUBLIC_AIOS_TEST_HOOKS): boolean {
  return env === "1";
}

/** "/", "today", "index" are Today; "week", "/week/" are "/week"; and so on. */
export function routeKey(route: string): string {
  const bare = route.trim().replace(/^\/+|\/+$/g, "").replace(/^\(tabs\)\/?/, "");
  if (bare === "" || bare === "today" || bare === "index") return "/";
  if (/^habits\/(?!new$)[^/]+$/.test(bare)) return "/habits/[id]";
  if (bare === "guide") return "/welcome";
  return `/${bare}`;
}

function session(): Storage | undefined {
  try {
    return (globalThis as { sessionStorage?: Storage }).sessionStorage;
  } catch {
    return undefined;
  }
}

function saveForced(): void {
  try {
    session()?.setItem(FORCED_KEY, JSON.stringify([...forced]));
  } catch {
    // nowhere to keep them
  }
}

function loadForced(): void {
  try {
    const raw = session()?.getItem(FORCED_KEY);
    if (raw) for (const [k, v] of JSON.parse(raw) as [string, Mode][]) forced.set(k, v);
  } catch {
    // none kept
  }
}
if (hooksOn()) loadForced();

const FAULTS_KEY = "testHooks.faults";

/** Stores the faults in SQLite: the judged run starts the app again after each seed. */
async function persistFaults(f: Faults = faultState()): Promise<void> {
  const db = await open();
  await db.run(
    "INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value;",
    FAULTS_KEY,
    JSON.stringify(f),
  );
}
if (hooksOn()) persistWith((f) => void persistFaults(f).catch(() => undefined));

/** At start, in the judged run: the faults a seed stored before the app was started again. */
export async function loadHookState(): Promise<void> {
  if (!hooksOn()) return;
  const db = await open();
  const rows = await db.all<{ value: string }>("SELECT value FROM kv WHERE key = ?;", FAULTS_KEY);
  if (rows[0]) restoreFaults(JSON.parse(rows[0].value) as Partial<Faults>);
}

type SeedHabit = { name: string; colour?: number; ticks?: (number | Day)[] };

/** Stores habits in this order after any already stored; ticks are days ago (0 = today) or dates. */
async function put(
  habits: SeedHabit[],
  options: { theme?: Theme; guideDone?: boolean; failed?: { habit: number; ago: number; ticked: boolean } } = {},
): Promise<void> {
  const db = await open();
  const now = today();
  await db.tx(async (t = db) => {
    const max = await t.all<{ p: number | null }>("SELECT MAX(position) AS p FROM habits;");
    let position = (max[0]?.p ?? -1) + 1;
    const ids: number[] = [];
    for (const [i, h] of habits.entries()) {
      await t.run(
        "INSERT INTO habits (name, colour, position, created_on) VALUES (?, ?, ?, ?);",
        h.name,
        h.colour ?? i % 8,
        position,
        addDays(now, -30),
      );
      position += 1;
      const [{ id }] = await t.all<{ id: number }>("SELECT last_insert_rowid() AS id;");
      ids.push(id);
      for (const ago of h.ticks ?? []) {
        const day = typeof ago === "number" ? addDays(now, -ago) : ago;
        await t.run("INSERT OR IGNORE INTO ticks (habit_id, date) VALUES (?, ?);", id, day);
      }
    }
    const kv = (key: string, value: string) =>
      t.run("INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value;", key, value);
    await kv("guideDone", options.guideDone === false ? "0" : "1");
    if (options.theme) await kv("theme", options.theme);
    const failed = options.failed;
    if (failed) await kv("failedTick", JSON.stringify({ habitId: ids[failed.habit], day: addDays(now, -failed.ago), ticked: failed.ticked }));
  });
}

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
const longName = (i: number) => `Habit ${i + 1} ${"with a very long name to fill the row"}`.slice(0, 40).padEnd(40, "x");

/** Seeds by name, from contract/seeds.json: add each seed here. */
export const seeds: Record<string, () => Promise<void>> = {
  "first-run": async () => put([], { guideDone: false }),
  "no-habits": async () => put([]),
  "drink-water": async () => put([{ name: "Drink water" }]),
  "water-read-stretch": async () => put([{ name: "Water" }, { name: "Read" }, { name: "Stretch" }]),
  "three-habits-ticked-dark": async () =>
    put(
      [
        { name: "Water", ticks: [0, 1, 2] },
        { name: "Read", ticks: [0, 3] },
        { name: "Stretch", ticks: [1, 2, 4, 5] },
      ],
      { theme: "dark" },
    ),
  "two-habits": async () => put([{ name: "Water" }, { name: "Read" }]),
  "water-unticked": async () => put([{ name: "Water" }]),
  "water-ticked-today": async () => put([{ name: "Water", ticks: [0] }]),
  "water-ticked-today-dark": async () => put([{ name: "Water", ticks: [0] }], { theme: "dark" }),
  "water-streak-5": async () => put([{ name: "Water", ticks: range(0, 4) }]),
  "water-best-7": async () => put([{ name: "Water", ticks: [...range(0, 1), ...range(10, 16)] }]),
  "read-ticked-today": async () => put([{ name: "Read", ticks: [0] }]),
  "read-today-and-2-days-ago": async () => put([{ name: "Read", ticks: [0, 2] }]),
  "read-3-days-ago": async () => put([{ name: "Read", ticks: [3] }]),
  "read-2026-11-09": async () => put([{ name: "Read", ticks: ["2026-11-09"] }]),
  "stretch-5-ticks": async () => put([{ name: "Stretch", colour: 2, ticks: range(0, 4) }]),
  "eight-long-names": async () => put(range(0, 7).map((i) => ({ name: longName(i), colour: i, ticks: i % 2 ? [0, 1] : [2] }))),
  "light-theme": async () => put([{ name: "Water" }], { theme: "light" }),
  "dark-theme": async () => put([{ name: "Water" }], { theme: "dark" }),
  stretch: async () => put([{ name: "Stretch" }]),
  "stretch-read": async () => put([{ name: "Stretch" }, { name: "Read" }]),
  "stretch-ticked-read-not": async () => put([{ name: "Stretch", ticks: [0] }, { name: "Read" }]),
  "stretch-read-walk": async () => put([{ name: "Stretch" }, { name: "Read" }, { name: "Walk" }]),
  "stretch-ticked-today": async () => put([{ name: "Stretch", ticks: [0] }]),
  "stretch-today-yesterday": async () => put([{ name: "Stretch", ticks: [0, 1] }]),
  "stretch-green": async () => put([{ name: "Stretch", colour: 1 }]),
  "stretch-3-ticks": async () => put([{ name: "Stretch", ticks: [0, 1, 30] }]),
  "two-habits-old-tick-dark": async () =>
    put([{ name: "Stretch", ticks: [0, 1] }, { name: "Read", ticks: [0, 30] }], { theme: "dark" }),
  "stretch-failed-tick": async () =>
    put([{ name: "Stretch" }, { name: "Read" }], { failed: { habit: 0, ago: 0, ticked: true } }),
  "stretch-failed-tick-expired": async () =>
    put([{ name: "Stretch" }, { name: "Read" }], { failed: { habit: 0, ago: 7, ticked: true } }),
  "writes-fail": async () => {
    setWritesFail(true);
    await persistFaults();
  },
  "writes-work": async () => {
    setWritesFail(false);
    await persistFaults();
  },
  "load-fails-once": async () => {
    setReadsFail(true);
    await persistFaults();
  },
  "reads-work": async () => {
    forced.clear();
    saveForced();
    setReadsFail(false);
    failNextReads(0);
    await persistFaults();
  },
};

export async function act(action: string, params: Record<string, string | undefined>): Promise<boolean> {
  if (!hooksOn()) return false;
  switch (action) {
    case "reset":
      forced.clear();
      saveForced();
      clearFaults();
      await reset();
      announce(true);
      return true;
    case "seed": {
      const seed = params.name ? seeds[params.name] : undefined;
      if (!seed) return false;
      await seed();
      announce(true);
      return true;
    }
    case "force":
      if (!params.route || !["empty", "slow", "error"].includes(params.mode ?? "")) return false;
      forced.set(routeKey(params.route), params.mode as Mode);
      saveForced();
      announce(true);
      return true;
    default:
      return false;
  }
}

// In the judged web run the hooks can also be called in the page, without a reload:
// `globalThis.__streaklyHooks.act("seed", { name: "writes-work" })`.
if (hooksOn()) (globalThis as { __streaklyHooks?: unknown }).__streaklyHooks = { act };

/**
 * The person tapped "Try again" on a screen's load error: in the judged run, storage reads again
 * (a forced error on that route and a "load-fails-once" failure both end).
 */
export function retryRead(route: string): void {
  if (!hooksOn()) return;
  const key = routeKey(route);
  if (forced.get(key) === "error") {
    forced.delete(key);
    saveForced();
  }
  retried();
}

/** Wrap every data read a screen makes, so its empty, loading and error states can be forced. */
export async function testable<T>(route: string, empty: T, read: () => Promise<T>): Promise<T> {
  const mode = hooksOn() ? forced.get(routeKey(route)) : undefined;
  if (mode === "empty") return empty;
  if (mode === "slow") await new Promise((r) => setTimeout(r, 5000));
  if (mode === "error") throw new Error(`forced error on ${route}`);
  return read();
}
