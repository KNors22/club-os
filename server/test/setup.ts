import { existsSync } from "node:fs";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { beforeAll, beforeEach, afterEach, afterAll } from "vitest";
import { createApp } from "../src/app.js";
import { connectDatabase, createSessionStore } from "../src/database.js";
import type { AppConfig } from "../src/config.js";
export const origin = "http://localhost:5173";
export const password = "a-long-enough-password";
export let config: AppConfig;
export let app: ReturnType<typeof createApp>;
export let store: ReturnType<typeof createSessionStore>;
let memory: MongoMemoryServer | undefined;
beforeAll(async () => {
  let uri = process.env.TEST_MONGODB_URI;
  if (uri && new URL(uri).pathname !== "/clubos_test") throw new Error("TEST_MONGODB_URI must select clubos_test");
  if (!uri) {
    const systemBinary = process.env.MONGOMS_SYSTEM_BINARY ?? (existsSync("/opt/homebrew/bin/mongod") ? "/opt/homebrew/bin/mongod" : undefined);
    memory = await MongoMemoryServer.create({ binary: { version: "7.0.26", systemBinary }, instance: { dbName: "clubos_test" } });
    uri = memory.getUri("clubos_test");
  }
  config = { nodeEnv: "test", port: 3000, appUrl: origin, mongoUri: uri, sessionSecret: "only-for-tests-this-is-a-long-enough-secret" };
  await connectDatabase(uri);
});
beforeEach(async () => {
  await Promise.all(Object.values(mongoose.models).map(model => model.deleteMany({})));
  await mongoose.connection.db!.collection("sessions").deleteMany({});
  store = createSessionStore(config);
  await store.collectionP;
  app = createApp(config, store);
});
afterEach(async () => { await store?.close(); });
afterAll(async () => { await mongoose.disconnect(); await memory?.stop(); });
export function signup(agent: ReturnType<typeof request.agent>, email = "alex@example.com", name = "Alex Morgan") {
  return agent.post("/api/auth/register").set("Origin", origin).send({ name, email, password });
}
