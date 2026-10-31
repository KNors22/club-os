import request from "supertest";
import { describe, it, expect } from "vitest";
import { createApp } from "../src/app.js";
import {
  PUBLIC_DEMO_PASSWORD,
  demoAccounts,
  seedDemoData,
} from "../src/services/demo-data.js";
import { app, config, store, origin } from "./setup.js";
describe("public demo account discovery", () => {
  it("exposes only intentionally public demo credentials and supports normal authenticated login", async () => {
    await seedDemoData();
    const publicApp = createApp(
      { ...config, publicDemo: { password: PUBLIC_DEMO_PASSWORD } },
      store,
    );
    const response = await request(publicApp).get("/api/config").expect(200);
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.body.publicDemo).toEqual({
      password: PUBLIC_DEMO_PASSWORD,
      accounts: demoAccounts.map(({ email, role }) => ({ email, role })),
    });
    expect(response.body).not.toHaveProperty("sessionSecret");
    expect(response.body).not.toHaveProperty("mongoUri");
    const admin = request.agent(publicApp);
    await admin
      .post("/api/auth/login")
      .set("Origin", origin)
      .send({ email: "alex@clubos", password: PUBLIC_DEMO_PASSWORD })
      .expect(200);
    expect(
      (await admin.get("/api/organizations")).body.organizations.find(
        (club: { id: string }) => club.id === "c10000000000000000000001",
      ).role,
    ).toBe("admin");
  });
  it("does not advertise demo credentials when public mode is disabled", async () => {
    const response = await request(app).get("/api/config").expect(200);
    expect(response.body).not.toHaveProperty("publicDemo");
  });
});
