import { defineConfig } from "@playwright/test";
import local from "./playwright.config";
const input = process.env.APP_LIVE_URL;
if (!input)
  throw new Error(
    "Set APP_LIVE_URL to the public HTTPS origin before running live acceptance.",
  );
const url = new URL(input);
if (
  url.protocol !== "https:" ||
  url.username ||
  url.password ||
  url.pathname !== "/" ||
  url.search ||
  url.hash
)
  throw new Error(
    "APP_LIVE_URL must be a public HTTPS origin without credentials, path, or query.",
  );
export default defineConfig({
  ...local,
  webServer: undefined,
  testMatch: ["**/foundation.spec.ts", "**/club-workflows.spec.ts"],
  outputDir: "test-results/live",
  use: { ...local.use, baseURL: url.origin },
});
