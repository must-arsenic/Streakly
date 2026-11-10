// The test hooks: only when Metro started with EXPO_PUBLIC_AIOS_TEST_HOOKS=1 (the engine's judged
// run). The person's app never has them. Opened as deep links: /__test/reset, /__test/seed?name=,
// /__test/sign-in?email=, /__test/force?route=&mode=empty|slow|error.
import { reset } from "./db";

export type Mode = "empty" | "slow" | "error";
const forced = new Map<string, Mode>();

export function hooksOn(env: string | undefined = process.env.EXPO_PUBLIC_AIOS_TEST_HOOKS): boolean {
  return env === "1";
}

/** Seeds by name, from contract/seeds.json: add each seed here. */
const seeds: Record<string, () => Promise<void>> = {};

export async function act(action: string, params: Record<string, string | undefined>): Promise<boolean> {
  if (!hooksOn()) return false;
  switch (action) {
    case "reset":
      forced.clear();
      await reset();
      return true;
    case "seed": {
      const seed = params.name ? seeds[params.name] : undefined;
      if (!seed) return false;
      await seed();
      return true;
    }
    case "force":
      if (!params.route || !["empty", "slow", "error"].includes(params.mode ?? "")) return false;
      forced.set(params.route, params.mode as Mode);
      return true;
    default:
      return false;
  }
}

/** Wrap every data read a screen makes, so its empty, loading and error states can be forced. */
export async function testable<T>(route: string, empty: T, read: () => Promise<T>): Promise<T> {
  const mode = hooksOn() ? forced.get(route) : undefined;
  if (mode === "empty") return empty;
  if (mode === "slow") await new Promise((r) => setTimeout(r, 5000));
  if (mode === "error") throw new Error(`forced error on ${route}`);
  return read();
}
