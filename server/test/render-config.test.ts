import { describe, it, expect } from "vitest";
import { parseConfig } from "../src/config.js";
import { PUBLIC_DEMO_PASSWORD } from "../src/services/demo-data.js";
const env = {
  NODE_ENV: "production",
  PORT: "10000",
  MONGODB_URI: "mongodb://127.0.0.1:27017/ClubOS-DB",
  SESSION_SECRET: "render-test-only-long-enough-session-secret",
  RENDER: "true",
  RENDER_EXTERNAL_URL: "https://andreys-club-os.onrender.com",
};
describe("Render runtime settings", () => {
  it("uses the Render URL and assigned port, and enables the documented public demo by default", () => {
    expect(parseConfig(env)).toMatchObject({
      port: 10000,
      appUrl: env.RENDER_EXTERNAL_URL,
      publicDemo: { password: PUBLIC_DEMO_PASSWORD },
    });
    expect(parseConfig({ ...env, APP_URL: "" }).appUrl).toBe(
      env.RENDER_EXTERNAL_URL,
    );
  });
  it("allows an explicit custom origin and an explicit demo opt-out", () => {
    const config = parseConfig({
      ...env,
      APP_URL: "https://club.example",
      DEMO_MODE: "false",
    });
    expect(config.appUrl).toBe("https://club.example");
    expect(config.publicDemo).toBeUndefined();
  });
  it("keeps local demo seeding opt-in and rejects invalid public-demo settings", () => {
    expect(
      parseConfig({
        ...env,
        RENDER: undefined,
        NODE_ENV: "development",
        RENDER_EXTERNAL_URL: undefined,
      }).publicDemo,
    ).toBeUndefined();
    expect(() => parseConfig({ ...env, DEMO_MODE: "enabled" })).toThrow(
      /DEMO_MODE/,
    );
    expect(() => parseConfig({ ...env, DEMO_PASSWORD: "short" })).toThrow(
      /DEMO_PASSWORD/,
    );
    expect(() =>
      parseConfig({ ...env, MONGODB_URI: "mongodb://127.0.0.1:27017/other" }),
    ).toThrow(/ClubOS-DB/);
  });
  it("retains strict production origin rules and the requirement for a private session secret", () => {
    for (const APP_URL of [
      "http://localhost:5173",
      "https://club.example/path",
      "https://user:pass@club.example",
    ])
      expect(() => parseConfig({ ...env, APP_URL })).toThrow();
    expect(() => parseConfig({ ...env, SESSION_SECRET: undefined })).toThrow(
      /SESSION_SECRET/,
    );
  });
});
