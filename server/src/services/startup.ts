import { startupStep } from "./startup-error.js";
import type { AppConfig } from "../config.js";
import { connectDatabase } from "../database.js";
import { seedDemoData, validateDemoDatabase } from "./demo-data.js";

export async function prepareDatabase(config: AppConfig) {
  if (config.publicDemo)
    await startupStep("database validation", () =>
      validateDemoDatabase(config.mongoUri),
    );
  await startupStep("MongoDB connection", () =>
    connectDatabase(config.mongoUri),
  );
  if (config.publicDemo) {
    const result = await startupStep("public demo initialization", () =>
      seedDemoData(config.publicDemo!.password, new Date(), {
        syncPasswords: true,
      }),
    );
    console.log(
      `Sample data ready: ${result.createdUsers} accounts, ${result.createdClubs} clubs, ${result.createdMemberships} memberships and ${result.createdEvents} events added; ${result.updatedPasswords} shared passwords synchronized. Existing club records were preserved.`,
    );
  }
}
