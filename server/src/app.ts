import express from "express";
import mongoose from "mongoose";
export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.get("/api/health", (_req, res) => {
    const connected = mongoose.connection.readyState === 1;
    res.status(connected ? 200 : 503).json({ status: connected ? "ok" : "unavailable", database: connected ? "connected" : "disconnected" });
  });
  return app;
}
