import {
  Schema,
  model,
  type HydratedDocument,
  type InferSchemaType,
} from "mongoose";

const registrationSchema = new Schema(
  {
    registrationId: { type: String, required: true },
    membershipId: {
      type: Schema.Types.ObjectId,
      ref: "Membership",
      required: true,
    },
    registeredAt: { type: Date, required: true },
    checkedInAt: { type: Date, default: null },
  },
  { _id: false },
);

const eventSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: "", maxlength: 1000 },
    startsAt: { type: Date, required: true },
    location: { type: String, required: true, trim: true, maxlength: 200 },
    capacity: { type: Number, required: true, min: 1, max: 10000 },
    registrations: { type: [registrationSchema], default: [] },
  },
  { timestamps: true },
);
eventSchema.index({ organizationId: 1, startsAt: 1 });
export type EventDocument = HydratedDocument<
  InferSchemaType<typeof eventSchema>
>;
export const Event = model("Event", eventSchema);
