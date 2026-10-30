import request from "supertest";
import { describe, expect, it } from "vitest";
import { app, config, store, origin, password } from "./setup.js";
import { createApp } from "../src/app.js";
describe("request safeguards", () => {
  it("rejects anonymous access, invalid origins, unsupported content, and malformed JSON", async () => {
    await request(app).get("/api/me").expect(401);
    await request(app).post("/api/auth/register").send({}).expect(403);
    await request(app)
      .post("/api/auth/register")
      .set("Origin", "https://untrusted.example")
      .send({})
      .expect(403);
    await request(app)
      .post("/api/auth/login")
      .set("Origin", origin)
      .type("form")
      .send("email=alex@example.com")
      .expect(415);
    await request(app)
      .post("/api/auth/login")
      .set("Origin", origin)
      .set("Content-Type", "application/json")
      .send("{")
      .expect(400);
    await request(app)
      .post("/api/auth/login")
      .set("Origin", origin)
      .send({ value: "x".repeat(17000) })
      .expect(413);
    await request(app).get("/api/does-not-exist").expect(404);
    await request(app).get("/api/health").expect(200);
  });
  it("sets secure cookies behind the production HTTPS proxy", async () => {
    const production = createApp(
      { ...config, nodeEnv: "production", appUrl: "https://clubos.example" },
      store,
    );
    const result = await request(production)
      .post("/api/auth/register")
      .set("X-Forwarded-Proto", "https")
      .set("Origin", "https://clubos.example")
      .send({
        name: "Production Member",
        email: "production@example.com",
        password,
      })
      .expect(201);
    expect(result.headers["set-cookie"][0]).toMatch(/; Secure/);
    expect(result.headers["set-cookie"][0]).toMatch(/HttpOnly/);
    expect(result.headers["content-security-policy"]).toBeDefined();
  });
  it.each(["localhost", "127.0.0.1"])(
    "accepts both local development origins when APP_URL uses %s",
    async (hostname) => {
      const development = createApp(
        {
          ...config,
          nodeEnv: "development",
          appUrl: `http://${hostname}:5173`,
        },
        store,
      );
      for (const allowed of [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
      ]) {
        await request(development)
          .post("/api/organizations")
          .set("Origin", allowed)
          .send({})
          .expect(401);
      }
      for (const rejected of [
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "https://localhost:5173",
        "http://localhost.untrusted.example:5173",
        "http://127.0.0.1.untrusted.example:5173",
        "http://localhost:5173@untrusted.example",
        "null",
      ]) {
        const result = await request(development)
          .post("/api/organizations")
          .set("Origin", rejected)
          .send({})
          .expect(403);
        expect(result.body.error.code).toBe("INVALID_ORIGIN");
      }
      await request(development)
        .post("/api/organizations")
        .send({})
        .expect(403);
    },
  );
  it.each(["test", "production"] as const)(
    "requires the exact configured origin in %s",
    async (nodeEnv) => {
      const restricted = createApp(
        { ...config, nodeEnv, appUrl: "https://localhost:5173" },
        store,
      );
      await request(restricted)
        .post("/api/organizations")
        .set("Origin", "https://localhost:5173")
        .send({})
        .expect(401);
      const result = await request(restricted)
        .post("/api/organizations")
        .set("Origin", "https://127.0.0.1:5173")
        .send({})
        .expect(403);
      expect(result.body.error.code).toBe("INVALID_ORIGIN");
    },
  );
  it("requires the configured origin for non-local development URLs", async () => {
    const development = createApp(
      { ...config, nodeEnv: "development", appUrl: "https://clubos.example" },
      store,
    );
    await request(development)
      .post("/api/organizations")
      .set("Origin", "https://clubos.example")
      .send({})
      .expect(401);
    for (const rejected of ["http://localhost:5173", "http://127.0.0.1:5173"]) {
      await request(development)
        .post("/api/organizations")
        .set("Origin", rejected)
        .send({})
        .expect(403);
    }
  });
  it("throttles repeated authentication attempts", async () => {
    for (let index = 0; index < 20; index++)
      await request(app)
        .post("/api/auth/login")
        .set("Origin", origin)
        .send({})
        .expect(400);
    const result = await request(app)
      .post("/api/auth/login")
      .set("Origin", origin)
      .send({})
      .expect(429);
    expect(result.body.error.code).toBe("TOO_MANY_ATTEMPTS");
  });
});
