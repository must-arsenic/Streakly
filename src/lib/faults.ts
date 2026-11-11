// Storage faults the test hooks can switch on, so save and load failures can be reached. They stay
// off in the person's app: only the test hooks (which answer only when switched on) and unit tests
// set them. The hooks keep them in SQLite (see `persistWith`), because the judged run starts the
// app again after each seed: they must outlive that restart.

/**
 * `readsOnce`: that many next loads of the habit list fail. `readsFail`: they fail until the person
 * taps "Try again". `archivedFail`: loads of the archived habits fail until "Try again".
 * `slowFail`: the next tick save takes 3 s and then fails.
 */
export type Faults = { writes: boolean; readsOnce: number; readsFail: boolean; archivedFail?: boolean; slowFail?: boolean };

const none: Faults = { writes: false, readsOnce: 0, readsFail: false };
let faults: Faults = none;
let persist: ((f: Faults) => void) | null = null;

function save(): void {
  persist?.(faults);
}

/** The test hooks store every change with this (and only they set it). */
export function persistWith(store: ((f: Faults) => void) | null): void {
  persist = store;
}

export function faultState(): Faults {
  return faults;
}

/** Faults read back from storage when the app starts. */
export function restoreFaults(stored: Partial<Faults>): void {
  faults = { ...none, ...stored };
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

/** Loads of the archived habits fail (`on`) until a retry. */
export function setArchivedReadsFail(on: boolean): void {
  faults = { ...faults, archivedFail: on };
  save();
}

/** The next tick save takes 3 s and then fails (`on`). */
export function setSlowFail(on: boolean): void {
  faults = { ...faults, slowFail: on };
  save();
}

/** The person tapped "Try again" after a load error: storage reads again. */
export function retried(): void {
  if (faults.readsFail) setReadsFail(false);
  if (faults.archivedFail) setArchivedReadsFail(false);
}

export function clearFaults(): void {
  faults = none;
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

/** Called before every load of the archived habits. */
export function archivedReadPoint(): void {
  if (faults.archivedFail) throw new Error("Storage read failed");
}

/** Called in a tick's save before it writes: with `slowFail`, waits 3 s and fails (once). */
export async function slowWritePoint(): Promise<void> {
  if (!faults.slowFail) return;
  setSlowFail(false);
  await new Promise((r) => setTimeout(r, 3000));
  throw new Error("Storage write failed");
}
