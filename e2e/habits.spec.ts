import { expect, test } from "@playwright/test";

import { tokens } from "../src/theme/tokens";
import { background, drag, rgb, start, tab, tick, todayNames } from "./helpers";

test("[e2e->ac~streakly.habit-add.saves~1] a new habit goes at the end of Today", async ({ page }) => {
  await start(page, "drink-water");
  await expect(page.getByText("Drink water")).toBeVisible();
  await page.getByRole("button", { name: "+" }).click();
  await page.getByLabel("Name").fill("Stretch");
  await page.getByRole("radio").nth(2).click();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("link", { name: "Stretch" })).toBeVisible();
  await expect.poll(() => todayNames(page)).toEqual(["Drink water", "Stretch"]);
  const rows = page.getByRole("row");
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toHaveAccessibleName("Drink water");
  await expect(rows.nth(1)).toHaveAccessibleName("Stretch");
  await expect(page.getByRole("row", { name: "Stretch" }).getByText("0-day streak")).toBeVisible();
  await expect(page.getByRole("row", { name: "Stretch" }).getByText("Best: 0")).toBeVisible();
  const row = page.locator('[data-testid^="habit-row-"]').nth(1);
  await expect(row.getByText("0-day streak", { exact: true })).toBeVisible();
  await expect(row.getByText("Best: 0", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("link", { name: "Stretch" })).toBeVisible();
  await expect.poll(() => todayNames(page)).toEqual(["Drink water", "Stretch"]);
  // the third colour was kept
  await page.getByRole("link", { name: "Stretch" }).click();
  await expect(page.getByRole("radio").nth(2)).toHaveAttribute("aria-checked", "true");
});

test("[e2e->ac~streakly.form-states.empty-name~1] a name of only spaces is refused", async ({ page }) => {
  await start(page, "no-habits");
  await page.getByRole("button", { name: "+" }).click();
  await page.getByLabel("Name").fill("   ");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Give your habit a name")).toBeVisible();
  const field = await page.getByLabel("Name").boundingBox();
  const message = await page.getByText("Give your habit a name").boundingBox();
  expect(message!.y).toBeGreaterThan(field!.y + field!.height - 1);
  await page.goto("/");
  await expect(page.getByText("No habits yet")).toBeVisible();
});

test("[e2e->ac~streakly.form-states.max-length~1] the name field stops at 40 characters", async ({ page }) => {
  await start(page, "no-habits");
  await page.getByRole("button", { name: "+" }).click();
  const typed = "abcdefghij".repeat(4) + "KLMNO";
  await page.getByLabel("Name").pressSequentially(typed);
  await expect(page.getByLabel("Name")).toHaveValue(typed.slice(0, 40));
  await page.getByLabel("Name").fill("");
  await page.getByLabel("Name").fill(typed);
  await expect(page.getByLabel("Name")).toHaveValue(typed.slice(0, 40));
});

test("[e2e->ac~streakly.form-states.save-error~1] a failed save keeps the form", async ({ page }) => {
  await start(page, "no-habits", "writes-fail");
  await page.getByRole("button", { name: "Add a habit" }).click();
  await page.getByLabel("Name").fill("Read");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Couldn't save. Try again.")).toBeVisible();
  await expect(page.getByLabel("Name")).toHaveValue("Read");
  await expect(page.getByRole("button", { name: "Save" })).toBeEnabled();
});

test("[e2e->ac~streakly.habit-add.colours~1] eight colours, the first picked", async ({ page }) => {
  await start(page, "no-habits");
  await page.getByRole("button", { name: "+" }).click();
  const swatches = page.getByRole("radiogroup", { name: "Colour" }).getByRole("radio");
  await expect(swatches).toHaveCount(8);
  await expect(swatches.first()).toHaveAttribute("aria-checked", "true");
  for (let i = 1; i < 8; i += 1) await expect(swatches.nth(i)).toHaveAttribute("aria-checked", "false");
});

test("[e2e->ac~streakly.habit-edit.keeps-ticks~1] renaming keeps the ticks", async ({ page }) => {
  await start(page, "read-ticked-today");
  await expect(page.getByText("1-day streak")).toBeVisible();
  await page.getByText("Read", { exact: true }).click();
  await expect(page.getByLabel("Name")).toHaveValue("Read");
  await page.getByLabel("Name").fill("Read 20 min");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Read 20 min")).toBeVisible();
  await expect(tick(page, "Read 20 min")).toHaveAttribute("aria-checked", "true");
  await expect(page.getByText("1-day streak")).toBeVisible();
});

