// The worker's own browser checks, in a phone's size. With BASE_URL, against that running app;
// otherwise on the web export with the test hooks on (dist-e2e, built by `pnpm e2e`), served at
// 127.0.0.1:3000. The browser keeps the test runner's time zone, so both agree on what day it is.
import { defineConfig } from "@playwright/test";

const external = process.env.BASE_URL;

export default defineConfig({
  testDir: "e2e",
  reporter: [["list"], ["junit", { outputFile: "reports/e2e.xml" }]],
  use: { timezoneId: Intl.DateTimeFormat().resolvedOptions().timeZone, baseURL: external ?? "http://127.0.0.1:3000", viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true },
  webServer: external
    ? undefined
    : { command: "node scripts/serve.mjs", env: { DIST_DIR: "dist-e2e" }, url: "http://127.0.0.1:3000", reuseExistingServer: false, timeout: 60_000 },
});
