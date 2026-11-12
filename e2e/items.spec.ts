// The browser checks for the earlier items, each titled with its item's tag.
import { expect, type Page, test } from "@playwright/test";

import { addDays, longDate, today as todayDay } from "../src/lib/days";
import { tokens } from "../src/theme/tokens";
import { act, background, drag, rgb, start, tab, tick, todayNames } from "./helpers";

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

const guideText = (page: Page, text: string) => page.getByText(text, { exact: true });

test("[e2e->ac~streakly.guide.first-run~1] first run shows the guide", async ({ page }) => {
  await start(page, "first-run");
  await expect(guideText(page, "1 of 3")).toBeVisible();
  await expect(page.getByText("Add the habits you want to keep")).toBeVisible();
  await expect(page.getByRole("button", { name: "Skip" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Next" })).toBeVisible();
});

test("[e2e->ac~streakly.guide.next~1] Next twice walks to the last card", async ({ page }) => {
  await start(page, "first-run");
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(guideText(page, "3 of 3")).toBeVisible();
  await expect(page.getByText("See your week at a glance")).toBeVisible();
  await expect(page.getByRole("button", { name: "Get started" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Skip" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Next" })).toHaveCount(0);
});

test("[e2e->ac~streakly.guide.skip~1] Skip finishes the guide for good", async ({ page }) => {
  await start(page, "first-run");
  await page.getByRole("button", { name: "Skip" }).click();
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
  await expect(guideText(page, "1 of 3")).toHaveCount(0);
});

test("[e2e->ac~streakly.guide.get-started~1] Get started finishes the guide", async ({ page }) => {
  await start(page, "first-run");
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Get started" }).click();
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
  for (const name of ["Today", "Week", "Settings"]) await expect(page.getByRole("tab", { name })).toBeVisible();
});

test("[e2e->ac~streakly.today.rows~1] Today shows the date, the rows in order and the summary", async ({ page }) => {
  await start(page, "stretch-ticked-read-not");
  await expect.poll(() => todayNames(page)).toEqual(["Stretch", "Read"]);
  await expect(page.getByText(longDate(todayDay()))).toBeVisible();
  await expect(page.getByText("1 of 2 ticked")).toBeVisible();
});

test("[e2e->ac~streakly.week.grid~1] Week has 7 day columns and a row of 7 cells per habit", async ({ page }) => {
  await start(page, "stretch-read");
  await tab(page, "Week");
  await expect(page.getByRole("columnheader")).toHaveCount(7);
  await expect(page.getByRole("columnheader").last()).toHaveAccessibleName(new RegExp(` ${Number(todayDay().slice(8))}$`));
  for (const name of ["Stretch", "Read"]) await expect(page.getByRole("checkbox", { name: new RegExp(`^${name}, `) })).toHaveCount(7);
});

test("[e2e->ac~streakly.streaks.zero~1] a habit with no ticks reads 0-day streak and Best: 0", async ({ page }) => {
  await start(page, "stretch");
  await expect(page.getByText("0-day streak")).toBeVisible();
  await expect(page.getByText("Best: 0")).toBeVisible();
});

test("[e2e->ac~streakly.add-habit.save~1] add Read in Teal below Stretch", async ({ page }) => {
  await start(page, "stretch");
  await page.getByRole("button", { name: "+" }).click();
  await page.getByRole("textbox", { name: "Name" }).fill("Read");
  await page.getByRole("radio", { name: "Teal" }).click();
  await page.getByRole("button", { name: "Save" }).click();
  await expect.poll(() => todayNames(page)).toEqual(["Stretch", "Read"]);
  await page.reload();
  await expect.poll(() => todayNames(page)).toEqual(["Stretch", "Read"]);
  await page.getByRole("link", { name: "Read", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Name" })).toHaveValue("Read");
  await expect(page.getByRole("radio", { name: "Teal" })).toHaveAttribute("aria-checked", "true");
});

test("[e2e->ac~streakly.add-habit.from-empty~1] Add a habit from the empty state", async ({ page }) => {
  await start(page, "no-habits");
  await page.getByRole("button", { name: "Add a habit" }).click();
  await expect(page.getByRole("textbox", { name: "Name" })).toBeVisible();
  await expect(page.getByRole("radiogroup", { name: "Colour" }).getByRole("radio")).toHaveCount(8);
  await expect(page.getByRole("radio", { name: "Violet" })).toHaveAttribute("aria-checked", "true");
});

test("[e2e->ac~streakly.add-habit.cancel~1] Cancel adds nothing", async ({ page }) => {
  await start(page, "no-habits");
  await page.getByRole("button", { name: "Add a habit" }).click();
  await page.getByRole("textbox", { name: "Name" }).fill("Read");
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
  await page.reload();
  await expect(page.getByText("No habits yet")).toBeVisible();
});

test("[e2e->ac~streakly.habit-name.empty~1] a name of only spaces is refused", async ({ page }) => {
  await start(page, "no-habits");
  await page.getByRole("button", { name: "Add a habit" }).click();
  await page.getByRole("textbox", { name: "Name" }).fill("   ");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Give your habit a name")).toBeVisible();
  await page.goto("/");
  await expect(page.getByText("No habits yet")).toBeVisible();
});

test("[e2e->ac~streakly.habit-name.max~1] typing stops at 40 characters", async ({ page }) => {
  await start(page, "no-habits");
  await page.getByRole("button", { name: "Add a habit" }).click();
  await page.getByRole("textbox", { name: "Name" }).pressSequentially("x".repeat(45));
  await expect(page.getByRole("textbox", { name: "Name" })).toHaveValue("x".repeat(40));
  await expect(page.getByText("40/40")).toBeVisible();
});

test("[e2e->ac~streakly.edit-habit.rename~1] renaming keeps the ticks", async ({ page }) => {
  await start(page, "stretch-today-yesterday");
  await page.getByText("Stretch", { exact: true }).click();
  await page.getByRole("textbox", { name: "Name" }).fill("Yoga");
  await page.getByRole("button", { name: "Save" }).click();
  await expect.poll(() => todayNames(page)).toEqual(["Yoga"]);
  await expect(page.getByText("2-day streak")).toBeVisible();
  await tab(page, "Week");
  await expect(page.getByRole("checkbox", { name: /^Yoga, /, checked: true })).toHaveCount(2);
});

test("[e2e->ac~streakly.edit-habit.filled~1] Edit habit opens filled in", async ({ page }) => {
  await start(page, "stretch-green");
  await page.getByText("Stretch", { exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Name" })).toHaveValue("Stretch");
  await expect(page.getByRole("radio", { name: "Green" })).toHaveAttribute("aria-checked", "true");
});

test("[e2e->ac~streakly.delete-habit.confirm~1] Delete removes the habit and its ticks", async ({ page }) => {
  await start(page, "stretch-3-ticks");
  await page.getByText("Stretch", { exact: true }).click();
  await page.getByRole("button", { name: "Delete habit" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText("No habits yet")).toBeVisible();
  await page.reload();
  await expect(page.getByText("No habits yet")).toBeVisible();
});

test("[e2e->ac~streakly.reorder.long-press~1] a long press doesn't open Edit habit", async ({ page }) => {
  await start(page, "stretch");
  const box = (await page.getByRole("link", { name: "Stretch" }).boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(700);
  await page.mouse.up();
  await page.waitForTimeout(300);
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Name" })).toHaveCount(0);
});

test("[e2e->ac~streakly.save-error.retry~1] Try again saves the same tick", async ({ page }) => {
  await start(page, "stretch", "writes-fail");
  await tick(page, "Stretch").click();
  await expect(banner(page)).toBeVisible();
  await act(page, "seed", { name: "writes-work" });
  await banner(page).getByRole("button", { name: "Try again" }).click();
  await expect(banner(page)).toHaveCount(0);
  await expect(tick(page, "Stretch")).toHaveAttribute("aria-checked", "true");
  await page.reload();
  await expect(tick(page, "Stretch")).toHaveAttribute("aria-checked", "true");
});

test("[e2e->ac~streakly.save-error.theme~1] a failed theme change keeps System", async ({ page }) => {
  await start(page, "stretch", "writes-fail");
  await tab(page, "Settings");
  await page.getByRole("radio", { name: "Dark" }).click();
  await expect(banner(page)).toBeVisible();
  await expect(page.getByRole("radio", { name: "System" })).toHaveAttribute("aria-checked", "true");
});

test("[e2e->ac~streakly.list-states.empty-today~1] empty Today", async ({ page }) => {
  await start(page, "no-habits");
  await expect(page.getByText("No habits yet")).toBeVisible();
  await expect(page.getByText("Add the daily habits you want to keep, then tick them off here.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Add a habit" })).toBeVisible();
});

test("[e2e->ac~streakly.list-states.empty-week~1] empty Week", async ({ page }) => {
  await start(page, "no-habits");
  await tab(page, "Week");
  await expect(page.getByText("No habits yet")).toBeVisible();
  await expect(page.getByText("Each habit you keep gets a row here, with a box for each of the last 7 days.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Add a habit" })).toBeVisible();
});

test("[e2e->ac~streakly.list-states.loading~1] loading", async ({ page }) => {
  await start(page, "stretch");
  await act(page, "force", { route: "/", mode: "slow" });
  await expect(page.getByText("Loading your habits…")).toBeVisible();
});

test("[e2e->ac~streakly.list-states.error~1] load error and retry", async ({ page }) => {
  await start(page, "stretch", "load-fails-once");
  await expect(page.getByText("Couldn't load your habits")).toBeVisible();
  await page.getByRole("button", { name: "Try again" }).click();
  await expect.poll(() => todayNames(page)).toEqual(["Stretch"]);
});

test("[e2e->ac~streakly.edit-states.gone~1] a missing habit on Edit", async ({ page }) => {
  await start(page, "stretch");
  await page.goto("/habits/999");
  await expect(page.getByText("This habit isn't here any more.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Back to Today" })).toBeVisible();
});

test("[e2e->ac~streakly.edit-states.error~1] Edit load error", async ({ page }) => {
  await start(page, "stretch");
  await act(page, "force", { route: "/habits/[id]", mode: "error" });
  await page.getByText("Stretch", { exact: true }).click();
  await expect(page.getByText("Couldn't load your habit")).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
});

test("[e2e->ac~streakly.form-save-error.add~1] a failed add keeps the form", async ({ page }) => {
  await start(page, "no-habits", "writes-fail");
  await page.getByRole("button", { name: "Add a habit" }).click();
  await page.getByRole("textbox", { name: "Name" }).fill("Read");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Couldn't save. Try again.")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Name" })).toHaveValue("Read");
});

test("[e2e->ac~streakly.routes.today~1] /today goes to Today", async ({ page }) => {
  await start(page, "stretch");
  await page.goto("/today");
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
});

test("[e2e->ac~streakly.routes.unknown~1] an unknown address goes to Today", async ({ page }) => {
  await start(page, "stretch");
  await page.goto("/nowhere");
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
});
