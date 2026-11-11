import { expect, test } from "@playwright/test";

import { hook, start, tab } from "./helpers";

test("[e2e->ac~streakly.first-run.shows~1] the first open shows guide card 1 of 3", async ({ page }) => {
  await hook(page, "reset");
  await page.goto("/");
  await expect(page).toHaveURL(/\/welcome$/);
  await expect(page.getByText("1 of 3")).toBeVisible();
  await expect(page.getByRole("button", { name: "Next" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Skip" })).toBeVisible();
  await expect(page.getByRole("img", { name: "White woven ribbon mark on a transparent background" })).toBeVisible();
});

test("[e2e->ac~streakly.first-run.once~1] after Get started the guide doesn't come back", async ({ page }) => {
  await hook(page, "reset");
  await page.goto("/");
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText("2 of 3")).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText("3 of 3")).toBeVisible();
  await expect(page.getByRole("button", { name: "Next" })).toHaveCount(0);
  await page.getByRole("button", { name: "Get started" }).click();
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
  await expect(page.getByText(/of 3$/)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Skip" })).toHaveCount(0);
  await expect(page).not.toHaveURL(/welcome/);
});

test("[e2e->ac~streakly.states.empty~1] Today with no habits", async ({ page }) => {
  await start(page, "no-habits");
  await expect(page.getByText("No habits yet")).toBeVisible();
  await page.getByRole("button", { name: "Add a habit" }).click();
  await expect(page.getByLabel("Name")).toBeVisible();
});

test("[e2e->ac~streakly.states.empty-week~1] Week with no habits", async ({ page }) => {
  await start(page, "no-habits");
  await tab(page, "Week");
  await expect(page.getByText("No habits yet")).toBeVisible();
  await expect(page.getByRole("button", { name: "Add a habit" })).toBeVisible();
  await expect(page.getByText("Add a habit")).toHaveCount(1);
});

test("[e2e->ac~streakly.states.loading~1] Loading shows while stored data is read", async ({ page }) => {
  await start(page, "two-habits");
  await hook(page, "force?route=/&mode=slow");
  await page.goto("/");
  await expect(page.getByText("Loading your habits…")).toBeVisible();
  await expect(page.getByText("Water")).toBeVisible({ timeout: 10_000 });
});

test("[e2e->ac~streakly.states.loading~1] Loading shows while the settings are read at start", async ({ page }) => {
  await start(page, "two-habits");
  await hook(page, "force?route=app&mode=slow");
  await page.goto("/");
  await expect(page.getByText("Loading your habits…")).toBeVisible();
  await expect(page.getByRole("link", { name: "Water" })).toBeVisible({ timeout: 15_000 });
});

test("[e2e->ac~streakly.states.error~1] a load error offers Try again", async ({ page }) => {
  await start(page, "two-habits");
  await hook(page, "force?route=/&mode=error");
  await page.goto("/");
  await expect(page.getByText("Couldn't load your habits")).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  await hook(page, "force?route=/week&mode=error");
  await page.goto("/week");
  await expect(page.getByText("Couldn't load your habits")).toBeVisible();
});

test("[e2e->ac~streakly.states.error~1] unreadable settings show the load error, not the guide", async ({ page }) => {
  await start(page, "two-habits");
  await hook(page, "force?route=app&mode=error");
  await page.goto("/");
  await expect(page.getByText("Couldn't load your habits")).toBeVisible();
  await expect(page.getByRole("button", { name: "Skip" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  // storage reads again: Try again shows Today, not the guide
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("link", { name: "Water" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Skip" })).toHaveCount(0);
});

test("[e2e->ac~streakly.states.retry~1] Try again after a load error lists the habits", async ({ page }) => {
  await hook(page, "reset");
  await hook(page, "seed?name=two-habits");
  await hook(page, "seed?name=load-fails-once");
  await expect(page.getByText("Couldn't load your habits")).toBeVisible();
  // opening the app again still fails, until Try again
  await page.goto("/");
  await expect(page.getByText("Couldn't load your habits")).toBeVisible();
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("link", { name: "Water" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Read" })).toBeVisible();
  await expect(page.getByRole("row")).toHaveCount(2);
  await expect(page.getByText("Couldn't load your habits")).toHaveCount(0);
});

test("[e2e->ac~streakly.states.retry~1] Try again after a forced load error lists the habits", async ({ page }) => {
  await start(page, "two-habits");
  await hook(page, "force?route=/&mode=error");
  await page.goto("/");
  await expect(page.getByText("Couldn't load your habits")).toBeVisible();
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("row")).toHaveCount(2);
});
