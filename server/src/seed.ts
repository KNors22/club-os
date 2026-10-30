import dotenv from "dotenv";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { connectDatabase } from "./database.js";
import { seedDemoData, validateDemoDatabase } from "./services/demo-data.js";

dotenv.config({
  path: fileURLToPath(new URL("../../.env", import.meta.url)),
  quiet: true,
});
try {
  const uri = validateDemoDatabase(
    process.env.DEMO_DATABASE_URI ?? process.env.MONGODB_URI ?? "",
  );
  const password =
    process.env.DEMO_PASSWORD || randomBytes(24).toString("base64url");
  await connectDatabase(uri);
  const result = await seedDemoData(password);
  console.log(
    `Demo data ready: ${result.createdUsers} new accounts. No existing records were reset and no emails were sent.`,
  );
  for (const account of result.accounts)
    console.log(`${account.email} — ${account.role}`);
  if (result.createdUsers)
    console.log(`Password for newly created demo accounts: ${password}`);
  console.log(
    "Existing account passwords and edited records remain unchanged. Point the application MONGODB_URI to the same clubos_demo database.",
  );
} catch {
  console.error(
    "Demo seed failed. Use a reachable MongoDB URI selecting clubos_demo, a valid DEMO_PASSWORD, and unclaimed demo addresses. Existing records are not reset.",
  );
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
