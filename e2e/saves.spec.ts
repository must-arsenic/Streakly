import { expect, test } from "@playwright/test";

import { tokens } from "../src/theme/tokens";
import { act, background, drag, rgb, start, tab, tick, todayNames } from "./helpers";

const banner = (page: import("@playwright/test").Page) => page.getByRole("alert").filter({ hasText: "Couldn't save your change" });

test("[e2e->ac~streakly.save-errors.tick~1] a failed tick keeps the box empty", async ({ page }) => {
  await start(page, "water-unticked", "writes-fail");
  await tick(page, "Water").click();
  await expect(banner(page)).toBeVisible();
  await expect(banner(page).getByRole("button", { name: "Try again" })).toBeVisible();
  await expect(tick(page, "Water")).toHaveAttribute("aria-checked", "false");
  await page.reload();
  await expect(tick(page, "Water")).toHaveAttribute("aria-checked", "false");
});

test("[e2e->ac~streakly.save-errors.reorder~1] a failed reorder keeps the old order", async ({ page }) => {
  await start(page, "water-read-stretch", "writes-fail");
  await drag(page, "Stretch", "Water");
  await expect(banner(page)).toBeVisible();
  await expect(banner(page).getByRole("button", { name: "Try again" })).toBeVisible();
  await expect.poll(() => todayNames(page)).toEqual(["Water", "Read", "Stretch"]);
  await page.reload();
  await expect(page.getByRole("link", { name: "Stretch" })).toBeVisible();
  await expect.poll(() => todayNames(page)).toEqual(["Water", "Read", "Stretch"]);
});

test("[e2e->ac~streakly.save-errors.theme~1] a failed theme change keeps the light theme", async ({ page }) => {
  await start(page, "light-theme", "writes-fail");
  await tab(page, "Settings");
  await page.getByRole("radio", { name: "Dark" }).click();
  await expect(banner(page)).toBeVisible();
  await expect(banner(page).getByRole("button", { name: "Try again" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "Light" })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("radio", { name: "Dark" })).toHaveAttribute("aria-checked", "false");
  expect(await background(page.locator("body"))).toBe(rgb(tokens.light.bg));
  await page.reload();
  await expect(page.getByRole("radio", { name: "Light" })).toHaveAttribute("aria-checked", "true");
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe("light");
});

test("[e2e->ac~streakly.save-errors.delete-habit~1] a failed deletion keeps the habit", async ({ page }) => {
  await start(page, "stretch-5-ticks", "writes-fail");
  await page.getByText("Stretch", { exact: true }).click();
  await page.getByRole("button", { name: "Delete habit" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete", exact: true }).click();
  await expect(banner(page)).toBeVisible();
  await expect(banner(page).getByRole("button", { name: "Try again" })).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Stretch" })).toBeVisible();
  await tab(page, "Week");
  await expect(page.getByRole("checkbox", { name: /^Stretch, /, checked: true })).toHaveCount(5);
});

test("[e2e->ac~streakly.save-errors.delete-all~1] a failed delete-all keeps everything", async ({ page }) => {
  await start(page, "three-habits-ticked-dark", "writes-fail");
  await tab(page, "Settings");
  await page.getByRole("button", { name: "Delete all data" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete everything" }).click();
  await expect(banner(page)).toBeVisible();
  await expect(banner(page).getByRole("button", { name: "Try again" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Get started" }).or(page.getByRole("button", { name: "Skip" }))).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("radio", { name: "Dark" })).toHaveAttribute("aria-checked", "true");
  await tab(page, "Week");
  await expect(page.locator('[data-testid^="week-row-"]')).toHaveCount(3);
  await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(9);
});

test("[e2e->ac~streakly.save-errors.retry~1] Try again saves the tick", async ({ page }) => {
  await start(page, "water-unticked", "writes-fail");
  await tick(page, "Water").click();
  await expect(banner(page)).toBeVisible();
  await act(page, "seed", { name: "writes-work" });
  await banner(page).getByRole("button", { name: "Try again" }).click();
  await expect(tick(page, "Water")).toHaveAttribute("aria-checked", "true");
  await expect(banner(page)).toHaveCount(0);
  await page.reload();
  await expect(tick(page, "Water")).toHaveAttribute("aria-checked", "true");
});
