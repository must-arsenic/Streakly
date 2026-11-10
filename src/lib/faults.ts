// Storage faults the test hooks can switch on, so save and load failures can be reached. They stay
// off in the person's app: only the test hooks and unit tests set them. On the web they are kept in
// sessionStorage so a page reload keeps them.

type Faults = { writes: boolean; readsOnce: number };

const KEY = "streakly.faults";
let faults: Faults = load();

function storage(): Storage | undefined {
  try {
    return (globalThis as { sessionStorage?: Storage }).sessionStorage;
  } catch {
    return undefined;
  }
}

function load(): Faults {
  try {
    const raw = storage()?.getItem(KEY);
    if (raw) return { writes: false, readsOnce: 0, ...JSON.parse(raw) };
  } catch {
    // no saved faults
  }
  return { writes: false, readsOnce: 0 };
}

function save(): void {
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

export function clearFaults(): void {
  faults = { writes: false, readsOnce: 0 };
  save();
}

/** Called inside every write transaction, after its first change: throws when writes fail. */
export function writePoint(): void {
  if (faults.writes) throw new Error("Storage write failed");
}

/** Called before every load of the habit list. */
export function readPoint(): void {
  if (faults.readsOnce > 0) {
    faults = { ...faults, readsOnce: faults.readsOnce - 1 };
    save();
    throw new Error("Storage read failed");
  }
}
