import { chromium, expect, test } from "@playwright/test";

import { tokens } from "../src/theme/tokens";
import { background, rgb, start, tab, tick } from "./helpers";

const short = (d: Date) => new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(d);
const daysAgo = (n: number, from = new Date()) => new Date(from.getFullYear(), from.getMonth(), from.getDate() - n);
const cell = (page: import("@playwright/test").Page, name: string, d: Date) =>
  page.getByRole("checkbox", { name: `${name}, ${short(d)} ${d.getDate()}`, exact: true });

test("[e2e->ac~streakly.week-view.grid~1] 3 rows and 7 columns ending today", async ({ page }) => {
  await start(page, "water-read-stretch");
  await tab(page, "Week");
  await expect(page.locator('[data-testid^="week-row-"]')).toHaveCount(3);
  const headers = page.getByRole("columnheader");
  await expect(headers).toHaveCount(7);
  const now = new Date();
  await expect(headers.last()).toHaveText(`${short(now)} ${now.getDate()}`);
  await expect(headers.first()).toHaveText(`${short(daysAgo(6))} ${daysAgo(6).getDate()}`);
  await expect(page.getByRole("checkbox")).toHaveCount(21);
});

test("[e2e->ac~streakly.tick-week.past-day~1] ticking a forgotten day joins the streak", async ({ page }) => {
  await start(page, "read-today-and-2-days-ago");
  await expect(page.getByText("1-day streak")).toBeVisible();
  await tab(page, "Week");
  const yesterday = cell(page, "Read", daysAgo(1));
  await expect(yesterday).toHaveAttribute("aria-checked", "false");
  await yesterday.click();
  await expect(yesterday).toHaveAttribute("aria-checked", "true");
  expect(await background(yesterday)).toBe(rgb(tokens.habit.light[0]));
  await tab(page, "Today");
  await expect(page.getByText("3-day streak")).toBeVisible();
});

test("[e2e->ac~streakly.tick-week.untick~1] unticking a past day removes its tick", async ({ page }) => {
  await start(page, "read-3-days-ago");
  await tab(page, "Week");
  const c = cell(page, "Read", daysAgo(3));
  await expect(c).toHaveAttribute("aria-checked", "true");
  await c.click();
  await expect(c).toHaveAttribute("aria-checked", "false");
  await page.reload();
  await expect(cell(page, "Read", daysAgo(3))).toHaveAttribute("aria-checked", "false");
  await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(0);
});

test("[e2e->ac~streakly.streak-current.label~1] a 5-day streak shows on Today", async ({ page }) => {
  await start(page, "water-streak-5");
  await expect(page.getByTestId(/^habit-row-/).getByText("5-day streak", { exact: true })).toBeVisible();
});

test("[e2e->ac~streakly.streak-best.label~1] a best streak of 7 shows on Today", async ({ page }) => {
  await start(page, "water-best-7");
  await expect(page.getByTestId(/^habit-row-/).getByText("Best: 7", { exact: true })).toBeVisible();
  await expect(page.getByTestId(/^habit-row-/).getByText("2-day streak", { exact: true })).toBeVisible();
});

test("[e2e->ac~streakly.day-refresh.midnight~1] Today and Week move on at midnight", async ({ page }) => {
  const late = new Date(2026, 10, 10, 23, 59, 0);
  await page.clock.install({ time: late });
  await start(page, "water-ticked-today");
  await expect(tick(page, "Water")).toHaveAttribute("aria-checked", "true");
  await expect(page.getByText("1-day streak")).toBeVisible();
  await page.clock.runFor(90_000);
  await expect(tick(page, "Water")).toHaveAttribute("aria-checked", "false");
  await expect(page.getByText("1-day streak")).toBeVisible();
  await tab(page, "Week");
  const next = new Date(2026, 10, 11);
  await expect(page.getByRole("columnheader").last()).toHaveText(`${short(next)} 11`);
});

test("[e2e->ac~streakly.day-refresh.foreground~1] Today moves on when the app comes back the next day", async ({ page }) => {
  await page.clock.install({ time: new Date(2026, 10, 10, 20, 0, 0) });
  await start(page, "water-ticked-today");
  await expect(tick(page, "Water")).toHaveAttribute("aria-checked", "true");
  const visibility = (state: "hidden" | "visible") =>
    page.evaluate((s) => {
      Object.defineProperty(document, "visibilityState", { value: s, configurable: true });
      Object.defineProperty(document, "hidden", { value: s === "hidden", configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
    }, state);
  await visibility("hidden");
  await page.clock.setSystemTime(new Date(2026, 10, 11, 9, 0, 0));
  await visibility("visible");
  await expect(tick(page, "Water")).toHaveAttribute("aria-checked", "false");
  await expect(page.getByText("1-day streak")).toBeVisible();
  await tab(page, "Week");
  await expect(page.getByRole("columnheader").last()).toHaveText(`${short(new Date(2026, 10, 11))} 11`);
});

test("[e2e->ac~streakly.tick-dates.time-zone~1] a tick stays on 2026-11-09 when the time zone changes", async ({ baseURL }) => {
  const dir = test.info().outputPath("profile");
  const noon = new Date("2026-11-10T12:00:00Z");
  const open = async (timezoneId: string) => {
    const context = await chromium.launchPersistentContext(dir, { baseURL, timezoneId, viewport: { width: 375, height: 812 } });
    const page = context.pages()[0] ?? (await context.newPage());
    await page.clock.install({ time: noon });
    return { context, page };
  };
  const nov9 = new Date(2026, 10, 9);
  // UTC+1
  let { context, page } = await open("Etc/GMT-1");
  await start(page, "read-2026-11-09");
  await tab(page, "Week");
  const column = (p: typeof page) => p.locator('[data-testid^="cell-"][data-testid$="-2026-11-09"]');
  await expect(column(page)).toHaveAttribute("aria-checked", "true");
  await context.close();
  // UTC-8, the same storage
  ({ context, page } = await open("Etc/GMT+8"));
  await page.goto("/week");
  expect(await page.evaluate(() => new Date().getTimezoneOffset())).toBe(480);
  await expect(page.getByTestId("week-column-2026-11-09")).toHaveText(`${new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(nov9)} 9`);
  await expect(column(page)).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(1);
  await context.close();
});

test("[e2e->ac~streakly.local-storage.restart~1] habits, ticks and theme survive a restart", async ({ page }) => {
  await start(page, "water-ticked-today-dark");
  await page.reload();
  await expect(page.getByText("Water")).toBeVisible();
  await expect(tick(page, "Water")).toHaveAttribute("aria-checked", "true");
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe("dark");
  expect(await background(page.locator("body"))).toBe(rgb(tokens.dark.bg));
});
