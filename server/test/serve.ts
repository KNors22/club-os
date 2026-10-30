// Disposable database for browser QA. Never connects to the application database.
import { existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { seedDemoData } from "../src/services/demo-data.js";
import { createApp } from "../src/app.js";
import { connectDatabase, createSessionStore } from "../src/database.js";

const systemBinary =
  process.env.MONGOMS_SYSTEM_BINARY ??
  (existsSync("/opt/homebrew/bin/mongod")
    ? "/opt/homebrew/bin/mongod"
    : undefined);
const database = await MongoMemoryServer.create({
  binary: { version: "7.0.26", systemBinary },
});
const config = {
  nodeEnv: "test" as const,
  port: 3100,
  mongoUri: database.getUri("clubos_browser_test"),
  appUrl: "http://127.0.0.1:5174",
  sessionSecret: randomBytes(32).toString("hex"),
};
await connectDatabase(config.mongoUri);
await seedDemoData("Browser-Only-Demo-2026!");
const store = createSessionStore(config);
await store.collectionP;
const server = createApp(config, store).listen(config.port, "127.0.0.1", () =>
  console.log("Browser QA API ready with a disposable MongoDB database."),
);
let stopping = false;
function shutdown() {
  if (stopping) return;
  stopping = true;
  const timer = setTimeout(() => process.exit(1), 10000).unref();
  server.close(async () => {
    await store.close();
    await mongoose.disconnect();
    await database.stop();
    clearTimeout(timer);
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
