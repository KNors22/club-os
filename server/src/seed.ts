import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { connectDatabase } from "./database.js";
import {
  PUBLIC_DEMO_PASSWORD,
  seedDemoData,
  validateDemoDatabase,
} from "./services/demo-data.js";

dotenv.config({
  path: fileURLToPath(new URL("../../.env", import.meta.url)),
  quiet: true,
});
try {
  const uri = validateDemoDatabase(
    process.env.DEMO_DATABASE_URI ?? process.env.MONGODB_URI ?? "",
  );
  const password = process.env.DEMO_PASSWORD || PUBLIC_DEMO_PASSWORD;
  await connectDatabase(uri);
  const syncPasswords =
    process.env.DEMO_MODE === "true" ||
    (process.env.DEMO_MODE !== "false" && process.env.RENDER === "true");
  const result = await seedDemoData(password, new Date(), { syncPasswords });
  console.log(
    `Demo data ready: ${result.createdUsers} new accounts; ${result.updatedPasswords} demo passwords synchronized. No club records were reset and no emails were sent.`,
  );
  for (const account of result.accounts)
    console.log(`${account.email} — ${account.role}`);
  if (result.createdUsers || result.updatedPasswords)
    console.log(`Demo account password: ${password}`);
  console.log(
    "Edited records stay unchanged. Public demo mode synchronizes only the reserved demo-account passwords. Point MONGODB_URI to the same ClubOS-DB database.",
  );
} catch {
  console.error(
    "Demo seed failed. Use a reachable MongoDB URI selecting ClubOS-DB, a valid DEMO_PASSWORD, and unclaimed demo addresses. Existing records are not reset.",
  );
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
