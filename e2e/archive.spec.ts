import { expect, type Page, test } from "@playwright/test";

import { addDays, today as todayDay } from "../src/lib/days";
import { act, start, tab, tick, todayNames } from "./helpers";

const banner = (page: Page) => page.getByRole("alert").filter({ hasText: "Couldn't save your change" });
const archivedList = (page: Page) => page.getByRole("list", { name: "Archived habits" });
const archivedRow = (page: Page, name: string) => archivedList(page).getByRole("listitem").filter({ hasText: name });

async function openEdit(page: Page, name: string): Promise<void> {
  await page.getByText(name, { exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Name" })).toHaveValue(name);
}

async function archive(page: Page, name: string): Promise<void> {
  await openEdit(page, name);
  await page.getByRole("button", { name: "Archive habit" }).click();
}

test("[e2e->ac~streakly.archive.button~1] Edit habit offers Archive above Delete", async ({ page }) => {
  await start(page, "stretch");
  await openEdit(page, "Stretch");
  const archiveBox = await page.getByRole("button", { name: "Archive habit" }).boundingBox();
  const deleteBox = await page.getByRole("button", { name: "Delete habit" }).boundingBox();
  expect(archiveBox && deleteBox && archiveBox.y + archiveBox.height <= deleteBox.y).toBe(true);
});

test("[e2e->ac~streakly.archive.hides~1] archiving hides the habit at once and keeps its ticks", async ({ page }) => {
  await start(page, "stretch-today-yesterday-read");
  await archive(page, "Stretch");
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect.poll(() => todayNames(page)).toEqual(["Read"]);
  await tab(page, "Week");
  await expect(page.getByRole("row", { name: /Read/ })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: /^Stretch, / })).toHaveCount(0);
  await tab(page, "Settings");
  await expect(archivedRow(page, "Stretch")).toBeVisible();
  await expect(archivedRow(page, "Stretch")).toContainText("Best: 2");
  // its 2 ticks come back with it
  await archivedRow(page, "Stretch").getByRole("button", { name: "Restore" }).click();
  await tab(page, "Week");
  await expect(page.getByRole("checkbox", { name: /^Stretch, /, checked: true })).toHaveCount(2);
});

test("[e2e->ac~streakly.archive.unsaved-edits~1] archiving drops unsaved name and colour changes", async ({ page }) => {
  await start(page, "stretch-teal");
  await openEdit(page, "Stretch");
  await page.getByRole("textbox", { name: "Name" }).fill("Yoga");
  await page.getByRole("radio", { name: "Pink" }).click();
  await page.getByRole("button", { name: "Archive habit" }).click();
  await expect(page.getByText("No habits yet")).toBeVisible();
  await tab(page, "Settings");
  await expect(archivedRow(page, "Stretch")).toBeVisible();
  await expect(archivedRow(page, "Stretch").getByRole("img", { name: "Teal" })).toBeVisible();
  await expect(page.getByText("Yoga")).toHaveCount(0);
});

test("[e2e->ac~streakly.archive.summary~1] the summary leaves archived habits out", async ({ page }) => {
  await start(page, "stretch-archived-read-ticked");
  await expect(page.getByText("1 of 1 ticked")).toBeVisible();
  await expect.poll(() => todayNames(page)).toEqual(["Read"]);
});

test("[e2e->ac~streakly.archive.clears-failed~1] archiving clears its failed tick", async ({ page }) => {
  await start(page, "stretch-failed-tick");
  await expect(banner(page)).toBeVisible();
  await archive(page, "Stretch");
  await expect.poll(() => todayNames(page)).toEqual(["Read"]);
  await expect(banner(page)).toHaveCount(0);
  await tick(page, "Read").click();
  await expect(tick(page, "Read")).toHaveAttribute("aria-checked", "true");
  await expect(banner(page)).toHaveCount(0);
  await page.reload();
  await expect(tick(page, "Read")).toHaveAttribute("aria-checked", "true");
  await expect(banner(page)).toHaveCount(0);
});

test("[e2e->ac~streakly.archived-list.shows~1] Settings lists an archived habit with its colour, best and Restore", async ({ page }) => {
  await start(page, "stretch-teal-best-4-archived");
  await tab(page, "Settings");
  await expect(page.getByRole("heading", { name: "Archived habits" })).toBeVisible();
  const row = archivedRow(page, "Stretch");
  await expect(row.getByRole("img", { name: "Teal" })).toBeVisible();
  await expect(row.getByText("Best: 4")).toBeVisible();
  await expect(row.getByRole("button", { name: "Restore" })).toBeVisible();
  await expect(row.getByRole("button", { name: /delete/i })).toHaveCount(0);
});

