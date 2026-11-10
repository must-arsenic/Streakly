// Shared steps for the browser checks: the test hooks, and finding things on screen.
import { expect, type Page } from "@playwright/test";

export async function hook(page: Page, path: string): Promise<void> {
  await page.goto(`/__test/${path}`);
  await page.waitForURL((url) => !url.pathname.startsWith("/__test"), { timeout: 15_000 });
}

/** A clean start with the given seeds loaded, on Today. */
export async function start(page: Page, ...seeds: string[]): Promise<void> {
  await hook(page, "reset");
  for (const seed of seeds) await hook(page, `seed?name=${seed}`);
  await page.goto("/");
  await expect(page.getByTestId("app-ready")).toBeVisible();
}

/** Opens a tab with the tab bar, the way a person does. */
export async function tab(page: Page, name: "Today" | "Week" | "Settings"): Promise<void> {
  await page.getByRole("tab", { name }).click();
}

/** The habit names on Today, top to bottom. */
export async function todayNames(page: Page): Promise<string[]> {
  return page.locator('[data-testid^="habit-row-"] a, [data-testid^="habit-row-"] [role="link"]').evaluateAll((els) =>
    els.map((e) => (e.getAttribute("aria-label") ?? e.textContent ?? "").trim()),
  );
}

export function tick(page: Page, name: string) {
  return page.getByRole("checkbox", { name, exact: true });
}

/** "#rrggbb" as the browser reports it: "rgb(r, g, b)". */
export function rgb(hex: string): string {
  const n = (i: number) => parseInt(hex.slice(i, i + 2), 16);
  return `rgb(${n(1)}, ${n(3)}, ${n(5)})`;
}

export async function background(locator: import("@playwright/test").Locator): Promise<string> {
  return locator.evaluate((e) => getComputedStyle(e).backgroundColor);
}

/** Calls a test hook inside the page, without reloading it. */
export async function act(page: Page, action: string, params: Record<string, string> = {}): Promise<void> {
  await page.evaluate(
    ([a, p]) => (globalThis as unknown as { __streaklyHooks: { act: (a: string, p: object) => Promise<boolean> } }).__streaklyHooks.act(a, p),
    [action, params] as const,
  );
}

/** Long-presses a row's name, then drags it until it is above `to`'s name. */
export async function drag(page: Page, from: string, to: string): Promise<void> {
  const a = await page.getByRole("link", { name: from, exact: true }).boundingBox();
  const b = await page.getByRole("link", { name: to, exact: true }).boundingBox();
  if (!a || !b) throw new Error("rows not found");
  const x = a.x + a.width / 2;
  await page.mouse.move(x, a.y + a.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(800);
  const targetY = b.y - 10;
  const steps = 12;
  for (let i = 1; i <= steps; i += 1) {
    await page.mouse.move(x, a.y + a.height / 2 + ((targetY - (a.y + a.height / 2)) * i) / steps);
    await page.waitForTimeout(30);
  }
  await page.mouse.up();
}
