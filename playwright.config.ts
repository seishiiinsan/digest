import { defineConfig, devices } from "@playwright/test";

// Parcours de bout en bout sur le build de production.
// Prérequis : `docker compose up -d db mailpit`, migrations appliquées, `pnpm build`.
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    // Chromium déjà installé ailleurs (ex. conteneur de dev) : PLAYWRIGHT_CHROMIUM_PATH.
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm start",
    url: "http://localhost:3000/api/health",
    reuseExistingServer: !process.env.CI,
  },
});