test("[e2e->ac~streakly.archived-list.empty~1] no archived habits", async ({ page }) => {
  await start(page, "stretch");
  await tab(page, "Settings");
  await expect(page.getByText("No archived habits")).toBeVisible();
});

test("[e2e->ac~streakly.restore.place~1] restore puts the habit back in its place", async ({ page }) => {
  await start(page, "stretch-read-walk-read-archived");
  await expect.poll(() => todayNames(page)).toEqual(["Stretch", "Walk"]);
  await tab(page, "Settings");
  await archivedRow(page, "Read").getByRole("button", { name: "Restore" }).click();
  // Settings stays in view; Read leaves the archived list
  await expect(page.getByText("No archived habits")).toBeVisible();
  await expect(page.getByText("Read", { exact: true })).toHaveCount(0);
  await tab(page, "Today");
  await expect.poll(() => todayNames(page)).toEqual(["Stretch", "Read", "Walk"]);
});

test("[e2e->ac~streakly.restore.streak~1] days spent archived break the current streak", async ({ page }) => {
  await start(page, "stretch-archived-5-days-ago");
  await tab(page, "Settings");
  await archivedRow(page, "Stretch").getByRole("button", { name: "Restore" }).click();
  await expect(page.getByText("No archived habits")).toBeVisible();
  await tab(page, "Today");
  await expect(page.getByText("0-day streak")).toBeVisible();
  await expect(page.getByText("Best: 3")).toBeVisible();
});

test("[e2e->ac~streakly.restore.tick-archived-days~1] days spent archived can be ticked after restore", async ({ page }) => {
  await start(page, "stretch-archived-3-days-ago");
  await tab(page, "Settings");
  await archivedRow(page, "Stretch").getByRole("button", { name: "Restore" }).click();
  await expect(page.getByText("No archived habits")).toBeVisible();
  await tab(page, "Week");
  const cell = page.getByTestId(`cell-1-${addDays(todayDay(), -2)}`);
  await cell.click();
  await expect(cell).toHaveAttribute("aria-checked", "true");
  await page.reload();
  await tab(page, "Week");
  await expect(page.getByTestId(`cell-1-${addDays(todayDay(), -2)}`)).toHaveAttribute("aria-checked", "true");
});

test("[e2e->ac~streakly.save-error.restore~1] a failed restore shows the banner and keeps the habit archived", async ({ page }) => {
  await start(page, "stretch-archived", "writes-fail");
  await tab(page, "Settings");
  await archivedRow(page, "Stretch").getByRole("button", { name: "Restore" }).click();
  await expect(banner(page)).toBeVisible();
  await expect(banner(page).getByRole("button", { name: "Try again" })).toBeVisible();
  await expect(archivedRow(page, "Stretch")).toBeVisible();
  await page.reload();
  await tab(page, "Settings");
  await expect(archivedRow(page, "Stretch")).toBeVisible();
});

test("[e2e->ac~streakly.form-save-error.archive~1] a failed archive stays on the form", async ({ page }) => {
  await start(page, "stretch", "writes-fail");
  await openEdit(page, "Stretch");
  await page.getByRole("textbox", { name: "Name" }).fill("Yoga");
  await page.getByRole("button", { name: "Archive habit" }).click();
  await expect(page.getByText("Couldn't save. Try again.")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Name" })).toHaveValue("Yoga");
  await page.goto("/");
  await expect.poll(() => todayNames(page)).toEqual(["Stretch"]);
});

test("[e2e->ac~streakly.failed-tick-kept.waiting-refused~1] a tap waiting behind a failed tick is refused", async ({ page }) => {
  await start(page, "stretch-read", "next-tick-fails-slowly");
  await tick(page, "Stretch").click();
  await tick(page, "Read").click();
  await expect(banner(page)).toBeVisible({ timeout: 10_000 });
  await expect(tick(page, "Read")).toHaveAttribute("aria-checked", "false");
  await expect(tick(page, "Stretch")).toHaveAttribute("aria-checked", "false");
  await page.reload();
  await expect(tick(page, "Read")).toHaveAttribute("aria-checked", "false");
});

test("[e2e->ac~streakly.list-states.all-archived~1] every habit archived shows the empty state", async ({ page }) => {
  await start(page, "stretch-archived");
  await expect(page.getByText("No habits yet")).toBeVisible();
  await expect(page.getByRole("button", { name: "Add a habit" })).toBeVisible();
});

test("[e2e->ac~streakly.list-states.archived-error~1] the archived list's load error and retry", async ({ page }) => {
  await start(page, "stretch-archived", "archived-load-fails");
  await tab(page, "Settings");
  await expect(page.getByText("Couldn't load archived habits")).toBeVisible();
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(archivedRow(page, "Stretch")).toBeVisible();
  // and forced, as the force hook does it
  await act(page, "force", { route: "/settings/archived", mode: "slow" });
  await expect(page.getByText("Loading archived habits…")).toBeVisible();
});

test("[e2e->ac~streakly.edit-states.archived~1] an archived habit's address", async ({ page }) => {
  await start(page, "stretch-archived-id-5");
  await page.goto("/habits/5");
  await expect(page.getByText("This habit isn't here any more.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Back to Today" })).toBeVisible();
});

