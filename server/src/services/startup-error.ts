export type StartupStage =
  | "configuration"
  | "database validation"
  | "MongoDB connection"
  | "public demo initialization"
  | "session storage";
export class StartupFailure extends Error {
  constructor(
    public stage: StartupStage,
    cause: unknown,
  ) {
    super(`Startup failed during ${stage}`, { cause });
    this.name = "StartupFailure";
  }
}
export async function startupStep<T>(
  stage: StartupStage,
  operation: () => T | Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw new StartupFailure(stage, error);
  }
}
function details(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}
export function startupErrorMessage(error: unknown) {
  const stage =
    error instanceof StartupFailure ? error.stage : "application startup";
  const cause = error instanceof StartupFailure ? error.cause : error;
  const record = details(cause);
  if (
    stage === "configuration" &&
    cause instanceof Error &&
    cause.message.startsWith("Invalid environment:")
  )
    return cause.message;
  const codes = [record.code];
  const reason = details(record.reason ?? record.cause);
  if (reason.servers instanceof Map)
    for (const server of reason.servers.values())
      codes.push(details(details(server).error).code);
  let message: string;
  if (codes.includes(18) || codes.includes(8000))
    message =
      "MongoDB authentication failed. Verify the database username/password and authentication settings in MONGODB_URI.";
  else if (codes.includes(13))
    message =
      "MongoDB authorization failed. The database user needs read/write and index permissions for ClubOS-DB.";
  else if (
    [
      "MongooseServerSelectionError",
      "MongoServerSelectionError",
      "MongoNetworkError",
      "MongoNetworkTimeoutError",
    ].includes(String(record.name)) ||
    codes.some((code) =>
      [
        "ENOTFOUND",
        "EAI_AGAIN",
        "ECONNREFUSED",
        "ETIMEDOUT",
        "ESERVFAIL",
      ].includes(String(code)),
    )
  )
    message =
      "MongoDB connection failed or timed out. Allow the Render service Connect > Outbound IP ranges in Atlas Network Access, and verify cluster availability and the MONGODB_URI hostname.";
  else if (record.name === "MongoParseError")
    message =
      "MONGODB_URI has an invalid format. Use a MongoDB connection URI selecting ClubOS-DB.";
  else if (stage === "database validation")
    message =
      "Public demo mode requires MONGODB_URI to select the exact ClubOS-DB database.";
  else if (
    stage === "public demo initialization" &&
    cause instanceof Error &&
    cause.message.startsWith("A reserved demo account conflicts")
  )
    message =
      "A reserved demo account ID/email conflicts with an existing account. Seeding stopped without changing that account.";
  else if (stage === "configuration")
    message =
      "Check the required environment variables and HTTPS application origin.";
  else
    message =
      "An unexpected error prevented startup. Check the configuration and permissions for this startup stage.";
  // Driver errors can include connection strings, hostnames, or credentials. Emit only fixed diagnostic text.
  return `Startup failed during ${stage}: ${message}`;
}
