import { expect, test } from "@playwright/test";

import { tokens } from "../src/theme/tokens";
import { background, rgb, start, tab } from "./helpers";

test("[e2e->ac~streakly.theme.switch~1] Dark applies to every screen and is stored", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await start(page, "drink-water");
  expect(await background(page.locator("body"))).toBe(rgb(tokens.light.bg));
  await tab(page, "Settings");
  await expect(page.getByRole("radio", { name: "System" })).toHaveAttribute("aria-checked", "true");
  await page.getByRole("radio", { name: "Dark" }).click();
  await expect(page.getByRole("radio", { name: "Dark" })).toHaveAttribute("aria-checked", "true");
  for (const name of ["Today", "Week", "Settings"] as const) {
    await tab(page, name);
    await expect(page.getByRole("heading", { name, level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe("dark");
    expect(await background(page.locator("body"))).toBe(rgb(tokens.dark.bg));
  }
  await tab(page, "Today");
  const row = page.locator('[data-testid^="habit-row-"]').first();
  expect(await background(row)).toBe(rgb(tokens.dark.surface));
  await page.getByRole("button", { name: "+" }).click();
  await expect(page.getByLabel("Name")).toBeVisible();
  expect(await background(page.getByLabel("Name"))).toBe(rgb(tokens.dark.surface));
  await page.reload();
  await expect(page.getByLabel("Name")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe("dark");
});

test("[e2e->ac~streakly.delete-all.confirm~1] Delete all data asks first", async ({ page }) => {
  await start(page, "drink-water");
  await tab(page, "Settings");
  await page.getByRole("button", { name: "Delete all data" }).click();
  const prompt = page.getByRole("dialog");
  await expect(prompt.getByText("Delete all habits and history? This can't be undone.")).toBeVisible();
  await expect(prompt.getByRole("button", { name: "Delete everything" })).toBeVisible();
  await expect(prompt.getByRole("button", { name: "Cancel" })).toBeVisible();
  await expect(page.getByRole("button", { name: /delete/i })).toHaveCount(1);
  await prompt.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("[e2e->ac~streakly.delete-all.wipes~1] Delete everything wipes all and shows the guide", async ({ page }) => {
  await start(page, "three-habits-ticked-dark");
  await tab(page, "Settings");
  await page.getByRole("button", { name: "Delete all data" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete everything" }).click();
  await expect(page.getByRole("button", { name: "Next" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Skip" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe("light");
  await page.getByRole("button", { name: "Skip" }).click();
  await expect(page.getByText("No habits yet")).toBeVisible();
  await tab(page, "Settings");
  await expect(page.getByRole("radio", { name: "System" })).toHaveAttribute("aria-checked", "true");
  await page.reload();
  await expect(page.getByRole("radio", { name: "System" })).toHaveAttribute("aria-checked", "true");
  await tab(page, "Week");
  await expect(page.getByText("No habits yet")).toBeVisible();
});
