// Storage faults the test hooks can switch on, so save and load failures can be reached. They stay
// off in the person's app: only the test hooks (which answer only when switched on) and unit tests
// set them, and only a build with the hooks on keeps them in sessionStorage (on the web, so a page
// reload keeps them) or reads them back from it.

/**
 * `readsOnce`: that many next loads of the habit list fail. `readsFail`: they fail until the person
 * taps "Try again".
 */
type Faults = { writes: boolean; readsOnce: number; readsFail: boolean };

const KEY = "streakly.faults";
const hooksBuild = process.env.EXPO_PUBLIC_AIOS_TEST_HOOKS === "1";
let faults: Faults = load();

function storage(): Storage | undefined {
  try {
    return (globalThis as { sessionStorage?: Storage }).sessionStorage;
  } catch {
    return undefined;
  }
}

function load(): Faults {
  if (!hooksBuild) return { writes: false, readsOnce: 0, readsFail: false };
  try {
    const raw = storage()?.getItem(KEY);
    if (raw) return { writes: false, readsOnce: 0, readsFail: false, ...JSON.parse(raw) };
  } catch {
    // no saved faults
  }
  return { writes: false, readsOnce: 0, readsFail: false };
}

function save(): void {
  if (!hooksBuild) return;
  try {
    storage()?.setItem(KEY, JSON.stringify(faults));
  } catch {
    // nowhere to keep them
  }
}

export function setWritesFail(on: boolean): void {
  faults = { ...faults, writes: on };
  save();
}

/** The next `n` loads of the habit list fail. */
export function failNextReads(n: number): void {
  faults = { ...faults, readsOnce: n };
  save();
}

/** Loads of the habit list fail (`on`) until a retry: see `retried`. */
export function setReadsFail(on: boolean): void {
  faults = { ...faults, readsFail: on };
  save();
}

/** The person tapped "Try again" after a load error: storage reads again. */
export function retried(): void {
  if (faults.readsFail) setReadsFail(false);
}

export function clearFaults(): void {
  faults = { writes: false, readsOnce: 0, readsFail: false };
  save();
}

/** Called inside every write transaction, after its first change: throws when writes fail. */
export function writePoint(): void {
  if (faults.writes) throw new Error("Storage write failed");
}

/** Called before every load of the habit list. */
export function readPoint(): void {
  if (faults.readsFail) throw new Error("Storage read failed");
  if (faults.readsOnce > 0) {
    faults = { ...faults, readsOnce: faults.readsOnce - 1 };
    save();
    throw new Error("Storage read failed");
  }
}
