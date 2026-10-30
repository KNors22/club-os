import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const environmentSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    APP_URL: z.url().default("http://localhost:5173"),
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
}

export function loadConfig(): AppConfig {
  dotenv.config({
    path: fileURLToPath(new URL("../../.env", import.meta.url)),
    quiet: true,
  });
  const result = environmentSchema.safeParse(process.env);
  if (!result.success) {
    // Report field names, never connection strings or secret values.
    throw new Error(
      `Invalid environment: ${result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")}`,
    );
  }
  const env = result.data;
  const url = new URL(env.APP_URL);
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
