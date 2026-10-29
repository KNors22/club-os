import mongoose from "mongoose";
import { loadConfig } from "./config.js";
import { connectDatabase } from "./database.js";
import { createApp } from "./app.js";
async function main() {
  const config = loadConfig();
  await connectDatabase(config.mongoUri);
  const server = createApp().listen(config.port, "0.0.0.0", () => console.log(`ClubOS API listening on port ${config.port}`));
  let stopping = false;
  const shutdown = () => {
    if (stopping) return;
    stopping = true;
    const timeout = setTimeout(() => process.exit(1), 10000).unref();
    server.close(async () => { await mongoose.disconnect(); clearTimeout(timeout); process.exit(0); });
  };
  process.on("SIGINT", shutdown); process.on("SIGTERM", shutdown);
}
main().catch(() => { console.error("Startup failed. Check environment and MongoDB connectivity."); process.exit(1); });