test("[e2e->ac~streakly.habit-delete.confirm~1] Delete habit asks first", async ({ page }) => {
  await start(page, "stretch-5-ticks");
  await page.getByText("Stretch", { exact: true }).click();
  await page.getByRole("button", { name: "Delete habit" }).click();
  const prompt = page.getByRole("dialog");
  await expect(prompt.getByText("Delete this habit and all its history?")).toBeVisible();
  // only the prompt's buttons are reachable while it is open
  await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Cancel" })).toHaveCount(1);
  await expect(prompt.getByRole("button", { name: "Delete", exact: true })).toBeVisible();
  await expect(prompt.getByRole("button", { name: "Cancel" })).toBeVisible();
});

test("[e2e->ac~streakly.habit-delete.cancel~1] Cancel keeps the habit", async ({ page }) => {
  await start(page, "stretch-5-ticks");
  await page.getByText("Stretch", { exact: true }).click();
  await page.getByRole("button", { name: "Delete habit" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByText("Delete this habit and all its history?")).toBeHidden();
  await expect(page).toHaveURL(/\/habits\/\d+$/);
  await expect(page.getByLabel("Name")).toHaveValue("Stretch");
  await expect(page.getByRole("radio").nth(2)).toHaveAttribute("aria-checked", "true");
  await page.goto("/week");
  await expect(page.getByRole("checkbox", { name: /^Stretch, / , checked: true })).toHaveCount(5);
});

test("[e2e->ac~streakly.habit-delete.removes~1] Delete removes the habit and its ticks", async ({ page }) => {
  await start(page, "stretch-5-ticks");
  await page.getByText("Stretch", { exact: true }).click();
  await page.getByRole("button", { name: "Delete habit" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText("No habits yet")).toBeVisible();
  await expect(page.getByText("Stretch")).toHaveCount(0);
  await tab(page, "Week");
  await expect(page.getByText("No habits yet")).toBeVisible();
  await expect(page.getByText("Stretch")).toHaveCount(0);
  // the ticks are gone too: a new habit has none
  await page.reload();
  await expect(page.getByText("Stretch")).toHaveCount(0);
});

test("[e2e->ac~streakly.tick-today.tick~1] ticking fills the box in the habit's colour", async ({ page }) => {
  await start(page, "water-unticked");
  const box = tick(page, "Water");
  await expect(box).toHaveAttribute("aria-checked", "false");
  await box.click();
  await expect(box).toHaveAttribute("aria-checked", "true");
  expect(await background(box)).toBe(rgb(tokens.habit.light[0]));
  await expect(page.getByText("1-day streak")).toBeVisible();
});

test("[e2e->ac~streakly.tick-today.untick~1] tapping again unticks", async ({ page }) => {
  await start(page, "water-ticked-today");
  const box = tick(page, "Water");
  await expect(box).toHaveAttribute("aria-checked", "true");
  await box.click();
  await expect(box).toHaveAttribute("aria-checked", "false");
  expect(await background(box)).toBe(rgb(tokens.light.surface));
  await expect(page.getByText("0-day streak")).toBeVisible();
  await page.reload();
  await expect(tick(page, "Water")).toHaveAttribute("aria-checked", "false");
});

test("[e2e->ac~streakly.habit-reorder.persists~1] a dragged order sticks after a restart", async ({ page }) => {
  await start(page, "water-read-stretch");
  await expect.poll(() => todayNames(page)).toEqual(["Water", "Read", "Stretch"]);
  await page.getByRole("link", { name: "Stretch" }).scrollIntoViewIfNeeded();
  await drag(page, "Stretch", "Water");
  await expect.poll(() => todayNames(page)).toEqual(["Stretch", "Water", "Read"]);
  await page.reload();
  await expect(page.getByRole("link", { name: "Stretch" })).toBeVisible();
  await expect.poll(() => todayNames(page)).toEqual(["Stretch", "Water", "Read"]);
  await tab(page, "Week");
  const rows = page.locator('[data-testid^="week-row-"] [role="rowheader"]');
  await expect(rows).toHaveText(["Stretch", "Water", "Read"]);
});
