import request from "supertest";
import { describe, expect, it } from "vitest";
import { app, config, store, origin, password, signup } from "./setup.js";
import { User } from "../src/models/User.js";
import { createApp } from "../src/app.js";
import { registerSchema } from "../src/validation.js";
describe("authentication and profiles", () => {
  it("normalizes ClubOS first-name addresses and supports the normal account/session flow", async () => {
    const agent = request.agent(app);
    const registered = await signup(
      agent,
      "  Maya@CLUBOS  ",
      "Maya Desai",
    ).expect(201);
    expect(registered.body.user.email).toBe("maya@clubos");
    await agent
      .post("/api/auth/logout")
      .set("Origin", origin)
      .send({})
      .expect(204);
    await agent
      .post("/api/auth/login")
      .set("Origin", origin)
      .send({ email: "MAYA@CLUBOS", password })
      .expect(200);
    expect((await agent.get("/api/me").expect(200)).body.user.name).toBe(
      "Maya Desai",
    );
  });
  it("rejects malformed and unrelated single-label email addresses", () => {
    for (const email of [
      "maya",
      "@clubos",
      "maya@@clubos",
      "maya@other",
      "maya smith@clubos",
      "maya@clubos/",
      "maya@clubos.",
    ])
      expect(
        registerSchema.safeParse({ name: "Maya Desai", email, password })
          .success,
      ).toBe(false);
  });
  it("registers with a hashed password and restores a Mongo-backed session in a new app instance", async () => {
    const agent = request.agent(app);
    const result = await signup(agent, "  Alex@EXAMPLE.COM  ");
    expect(result.status).toBe(201);
    expect(result.body.user).toMatchObject({
      name: "Alex Morgan",
      email: "alex@example.com",
    });
    expect(result.body.user).not.toHaveProperty("passwordHash");
    expect(result.headers["set-cookie"][0]).toMatch(/HttpOnly/);
    expect(result.headers["set-cookie"][0]).toMatch(/SameSite=Lax/);
    const record = await User.findOne({ email: "alex@example.com" }).select(
      "+passwordHash",
    );
    expect(record?.passwordHash).toMatch(/^\$2[aby]\$/);
    const cookie = result.headers["set-cookie"][0].split(";")[0];
    const restarted = createApp(config, store);
    const restored = await request(restarted)
      .get("/api/auth/me")
      .set("Cookie", cookie);
    expect(restored.status).toBe(200);
    expect(restored.body.user.id).toBe(result.body.user.id);
  });
  it("rejects duplicate email, unknown fields, and passwords exceeding bcrypt’s byte limit", async () => {
    const agent = request.agent(app);
    await signup(agent);
    expect((await signup(agent, "ALEX@example.com")).status).toBe(409);
    expect(
      (
        await agent.post("/api/auth/register").set("Origin", origin).send({
          name: "Bad Role",
          email: "other@example.com",
          password,
          role: "admin",
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await agent
          .post("/api/auth/register")
          .set("Origin", origin)
          .send({
            name: "Long Password",
            email: "other@example.com",
            password: "é".repeat(40),
          })
      ).status,
    ).toBe(400);
  });
  it("authenticates with generic credential errors, rotates sessions, and logs out", async () => {
    const agent = request.agent(app);
    const registered = await signup(agent);
    await agent
      .post("/api/auth/logout")
      .set("Origin", origin)
      .send({})
      .expect(204);
    await agent.get("/api/auth/me").expect(401);
    const wrong = await agent
      .post("/api/auth/login")
      .set("Origin", origin)
      .send({ email: "alex@example.com", password: "incorrect" });
    const missing = await agent
      .post("/api/auth/login")
      .set("Origin", origin)
      .send({ email: "missing@example.com", password });
    expect(wrong.status).toBe(401);
    expect(missing.body).toEqual(wrong.body);
    const loggedIn = await agent
      .post("/api/auth/login")
      .set("Origin", origin)
      .send({ email: "alex@example.com", password })
      .expect(200);
    expect(loggedIn.headers["set-cookie"][0].split(";")[0]).not.toBe(
      registered.headers["set-cookie"][0].split(";")[0],
    );
    await agent.get("/api/me").expect(200);
  });
  it("lets users change their own name while protecting sign-in identity", async () => {
    const agent = request.agent(app);
    await signup(agent);
    const updated = await agent
      .patch("/api/me")
      .set("Origin", origin)
      .send({ name: "Alex Updated" })
      .expect(200);
    expect(updated.body.user.name).toBe("Alex Updated");
    await agent
      .patch("/api/me")
      .set("Origin", origin)
      .send({ name: "Alex Updated", email: "hijacked@example.com" })
      .expect(400);
    expect((await agent.get("/api/auth/me")).body.user.email).toBe(
      "alex@example.com",
    );
  });
});
