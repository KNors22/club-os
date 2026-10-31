import mongoose from "mongoose";
import { loadConfig } from "./config.js";
import { createSessionStore } from "./database.js";
import { startupStep, startupErrorMessage } from "./services/startup-error.js";
import { prepareDatabase } from "./services/startup.js";
import { createApp } from "./app.js";

async function main() {
  const config = await startupStep("configuration", loadConfig);
  await prepareDatabase(config);
  const store = await startupStep("session storage", async () => {
    const store = createSessionStore(config);
    await store.collectionP;
    return store;
  });
  const app = createApp(config, store);
  const server = app.listen(config.port, "0.0.0.0", () =>
    console.log(`ClubOS API listening on port ${config.port}`),
  );
  let stopping = false;
  const shutdown = () => {
    if (stopping) return;
    stopping = true;
    const timeout = setTimeout(() => process.exit(1), 10000).unref();
    server.close(async () => {
      await store.close();
      await mongoose.disconnect();
      clearTimeout(timeout);
      process.exit(0);
    });
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((error) => {
  console.error(startupErrorMessage(error));
  process.exit(1);
});
