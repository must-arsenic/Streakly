// The browser checks for the earlier items, each titled with its item's tag.
import { expect, type Page, test } from "@playwright/test";

import { addDays, longDate, today as todayDay } from "../src/lib/days";
import { tokens } from "../src/theme/tokens";
import { background, drag, rgb, start, tab, tick, todayNames } from "./helpers";

const banner = (page: Page) => page.getByRole("alert").filter({ hasText: "Couldn't save your change" });

test("[e2e->ac~streakly.tick.on~1] tick today", async ({ page }) => {
  await start(page, "stretch");
  await tick(page, "Stretch").click();
  await expect(tick(page, "Stretch")).toHaveAttribute("aria-checked", "true");
  await expect(page.getByText("1-day streak")).toBeVisible();
  await expect(page.getByText("Best: 1")).toBeVisible();
  await page.reload();
  await expect(tick(page, "Stretch")).toHaveAttribute("aria-checked", "true");
});

test("[e2e->ac~streakly.tick.off~1] untick today", async ({ page }) => {
  await start(page, "stretch-ticked-today");
  await expect(tick(page, "Stretch")).toHaveAttribute("aria-checked", "true");
  await tick(page, "Stretch").click();
  await expect(tick(page, "Stretch")).toHaveAttribute("aria-checked", "false");
  await page.reload();
  await expect(tick(page, "Stretch")).toHaveAttribute("aria-checked", "false");
});

test("[e2e->ac~streakly.week.fix-day~1] fix a missed day on Week", async ({ page }) => {
  await start(page, "stretch-ticked-today");
  await tab(page, "Week");
  const cell = page.getByTestId(`cell-1-${addDays(todayDay(), -1)}`);
  await cell.click();
  await expect(cell).toHaveAttribute("aria-checked", "true");
  await tab(page, "Today");
  await expect(page.getByText("2-day streak")).toBeVisible();
  await page.reload();
  await tab(page, "Week");
  await expect(page.getByTestId(`cell-1-${addDays(todayDay(), -1)}`)).toHaveAttribute("aria-checked", "true");
});

test("[e2e->ac~streakly.delete-habit.cancel~1] Cancel keeps the habit", async ({ page }) => {
  await start(page, "stretch");
  await page.getByText("Stretch", { exact: true }).click();
  await page.getByRole("button", { name: "Delete habit" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Delete this habit and all its history?")).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goto("/");
  await expect.poll(() => todayNames(page)).toEqual(["Stretch"]);
});

test("[e2e->ac~streakly.reorder.drag~1] drag Walk above Stretch; Week keeps the order after a restart", async ({ page }) => {
  await start(page, "stretch-read-walk");
  await expect.poll(() => todayNames(page)).toEqual(["Stretch", "Read", "Walk"]);
  await drag(page, "Walk", "Stretch");
  await expect.poll(() => todayNames(page)).toEqual(["Walk", "Stretch", "Read"]);
  await page.reload();
  await tab(page, "Week");
  await expect(page.locator('[data-testid^="week-row-"] [role="rowheader"]')).toHaveText(["Walk", "Stretch", "Read"]);
});

test("[e2e->ac~streakly.theme.dark~1] pick Dark", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await start(page, "stretch");
  await tab(page, "Settings");
  await expect(page.getByRole("radio", { name: "System" })).toHaveAttribute("aria-checked", "true");
  await page.getByRole("radio", { name: "Dark" }).click();
  await expect(page.getByRole("radio", { name: "Dark" })).toHaveAttribute("aria-checked", "true");
  expect(await background(page.locator("body"))).toBe(rgb(tokens.dark.bg));
  await page.reload();
  await expect(page.getByRole("tab", { name: "Settings" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe("dark");
});

test("[e2e->ac~streakly.theme.persist~1] Light survives a restart with the phone in dark mode", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await start(page, "light-theme");
  await page.reload();
  await tab(page, "Settings");
  await expect(page.getByRole("radio", { name: "Light" })).toHaveAttribute("aria-checked", "true");
  expect(await background(page.locator("body"))).toBe(rgb(tokens.light.bg));
});

test("[e2e->ac~streakly.delete-all.cancel~1] Cancel delete all", async ({ page }) => {
  await start(page, "stretch-read");
  await tab(page, "Settings");
  await page.getByRole("button", { name: "Delete all data" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Delete all habits and history? This can't be undone.")).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await tab(page, "Today");
  await expect.poll(() => todayNames(page)).toEqual(["Stretch", "Read"]);
});

test("[e2e->ac~streakly.save-error.tick~1] a failed tick shows the banner and the box stays unchecked", async ({ page }) => {
  await start(page, "stretch", "writes-fail");
  await tick(page, "Stretch").click();
  await expect(banner(page)).toBeVisible();
  await expect(banner(page).getByRole("button", { name: "Try again" })).toBeVisible();
  await expect(tick(page, "Stretch")).toHaveAttribute("aria-checked", "false");
});

test("[e2e->ac~streakly.failed-tick-kept.restart~1] a failed tick is offered after a restart, and Try again stores it", async ({ page }) => {
  // a tick on Stretch that failed before the app closed (stored, so the app opens with it)
  await start(page, "stretch-failed-tick");
  await expect(banner(page)).toBeVisible();
  await banner(page).getByRole("button", { name: "Try again" }).click();
  await expect(tick(page, "Stretch")).toHaveAttribute("aria-checked", "true");
  await expect(banner(page)).toHaveCount(0);
  await page.reload();
  await expect(tick(page, "Stretch")).toHaveAttribute("aria-checked", "true");
});

test("[e2e->ac~streakly.day-rollover.midnight~1] at midnight Today shows the new date and an open box", async ({ page }) => {
  const late = new Date(2026, 10, 10, 23, 59, 0);
  await page.clock.install({ time: late });
  await start(page, "stretch-ticked-today");
  await expect(tick(page, "Stretch")).toHaveAttribute("aria-checked", "true");
  await expect(page.getByText("1 of 1 ticked")).toBeVisible();
  await page.clock.runFor(70_000);
  await expect(page.getByText(longDate("2026-11-11"))).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("0 of 1 ticked")).toBeVisible();
  await expect(tick(page, "Stretch")).toHaveAttribute("aria-checked", "false");
});

test("[e2e->ac~streakly.no-lost-tick.quick-taps~1] two quick taps leave the box unchecked and nothing stored", async ({ page }) => {
  await start(page, "stretch");
  await tick(page, "Stretch").dblclick();
  await expect(tick(page, "Stretch")).toHaveAttribute("aria-checked", "false");
  await page.waitForTimeout(500);
  await expect(tick(page, "Stretch")).toHaveAttribute("aria-checked", "false");
  await page.reload();
  await expect(tick(page, "Stretch")).toHaveAttribute("aria-checked", "false");
  await tab(page, "Week");
  await expect(page.getByTestId(`cell-1-${todayDay()}`)).toHaveAttribute("aria-checked", "false");
});
