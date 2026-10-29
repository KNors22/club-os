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
