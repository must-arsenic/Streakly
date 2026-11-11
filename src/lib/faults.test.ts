import { afterEach, expect, jest, test } from "@jest/globals";

const KEY = "streakly.faults";
const original = process.env.EXPO_PUBLIC_AIOS_TEST_HOOKS;

function withSession(value: string): void {
  const store = new Map([[KEY, value]]);
  (globalThis as { sessionStorage?: unknown }).sessionStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, v),
  };
}

afterEach(() => {
  delete (globalThis as { sessionStorage?: unknown }).sessionStorage;
  process.env.EXPO_PUBLIC_AIOS_TEST_HOOKS = original;
  jest.resetModules();
});

test("faults left in sessionStorage do nothing in the person's app", () => {
  delete process.env.EXPO_PUBLIC_AIOS_TEST_HOOKS;
  withSession(JSON.stringify({ writes: true, readsFail: true }));
  jest.isolateModules(() => {
    const { readPoint, writePoint } = jest.requireActual<typeof import("./faults")>("./faults");
    expect(() => writePoint()).not.toThrow();
    expect(() => readPoint()).not.toThrow();
  });
});

test("faults kept in sessionStorage come back in a build with the test hooks on", () => {
  process.env.EXPO_PUBLIC_AIOS_TEST_HOOKS = "1";
  withSession(JSON.stringify({ writes: true, readsFail: false }));
  jest.isolateModules(() => {
    const { writePoint } = jest.requireActual<typeof import("./faults")>("./faults");
    expect(() => writePoint()).toThrow("Storage write failed");
  });
});
