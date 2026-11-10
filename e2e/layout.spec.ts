import { expect, type Page, test } from "@playwright/test";

import { start } from "./helpers";

async function fits(page: Page, where: string): Promise<void> {
  const width = page.viewportSize()!.width;
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, `${where} scrolls sideways`).toBeLessThanOrEqual(0);
  const buttons = page.locator('[role="button"], button, [role="checkbox"], [role="radio"], [role="tab"], a');
  for (const box of await buttons.evaluateAll((els) =>
    els.filter((e) => (e as HTMLElement).offsetParent !== null).map((e) => {
      const r = e.getBoundingClientRect();
      return { left: r.left, right: r.right, w: r.width, h: r.height, name: e.getAttribute("aria-label") ?? e.textContent };
    }),
  )) {
    expect(box.left, `${where}: ${box.name} cut off`).toBeGreaterThanOrEqual(-0.5);
    expect(box.right, `${where}: ${box.name} cut off`).toBeLessThanOrEqual(width + 0.5);
    expect(box.w * box.h, `${where}: ${box.name} has no size`).toBeGreaterThan(0);
  }
}

for (const width of [375, 1440]) {
  for (const scheme of ["light", "dark"] as const) {
    test(`[e2e->ac~streakly.layout.widths~1] 8 long names fit at ${width} px, ${scheme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 812 });
      await page.emulateMedia({ colorScheme: scheme });
      await start(page, "eight-long-names");
      expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(scheme);
      await expect(page.getByRole("checkbox")).toHaveCount(8);
      await fits(page, "Today");
      await page.getByRole("tab", { name: "Week" }).click();
      await expect(page.getByRole("checkbox")).toHaveCount(56);
      await fits(page, "Week");
      await page.getByRole("tab", { name: "Settings" }).click();
      await expect(page.getByRole("button", { name: "Delete all data" })).toBeVisible();
      await fits(page, "Settings");
      await page.goto("/habits/new");
      await page.getByLabel("Name").fill("x".repeat(40));
      await fits(page, "Add habit");
      await page.getByRole("button", { name: "Save" }).click();
      await expect(page.getByRole("checkbox")).toHaveCount(9);
      await fits(page, "Today with 9");
    });
  }
}
