import mongoose from "mongoose";
import { Membership, type MembershipDocument } from "../models/Membership.js";
import type { OrganizationDocument } from "../models/Organization.js";
import { AppError } from "../errors.js";
import { membershipSummary } from "./memberships.js";
import type { PaymentInput } from "../validation.js";

export function membershipDetails(membership: MembershipDocument) {
  return {
    ...membershipSummary(membership),
    payments: membership.payments.map((payment) => ({
      id: payment._id.toString(),
      requestId: payment.requestId,
      amountCents: payment.amountCents,
      method: payment.method,
      reference: payment.reference,
      paidAt: payment.paidAt,
      recordedAt: payment.recordedAt,
      periodStart: payment.periodStart,
      periodEnd: payment.periodEnd,
    })),
  };
}

function replay(membership: MembershipDocument, input: PaymentInput) {
  const existing = membership.payments.find(
    (payment) => payment.requestId === input.requestId,
  );
  if (!existing) return false;
  if (
    existing.amountCents !== input.amountCents ||
    existing.method !== input.method ||
    existing.reference !== input.reference ||
    existing.paidAt.getTime() !== new Date(input.paidAt).getTime()
  ) {
    throw new AppError(
      409,
      "PAYMENT_REQUEST_CONFLICT",
      "This payment request was already used with different details. Refresh the membership before recording another payment.",
    );
  }
  return true;
}

export async function recordPayment(
  organization: OrganizationDocument,
  membershipId: string,
  actorId: string,
  input: PaymentInput,
) {
  const membership = await Membership.findOne({
    _id: membershipId,
    organizationId: organization._id,
  });
  if (!membership)
    throw new AppError(404, "MEMBERSHIP_NOT_FOUND", "Membership not found.");
  if (replay(membership, input)) return { membership, replayed: true };
  if (input.amountCents !== organization.feeCents) {
    throw new AppError(
      400,
      "FULL_PAYMENT_REQUIRED",
      `Record the current full membership fee of ${(organization.feeCents / 100).toFixed(2)} CAD. Refresh this page if the fee has changed.`,
    );
  }
  const now = new Date();
  const active = membership.expiresAt && membership.expiresAt > now;
  const periodStart = new Date(
    Math.max(now.getTime(), membership.expiresAt?.getTime() ?? 0),
  );
  const periodEnd = new Date(
    periodStart.getTime() + organization.termDays * 86400000,
  );
  membership.payments.push({
    ...input,
    paidAt: new Date(input.paidAt),
    recordedAt: now,
    recordedBy: new mongoose.Types.ObjectId(actorId),
    periodStart,
    periodEnd,
  });
  if (!active) membership.startsAt = now;
  membership.expiresAt = periodEnd;
  try {
    // Payment and validity dates are saved together; __v guards concurrent renewals.
    await membership.save();
    return { membership, replayed: false };
  } catch (error) {
    if (!(error instanceof mongoose.Error.VersionError)) throw error;
    const current = await Membership.findOne({
      _id: membershipId,
      organizationId: organization._id,
    });
    if (current && replay(current, input))
      return { membership: current, replayed: true };
    throw new AppError(
      409,
      "PAYMENT_UPDATE_CONFLICT",
      "Another payment updated this membership. Refresh and retry the same payment request.",
    );
  }
}
