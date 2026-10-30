import {
  Schema,
  model,
  type HydratedDocument,
  type InferSchemaType,
} from "mongoose";

const paymentSchema = new Schema({
  requestId: { type: String, required: true },
  amountCents: { type: Number, required: true, min: 1 },
  method: {
    type: String,
    enum: ["cash", "e-transfer", "other"],
    required: true,
  },
  reference: { type: String, default: "", maxlength: 120 },
  paidAt: { type: Date, required: true },
  recordedAt: { type: Date, required: true },
  recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
});

const membershipSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    startsAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    payments: { type: [paymentSchema], default: [] },
  },
  { timestamps: true, optimisticConcurrency: true },
);

membershipSchema.index({ organizationId: 1, userId: 1 }, { unique: true });
membershipSchema.index({ userId: 1 });
membershipSchema.index({ organizationId: 1, expiresAt: 1 });

export type MembershipDocument = HydratedDocument<
  InferSchemaType<typeof membershipSchema>
>;
export const Membership = model("Membership", membershipSchema);
