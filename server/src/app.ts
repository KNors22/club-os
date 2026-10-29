import express from "express";
import session, { type Store } from "express-session";
import helmet from "helmet";
import mongoose from "mongoose";
import type { AppConfig } from "./config.js";
import { AppError, errorHandler } from "./errors.js";
import { authRouter, sessionCookieName } from "./routes/auth.js";
import { profileRouter } from "./routes/profile.js";

export function createApp(config: AppConfig, store: Store) {
  const app = express();
  const isProduction = config.nodeEnv === "production";
  app.disable("x-powered-by");
  if (isProduction) app.set("trust proxy", 1);
  app.use(
    helmet({
      contentSecurityPolicy: isProduction ? undefined : false,
      strictTransportSecurity: isProduction ? undefined : false,
    }),
  );
  app.get("/api/health", (_req, res) => {
    const connected = mongoose.connection.readyState === 1;
    res
      .status(connected ? 200 : 503)
      .json({
        status: connected ? "ok" : "unavailable",
        database: connected ? "connected" : "disconnected",
      });
  });
  app.use("/api", (_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
  app.use("/api", (req, _res, next) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      if (req.get("origin") !== config.appUrl)
        throw new AppError(
          403,
          "INVALID_ORIGIN",
          "This request must come from ClubOS.",
        );
      if (!req.is("application/json"))
        throw new AppError(
          415,
          "JSON_REQUIRED",
          "Use application/json for this request.",
        );
    }
    next();
  });
  app.use("/api", express.json({ limit: "16kb" }));
  app.use(
    "/api",
    session({
      name: sessionCookieName,
      secret: config.sessionSecret,
      store,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      },
    }),
  );
  app.use("/api/auth", authRouter(isProduction));
  app.use("/api/me", profileRouter);
  app.use("/api", () => {
    throw new AppError(404, "NOT_FOUND", "API endpoint not found.");
  });
  app.use(errorHandler);
  return app;
}
