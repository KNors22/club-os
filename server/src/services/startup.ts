import type { AppConfig } from "../config.js";
import { connectDatabase } from "../database.js";
import { seedDemoData, validateDemoDatabase } from "./demo-data.js";

export async function prepareDatabase(config: AppConfig) {
  if (config.publicDemo) validateDemoDatabase(config.mongoUri);
  await connectDatabase(config.mongoUri);
  if (config.publicDemo) {
    const result = await seedDemoData(config.publicDemo.password, new Date(), {
      syncPasswords: true,
    });
    console.log(
      `Public demo ready: ${result.createdUsers} accounts added; ${result.updatedPasswords} demo passwords synchronized. Existing club records were preserved.`,
    );
  }
}
