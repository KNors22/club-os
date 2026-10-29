import mongoose from "mongoose";
import MongoStore from "connect-mongo";
import type { AppConfig } from "./config.js";
import { User } from "./models/User.js";

export async function connectDatabase(uri: string) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  await User.init();
}

export function createSessionStore(config: AppConfig) {
  const store = MongoStore.create({
    mongoUrl: config.mongoUri,
    collectionName: "sessions",
    ttl: 60 * 60 * 24 * 7,
    touchAfter: 3600,
  });
  store.on("error", () => console.error("Session database error"));
  return store;
}
