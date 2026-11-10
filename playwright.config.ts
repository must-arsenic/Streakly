// The worker's own browser checks, on the web export with the test hooks on (dist-e2e, built by
// `pnpm e2e`), served at 127.0.0.1:3000 in a phone's size.
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  reporter: [["list"], ["junit", { outputFile: "reports/e2e.xml" }]],
  use: { baseURL: "http://127.0.0.1:3000", viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true },
  webServer: { command: "node scripts/serve.mjs", env: { DIST_DIR: "dist-e2e" }, url: "http://127.0.0.1:3000", reuseExistingServer: false, timeout: 60_000 },
});
