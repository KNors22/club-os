import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { connectDatabase, createSessionStore } from "../dist/database.js";
import { createApp } from "../dist/app.js";

let memory;
let store;
try {
  let mongoUri = process.env.TEST_MONGODB_URI;
  if (mongoUri && new URL(mongoUri).pathname !== "/clubos_test") {
    throw new Error("TEST_MONGODB_URI must select clubos_test");
  }
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
  const config = {
    nodeEnv: "production",
    port: 3000,
    appUrl: "https://clubos.example",
    mongoUri,
    sessionSecret: randomBytes(32).toString("hex"),
  };
  await connectDatabase(mongoUri);
  store = createSessionStore(config);
  await store.collectionP;
  const app = createApp(config, store);
  await request(app).get("/api/health").expect(200);
  await request(app)
    .get("/register")
    .expect(200)
    .expect("Content-Type", /html/);
  const document = await request(app)
    .get("/app/507f1f77bcf86cd799439011/members")
    .expect(200)
    .expect("Content-Type", /html/);
  assert.match(document.text, /ClubOS/);
  assert.ok(document.headers["content-security-policy"]);
  const asset = document.text.match(/src="([^"]+\.js)"/)?.[1];
  assert.ok(asset, "Frontend must reference a compiled JavaScript asset");
  await request(app)
    .get(asset)
    .expect(200)
    .expect("Content-Type", /javascript/);
  await request(app)
    .get("/api/missing")
    .expect(404)
    .expect("Content-Type", /json/);
  console.log(
    "Production smoke passed: database health, direct SPA routes, compiled asset, CSP, and JSON API 404.",
  );
} finally {
  await store?.close();
  await mongoose.disconnect();
  await memory?.stop();
}
