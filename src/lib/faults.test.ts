import { afterEach, expect, jest, test } from "@jest/globals";

import { clearFaults, failNextReads, faultState, persistWith, readPoint, restoreFaults, setWritesFail, writePoint } from "./faults";

afterEach(() => {
  persistWith(null);
  clearFaults();
});

test("faults are off unless set: sessionStorage is never read", () => {
  (globalThis as { sessionStorage?: unknown }).sessionStorage = { getItem: () => JSON.stringify({ writes: true, readsFail: true }), setItem: () => undefined };
  jest.isolateModules(() => {
    const fresh = jest.requireActual<typeof import("./faults")>("./faults");
    expect(() => fresh.writePoint()).not.toThrow();
    expect(() => fresh.readPoint()).not.toThrow();
  });
  delete (globalThis as { sessionStorage?: unknown }).sessionStorage;
});

test("every change goes to the store the hooks give, and comes back after a restart", () => {
  const kept: unknown[] = [];
  persistWith((f) => kept.push(f));
  setWritesFail(true);
  const stored = kept.at(-1) as object;
  expect(stored).toEqual({ writes: true, readsOnce: 0, readsFail: false });
  // the app starts again: memory is empty, the stored faults come back
  persistWith(null);
  clearFaults();
  expect(() => writePoint()).not.toThrow();
  restoreFaults(stored);
  expect(() => writePoint()).toThrow("Storage write failed");
  expect(faultState().writes).toBe(true);
});

test("failNextReads fails just that many loads", () => {
  failNextReads(1);
  expect(() => readPoint()).toThrow("Storage read failed");
  expect(() => readPoint()).not.toThrow();
});
