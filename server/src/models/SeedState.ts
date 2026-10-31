import { model, Schema } from "mongoose";

export const SeedState = model(
  "SeedState",
  new Schema(
    {
      _id: { type: String, required: true },
      anchorAt: { type: Date, required: true },
    },
    { versionKey: false },
  ),
);
