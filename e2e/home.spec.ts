import { expect, test } from "@playwright/test";

test("[e2e->ac~app.home.loads~1] the home screen shows its title", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Nothing here yet.")).toBeVisible();
});
