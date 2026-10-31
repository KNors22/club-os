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
    process.env.DEMO_DATABASE_URI || process.env.MONGODB_URI || "",
  );
  const password = process.env.DEMO_PASSWORD || PUBLIC_DEMO_PASSWORD;
  await connectDatabase(uri);
  const syncPasswords =
    process.env.DEMO_MODE === "true" ||
    (process.env.DEMO_MODE !== "false" && process.env.RENDER === "true");
  const result = await seedDemoData(password, new Date(), { syncPasswords });
  console.log(
    `Sample data ready: ${result.createdUsers} new accounts, ${result.createdClubs} clubs, ${result.createdMemberships} memberships, ${result.createdEvents} events; ${result.updatedPasswords} shared passwords synchronized. No club records were reset and no emails were sent.`,
  );
  console.log(
    `History anchor: ${result.anchorAt.toISOString()}; ${result.totals.payments} saved payments; ${result.migratedAccounts} starter identities updated.`,
  );
  for (const account of result.accounts)
    console.log(`${account.email} — ${account.role}`);
  if (result.createdUsers || result.updatedPasswords)
    console.log(
      "Account passwords follow DEMO_PASSWORD; the public default is documented.",
    );
  console.log(
    "Edited records stay unchanged. Public demo mode synchronizes only the reserved account passwords. Point MONGODB_URI to the same ClubOS-DB database.",
  );
} catch {
  console.error(
    "Sample seed failed. Use a reachable MongoDB URI selecting ClubOS-DB, a valid DEMO_PASSWORD, and unclaimed reserved addresses. Existing records are not reset.",
  );
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
