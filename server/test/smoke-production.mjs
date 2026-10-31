import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { connectDatabase, createSessionStore } from "../dist/database.js";
import { createApp } from "../dist/app.js";
import { User } from "../dist/models/User.js";
import { Organization } from "../dist/models/Organization.js";
import { Membership } from "../dist/models/Membership.js";
import { Event } from "../dist/models/Event.js";
let memory, store;
const userIds = [],
  organizationIds = [];
try {
  let mongoUri = process.env.TEST_MONGODB_URI;
  if (mongoUri && new URL(mongoUri).pathname !== "/clubos_test")
    throw new Error("TEST_MONGODB_URI must select clubos_test");
  if (!mongoUri) {
    const systemBinary =
      process.env.MONGOMS_SYSTEM_BINARY ??
      (existsSync("/opt/homebrew/bin/mongod")
        ? "/opt/homebrew/bin/mongod"
        : undefined);
    memory = await MongoMemoryServer.create({
      binary: { version: "7.0.26", systemBinary },
    });
    mongoUri = memory.getUri("clubos_production_smoke");
  }
  const origin = "https://clubos.example";
  const config = {
    nodeEnv: "production",
    port: 3000,
    appUrl: origin,
    mongoUri,
    sessionSecret: randomBytes(32).toString("hex"),
  };
  await connectDatabase(mongoUri);
  store = createSessionStore(config);
  await store.collectionP;
  const app = createApp(config, store);
  const actor = () => ({ cookie: "" });
  function api(who, method, path, body) {
    const client = request(app);
    let operation = client[method](`/api${path}`).set(
      "X-Forwarded-Proto",
      "https",
    );
    if (who.cookie) operation = operation.set("Cookie", who.cookie);
    if (!["get", "head"].includes(method))
      operation = operation.set("Origin", origin);
    if (body !== undefined) operation = operation.send(body);
    return operation;
  }
  const suffix = randomUUID(),
    password = "Compiled-Smoke-2026!";
  async function register(who, name) {
    const response = await api(who, "post", "/auth/register", {
      name,
      email: `${name.toLowerCase()}-${suffix}@clubos.example`,
      password,
    }).expect(201);
    userIds.push(response.body.user.id);
    const cookies = response.headers["set-cookie"];
    assert.ok(cookies?.length);
    assert.match(cookies[0], /HttpOnly/);
    assert.match(cookies[0], /Secure/);
    assert.match(cookies[0], /SameSite=Lax/);
    who.cookie = cookies[0].split(";")[0];
    await api(who, "get", "/auth/me").expect(200);
  }
  await request(app).get("/api/health").expect(200);
  for (const path of [
    "/register",
    "/app/507f1f77bcf86cd799439011/members",
    "/app/507f1f77bcf86cd799439011/settings",
  ])
    await request(app).get(path).expect(200).expect("Content-Type", /html/);
  const document = await request(app).get("/register");
  assert.match(document.text, /ClubOS/);
  assert.ok(document.headers["content-security-policy"]);
  const asset = document.text.match(/src="([^"]+\.js)"/)?.[1];
  assert.ok(asset);
  await request(app)
    .get(asset)
    .expect(200)
    .expect("Content-Type", /javascript/);
  await request(app)
    .get("/api/missing")
    .expect(404)
    .expect("Content-Type", /json/);
  const admin = actor(),
    member = actor();
  await register(admin, "Administrator");
  await register(member, "Member");
  async function club(name) {
    const response = await api(admin, "post", "/organizations", {
      name,
      description: "Fictional compiled smoke data",
      feeCents: 2000,
      termDays: 365,
    }).expect(201);
    organizationIds.push(response.body.organization.id);
    return response.body.organization;
  }
  const organization = await club("Smoke Running Club"),
    other = await club("Smoke Other Club");
  const path = `/organizations/${organization.id}`;
  await api(member, "post", "/organizations/join", {
    joinCode: organization.joinCode,
  }).expect(201);
  const membership = (
    await api(member, "get", `${path}/memberships/me`).expect(200)
  ).body.membership;
  assert.equal(membership.status, "pending");
  await api(member, "get", `${path}/memberships/me/card`).expect(409);
  await api(member, "patch", path, {
    feeCents: 2550,
    expectedFeeCents: 2000,
  }).expect(403);
  await api(member, "get", `/organizations/${other.id}`).expect(404);
  const paymentPath = `${path}/memberships/${membership.id}/payments`;
  const payment = {
    requestId: randomUUID(),
    amountCents: 2000,
    method: "cash",
    reference: "FICTIONAL-SMOKE",
    paidAt: new Date(Date.now() - 1000).toISOString(),
  };
  const paid = await api(admin, "post", paymentPath, payment).expect(201);
  assert.equal(paid.body.membership.status, "active");
  assert.equal(paid.body.notification.status, "disabled");
  await api(admin, "patch", path, {
    feeCents: 2550,
    expectedFeeCents: 2000,
  }).expect(200);
  await api(admin, "post", paymentPath, payment).expect(200);
  const renewal = await api(admin, "post", paymentPath, {
    ...payment,
    requestId: randomUUID(),
    amountCents: 2550,
  }).expect(201);
  assert.equal(renewal.body.membership.payments.length, 2);
  const card = await api(member, "get", `${path}/memberships/me/card`).expect(
    200,
  );
  assert.equal(card.headers["cache-control"], "no-store");
  assert.equal(card.body.card.membershipId, membership.id);
  assert.equal(card.body.card.status, "active");
  assert.equal(card.body.card.expiresAt, renewal.body.membership.expiresAt);
  await api(admin, "get", `${path}/memberships/me/card`).expect(404);
  await api(
    member,
    "get",
    `/organizations/${other.id}/memberships/me/card`,
  ).expect(404);
  assert.equal(
    new Date(renewal.body.membership.expiresAt) -
      new Date(paid.body.membership.expiresAt),
    365 * 86400000,
  );
  const event = (
    await api(admin, "post", `${path}/events`, {
      title: "Smoke community run",
      location: "Fictional campus",
      startsAt: new Date(Date.now() + 86400000).toISOString(),
      capacity: 1,
    }).expect(201)
  ).body.event;
  const eventPath = `${path}/events/${event.id}`;
  const registration = await api(
    member,
    "post",
    `${eventPath}/registrations/me`,
    {},
  ).expect(201);
  assert.equal(registration.body.notification.status, "disabled");
  await api(member, "post", `${eventPath}/registrations/me`, {}).expect(409);
  await api(member, "delete", `${eventPath}/registrations/me`, {}).expect(200);
  await api(member, "post", `${eventPath}/registrations/me`, {}).expect(201);
  const attendancePath = `${eventPath}/attendance/${membership.id}`;
  const checkIn = await api(admin, "post", attendancePath, {}).expect(200);
  const again = await api(admin, "post", attendancePath, {}).expect(200);
  assert.equal(again.body.checkedInAt, checkIn.body.checkedInAt);
  const dashboard = (await api(admin, "get", `${path}/dashboard`).expect(200))
    .body;
  assert.deepEqual(dashboard.counts, {
    total: 1,
    active: 1,
    expired: 0,
    pending: 0,
  });
  assert.equal(dashboard.payments.totalCents, 4550);
  assert.equal(dashboard.events.attendance, 1);
  await api(member, "post", "/auth/logout", {}).expect(204);
  await api(member, "get", "/auth/me").expect(401);
  console.log(
    "Production smoke passed: compiled assets/routes, secure cookies, scoped accounts, fee updates, payments/renewals, current membership cards, registration/cancellation, idempotent check-in, dashboard, and logout.",
  );
} finally {
  if (mongoose.connection.readyState === 1) {
    await Event.deleteMany({ organizationId: { $in: organizationIds } });
    await Membership.deleteMany({ organizationId: { $in: organizationIds } });
    await Organization.deleteMany({ _id: { $in: organizationIds } });
    await User.deleteMany({ _id: { $in: userIds } });
  }
  await store?.close();
  await mongoose.disconnect();
  await memory?.stop();
}
