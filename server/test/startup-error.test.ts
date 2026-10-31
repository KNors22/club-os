import { describe, it, expect } from "vitest";
import {
  StartupFailure,
  startupStep,
  startupErrorMessage,
} from "../src/services/startup-error.js";
const secret =
  "mongodb+srv://private-user:private-password@private-host/ClubOS-DB";
describe("safe startup diagnostics", () => {
  it("identifies server-selection failures without disclosing the driver connection string", () => {
    const error = Object.assign(new Error(secret), {
      name: "MongooseServerSelectionError",
    });
    const message = startupErrorMessage(
      new StartupFailure("MongoDB connection", error),
    );
    expect(message).toContain("MongoDB connection");
    expect(message).toContain("Atlas Network Access");
    expect(message).not.toContain(secret);
    expect(message).not.toContain("private-password");
  });
  it("classifies authentication errors nested in a Mongo topology reason", () => {
    const error = {
      name: "MongoServerSelectionError",
      message: secret,
      reason: {
        servers: new Map([
          ["private-host", { error: { code: 18, message: secret } }],
        ]),
      },
    };
    const message = startupErrorMessage(
      new StartupFailure("MongoDB connection", error),
    );
    expect(message).toContain("authentication failed");
    expect(message).not.toContain("private-host");
  });
  it("separates authorization errors from network problems", () => {
    const message = startupErrorMessage(
      new StartupFailure("public demo initialization", {
        code: 13,
        message: secret,
      }),
    );
    expect(message).toContain("authorization failed");
    expect(message).toContain("read/write");
    expect(message).not.toContain(secret);
  });
  it("preserves safe configuration field errors and identifies the exact demo database requirement", () => {
    expect(
      startupErrorMessage(
        new StartupFailure(
          "configuration",
          new Error("Invalid environment: SESSION_SECRET is required"),
        ),
      ),
    ).toContain("SESSION_SECRET");
    expect(
      startupErrorMessage(
        new StartupFailure("database validation", new Error(secret)),
      ),
    ).toContain("exact ClubOS-DB");
  });
  it("redacts unknown failures and gives reserved-account conflicts an actionable message", () => {
    expect(
      startupErrorMessage(
        new StartupFailure("session storage", new Error(secret)),
      ),
    ).not.toContain(secret);
    expect(
      startupErrorMessage(
        new StartupFailure(
          "public demo initialization",
          new Error(
            "A reserved demo account conflicts with an existing account.",
          ),
        ),
      ),
    ).toContain("without changing that account");
  });
  it("wraps asynchronous errors with the failed stage while preserving successful results", async () => {
    expect(await startupStep("configuration", () => 42)).toBe(42);
    await expect(
      startupStep("MongoDB connection", async () => {
        throw new Error(secret);
      }),
    ).rejects.toMatchObject({ stage: "MongoDB connection" });
  });
  it("reports invalid URI formatting without echoing raw inputs", () => {
    const message = startupErrorMessage(
      new StartupFailure("MongoDB connection", {
        name: "MongoParseError",
        message: secret,
      }),
    );
    expect(message).toContain("invalid format");
    expect(message).not.toContain(secret);
  });
});
