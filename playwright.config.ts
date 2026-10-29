import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:5173", trace: "retain-on-failure" },
  projects: [
    {
      name: "chrome",
      use: {
        ...devices["Desktop Chrome"],
        channel:
          process.env.PLAYWRIGHT_CHANNEL === "chromium" ? undefined : "chrome",
      },
    },
    ...(process.env.PLAYWRIGHT_FIREFOX === "1"
      ? [{ name: "firefox", use: { ...devices["Desktop Firefox"] } }]
      : []),
  ],
  webServer: [
    {
      command: "npm run dev:qa",
      url: "http://127.0.0.1:3000/api/health",
      timeout: 120000,
      reuseExistingServer: false,
    },
    {
      command: "npm run dev -w client",
      url: "http://127.0.0.1:5173",
      timeout: 30000,
      reuseExistingServer: false,
    },
  ],
});
