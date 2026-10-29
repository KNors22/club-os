export type MembershipStatus = "pending" | "active" | "expired";

export function membershipStatus(
  expiresAt: Date | null | undefined,
  now = new Date(),
): MembershipStatus {
  if (!expiresAt) return "pending";
  return expiresAt.getTime() > now.getTime() ? "active" : "expired";
}

export function membershipSummary(membership: {
  _id: { toString(): string };
  createdAt: Date;
  startsAt?: Date | null;
  expiresAt?: Date | null;
}) {
  return {
    id: membership._id.toString(),
    joinedAt: membership.createdAt,
    startsAt: membership.startsAt ?? null,
    expiresAt: membership.expiresAt ?? null,
    status: membershipStatus(membership.expiresAt),
  };
}
