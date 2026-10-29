import {
  Schema,
  model,
  type HydratedDocument,
  type InferSchemaType,
} from "mongoose";

const organizationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, default: "", maxlength: 500 },
    adminUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    joinCode: { type: String, required: true, unique: true, select: false },
    feeCents: { type: Number, required: true, min: 1, max: 1000000 },
    currency: { type: String, enum: ["CAD"], default: "CAD", required: true },
    termDays: { type: Number, required: true, min: 1, max: 1095 },
  },
  { timestamps: true },
);

export type OrganizationDocument = HydratedDocument<
  InferSchemaType<typeof organizationSchema>
>;
export const Organization = model("Organization", organizationSchema);