test("[e2e->ac~streakly.guide-last-card.buttons~1] the last guide card shows only Get started", async ({ page }) => {
  await start(page, "first-run");
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText("3 of 3")).toBeVisible();
  await expect(page.getByRole("button", { name: "Get started" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Skip" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Next" })).toHaveCount(0);
});

test("[e2e->ac~streakly.failed-tick-kept.expired~1] an expired retry is refused and the banner goes", async ({ page }) => {
  await start(page, "stretch-failed-tick-expired");
  await expect(banner(page)).toBeVisible();
  await banner(page).getByRole("button", { name: "Try again" }).click();
  await expect(banner(page)).toHaveCount(0);
  await page.reload();
  await expect(tick(page, "Stretch")).toBeVisible();
  await expect(banner(page)).toHaveCount(0);
});

test("[e2e->ac~streakly.delete-habit.clears-failed~1] deleting a habit clears its failed tick", async ({ page }) => {
  await start(page, "stretch-failed-tick");
  await expect(banner(page)).toBeVisible();
  await page.getByText("Stretch", { exact: true }).click();
  await page.getByRole("button", { name: "Delete habit" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete", exact: true }).click();
  await expect.poll(() => todayNames(page)).toEqual(["Read"]);
  await expect(banner(page)).toHaveCount(0);
  await page.reload();
  await expect(tick(page, "Read")).toBeVisible();
  await expect(banner(page)).toHaveCount(0);
});

test("[e2e->ac~streakly.failed-tick-kept.blocks~1] other ticks wait for the failed one", async ({ page }) => {
  await start(page, "stretch-failed-tick");
  await expect(banner(page)).toBeVisible();
  await tick(page, "Read").click();
  await expect(banner(page)).toBeVisible();
  await expect(tick(page, "Read")).toHaveAttribute("aria-checked", "false");
  await banner(page).getByRole("button", { name: "Try again" }).click();
  await expect(tick(page, "Stretch")).toHaveAttribute("aria-checked", "true");
  await expect(banner(page)).toHaveCount(0);
});

test("[e2e->ac~streakly.restore.place-fewer~1] restoring with fewer habits than its place puts it at the end", async ({ page }) => {
  await start(page, "read-walk-archived-third");
  await tab(page, "Settings");
  await archivedRow(page, "Walk").getByRole("button", { name: "Restore" }).click();
  await expect(page.getByText("No archived habits")).toBeVisible();
  await tab(page, "Today");
  await expect.poll(() => todayNames(page)).toEqual(["Read", "Walk"]);
  await page.reload();
  await expect.poll(() => todayNames(page)).toEqual(["Read", "Walk"]);
});

test("[e2e->ac~streakly.failed-tick-kept.restart~1] a tick failing on Week is offered again on Today", async ({ page }) => {
  await start(page, "stretch-read", "writes-fail");
  await tab(page, "Week");
  await page.getByTestId(`cell-1-${todayDay()}`).click();
  await expect(banner(page)).toBeVisible();
  await tab(page, "Today");
  await expect(banner(page)).toBeVisible();
  await expect(tick(page, "Stretch")).toHaveAttribute("aria-checked", "false");
});

test("[e2e->ac~streakly.failed-tick-kept.waiting-refused~1] a tap on Week waiting behind a failing tick on Today is refused", async ({ page }) => {
  await start(page, "stretch-read", "next-tick-fails-slowly");
  await tick(page, "Stretch").click();
  await tab(page, "Week");
  const cell = page.getByTestId(`cell-2-${todayDay()}`);
  await cell.click();
  await expect(banner(page)).toBeVisible({ timeout: 10_000 });
  await expect(cell).toHaveAttribute("aria-checked", "false");
  await page.waitForTimeout(500);
  await page.reload();
  await tab(page, "Week");
  await expect(page.getByTestId(`cell-2-${todayDay()}`)).toHaveAttribute("aria-checked", "false");
});
