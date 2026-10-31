import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import {
  PUBLIC_DEMO_PASSWORD,
  validateDemoDatabase,
} from "./services/demo-data.js";
import { registerSchema } from "./validation.js";

const environmentSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    APP_URL: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.url().optional(),
    ),
    RENDER_EXTERNAL_URL: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.url().optional(),
    ),
    RENDER: z.string().optional(),
    DEMO_MODE: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.enum(["true", "false"]).optional(),
    ),
    DEMO_PASSWORD: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().optional(),
    ),
    MONGODB_URI: z
      .string()
      .regex(/^mongodb(?:\+srv)?:\/\//, "Use a MongoDB connection URI"),
    SESSION_SECRET: z
      .string()
      .min(32)
      .refine(
        (value) => !value.startsWith("replace-with"),
        "Generate a real session secret",
      ),
    RESEND_API_KEY: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().min(1).optional(),
    ),
    EMAIL_DEMO_TO: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.email().optional(),
    ),
    EMAIL_FROM: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.email().default("onboarding@resend.dev"),
    ),
  })
  .superRefine((env, context) => {
    if (Boolean(env.RESEND_API_KEY) !== Boolean(env.EMAIL_DEMO_TO)) {
      context.addIssue({
        code: "custom",
        path: [env.RESEND_API_KEY ? "EMAIL_DEMO_TO" : "RESEND_API_KEY"],
        message:
          "Configure both the Resend API key and demo inbox, or leave both empty.",
      });
    }
  });

export interface EmailConfig {
  apiKey: string;
  demoTo: string;
  from: string;
  timeoutMs?: number;
}

export interface AppConfig {
  nodeEnv: "development" | "test" | "production";
  port: number;
  appUrl: string;
  mongoUri: string;
  sessionSecret: string;
  email?: EmailConfig;
  publicDemo?: { password: string };
}

export function loadConfig(): AppConfig {
  dotenv.config({
    path: fileURLToPath(new URL("../../.env", import.meta.url)),
    quiet: true,
  });
  return parseConfig(process.env);
}

export function parseConfig(environment: Record<string, unknown>): AppConfig {
  const result = environmentSchema.safeParse(environment);
  if (!result.success) {
    // Report field names, never connection strings or secret values.
    throw new Error(
      `Invalid environment: ${result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")}`,
    );
  }
  const env = result.data;
  const url = new URL(
    env.APP_URL ?? env.RENDER_EXTERNAL_URL ?? "http://localhost:5173",
  );
  const demoEnabled =
    env.DEMO_MODE === "true" ||
    (env.DEMO_MODE === undefined && env.RENDER === "true");
  const demoPassword = env.DEMO_PASSWORD ?? PUBLIC_DEMO_PASSWORD;
  if (demoEnabled) {
    if (!registerSchema.shape.password.safeParse(demoPassword).success)
      throw new Error(
        "Invalid environment: DEMO_PASSWORD must contain 10–72 characters and fit within 72 UTF-8 bytes.",
      );
    validateDemoDatabase(env.MONGODB_URI);
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "APP_URL must be an HTTP(S) origin without a path, credentials, or query",
    );
  }
  if (env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("Production APP_URL must use HTTPS");
  }
  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    appUrl: url.origin,
    mongoUri: env.MONGODB_URI,
    ...(demoEnabled ? { publicDemo: { password: demoPassword } } : {}),
    sessionSecret: env.SESSION_SECRET,
    ...(env.RESEND_API_KEY && env.EMAIL_DEMO_TO
      ? {
          email: {
            apiKey: env.RESEND_API_KEY,
            demoTo: env.EMAIL_DEMO_TO,
            from: env.EMAIL_FROM,
          },
        }
      : {}),
  };
}
