import { expect, test } from "@playwright/test";

import { tokens } from "../src/theme/tokens";
import { background, rgb, start, tab, tick } from "./helpers";

test("[e2e->ac~streakly.no-network.offline~1] offline, adding, ticking and theming work with 0 requests", async ({ page, context }) => {
  await start(page, "no-habits");
  await expect(page.getByText("No habits yet")).toBeVisible();
  const requests: string[] = [];
  page.on("request", (r) => requests.push(r.url()));
  await context.setOffline(true);
  await page.getByRole("button", { name: "+" }).click();
  await page.getByLabel("Name").fill("Water");
  await page.getByRole("button", { name: "Save" }).click();
  await tick(page, "Water").click();
  await expect(tick(page, "Water")).toHaveAttribute("aria-checked", "true");
  await tab(page, "Settings");
  await page.getByRole("radio", { name: "Dark" }).click();
  await expect(page.getByRole("radio", { name: "Dark" })).toHaveAttribute("aria-checked", "true");
  expect(await background(page.locator("body"))).toBe(rgb(tokens.dark.bg));
  await tab(page, "Week");
  await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(1);
  expect(requests).toEqual([]);
});

test("[e2e->ac~streakly.no-notifications.none~1] no notification permission is asked and none sent", async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __asked: number; __shown: number; Notification: unknown };
    w.__asked = 0;
    w.__shown = 0;
    class Fake {
      static permission = "default";
      static requestPermission() {
        w.__asked += 1;
        return Promise.resolve("denied");
      }
      constructor() {
        w.__shown += 1;
      }
    }
    w.Notification = Fake;
    const perms = navigator.permissions;
    if (perms) {
      const query = perms.query.bind(perms);
      perms.query = (d: PermissionDescriptor) => {
        if (d.name === "notifications") w.__asked += 1;
        return query(d);
      };
    }
  });
  const dialogs: string[] = [];
  page.on("dialog", (d) => {
    dialogs.push(d.message());
    void d.dismiss();
  });
  const { hook } = await import("./helpers");
  await hook(page, "reset");
  await page.goto("/");
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Get started" }).click();
  await page.getByRole("button", { name: "Add a habit" }).click();
  await page.getByLabel("Name").fill("Water");
  await page.getByRole("button", { name: "Save" }).click();
  await tick(page, "Water").click();
  await expect(tick(page, "Water")).toHaveAttribute("aria-checked", "true");
  expect(await page.evaluate(() => (window as unknown as { __asked: number }).__asked)).toBe(0);
  expect(await page.evaluate(() => (window as unknown as { __shown: number }).__shown)).toBe(0);
  expect(await page.evaluate(async () => (await navigator.serviceWorker?.getRegistrations())?.length ?? 0)).toBe(0);
  expect(dialogs).toEqual([]);
});
