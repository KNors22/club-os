import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import net from "node:net";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { hash, compare } from "bcryptjs";
import { User } from "../dist/models/User.js";
import { Organization } from "../dist/models/Organization.js";
import { Membership } from "../dist/models/Membership.js";
import { Event } from "../dist/models/Event.js";
import { PUBLIC_DEMO_PASSWORD } from "../dist/services/demo-data.js";
const root = fileURLToPath(new URL("../../", import.meta.url));
let memory, child;
let logs = "";
const origin = "https://render-demo.example";
const sessionSecret = randomBytes(32).toString("hex");
async function freePort() {
  const server = net.createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}
async function stop() {
  if (!child || child.exitCode !== null) return;
  const processToStop = child;
  const ended = new Promise((resolve) => processToStop.once("exit", resolve));
  processToStop.kill("SIGTERM");
  const timer = setTimeout(() => processToStop.kill("SIGKILL"), 12000);
  await ended;
  clearTimeout(timer);
  child = undefined;
}
try {
  const systemBinary =
    process.env.MONGOMS_SYSTEM_BINARY ??
    (existsSync("/opt/homebrew/bin/mongod")
      ? "/opt/homebrew/bin/mongod"
      : undefined);
  memory = await MongoMemoryServer.create({
    binary: { version: "7.0.26", systemBinary },
  });
  const mongoUri = memory.getUri("ClubOS-DB");
  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;
  async function boot() {
    logs = "";
    child = spawn(process.execPath, ["server/dist/index.js"], {
      cwd: root,
      env: {
        ...process.env,
        NODE_ENV: "production",
        PORT: String(port),
        MONGODB_URI: mongoUri,
        SESSION_SECRET: sessionSecret,
        APP_URL: "",
        RENDER_EXTERNAL_URL: origin,
        RENDER: "true",
        DEMO_MODE: "",
        DEMO_PASSWORD: PUBLIC_DEMO_PASSWORD,
        RESEND_API_KEY: "",
        EMAIL_DEMO_TO: "",
        EMAIL_FROM: "onboarding@resend.dev",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.stdout.on("data", (data) => {
      logs += data.toString();
    });
    child.stderr.on("data", (data) => {
      logs += data.toString();
    });
    let ready = false;
    for (let attempt = 0; attempt < 150; attempt++) {
      if (child.exitCode !== null)
        throw new Error(`Render-style startup exited: ${logs.slice(-1500)}`);
      try {
        const result = await fetch(`${base}/api/health`, {
          signal: AbortSignal.timeout(500),
        });
        if (result.status === 200) {
          ready = true;
          break;
        }
      } catch {
        // Retry while the compiled server is still starting.
      }
      await delay(100);
    }
    assert.ok(
      ready,
      `Render-style startup did not become healthy: ${logs.slice(-1500)}`,
    );
  }
  async function api(method, path, body, cookie) {
    return fetch(`${base}/api${path}`, {
      method,
      headers: {
        Origin: origin,
        "X-Forwarded-Proto": "https",
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  }
  async function login(email, password = PUBLIC_DEMO_PASSWORD) {
    const response = await api("POST", "/auth/login", { email, password });
    assert.equal(response.status, 200, `Login failed for ${email}`);
    const cookie = response.headers.getSetCookie()[0];
    assert.match(cookie, /Secure/);
    return cookie.split(";")[0];
  }
  await boot();
  const config = await (await api("GET", "/config")).json();
  assert.equal(config.publicDemo.password, PUBLIC_DEMO_PASSWORD);
  assert.equal(config.publicDemo.accounts.length, 48);
  const cookie = await login("alex@clubos");
  await login("jordan@clubos");
  await mongoose.connect(mongoUri);
  assert.equal(await User.countDocuments(), 48);
  assert.equal(await Organization.countDocuments(), 6);
  assert.ok((await Membership.countDocuments()) > 150);
  assert.ok((await Event.countDocuments()) > 300);
  const path = "/organizations/c10000000000000000000001";
  assert.equal(
    (
      await api(
        "PATCH",
        path,
        { feeCents: 2550, expectedFeeCents: 2000 },
        cookie,
      )
    ).status,
    200,
  );
  const memberships = await Membership.find().lean();
  const events = await Event.find().lean();
  await User.updateOne(
    { email: "alex@clubos" },
    { $set: { passwordHash: await hash("PreviousDemo2026!", 12) } },
  );
  await User.create({
    name: "Ordinary Test Member",
    email: "ordinary@example.com",
    passwordHash: await hash("OrdinaryPrivate2026!", 12),
  });
  await stop();
  await boot();
  assert.equal(
    (await api("GET", "/auth/me", undefined, cookie)).status,
    200,
    "Mongo-backed session must survive the process restart",
  );
  await login("alex@clubos");
  await login("jordan@clubos");
  await login("ordinary@example.com", "OrdinaryPrivate2026!");
  assert.equal(
    (await Organization.findById("c10000000000000000000001")).feeCents,
    2550,
  );
  assert.deepEqual(await Membership.find().lean(), memberships);
  assert.deepEqual(await Event.find().lean(), events);
  assert.equal(await User.countDocuments(), 49);
  const user = await User.findOne({ email: "ordinary@example.com" }).select(
    "+passwordHash",
  );
  assert.equal(await compare("OrdinaryPrivate2026!", user.passwordHash), true);
  const page = await fetch(`${base}/login`);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /ClubOS/);
  console.log(
    "Render startup smoke passed: compiled process, automatic HTTPS origin, public demo discovery/login, seeded data, restart/session persistence, demo-password synchronization, and preservation of ordinary accounts and edited records.",
  );
} finally {
  await stop();
  await mongoose.disconnect();
  await memory?.stop();
}
