import { AppError } from "../errors.js";
import { Membership } from "../models/Membership.js";
import { membershipStatus } from "./memberships.js";
import { getOrganizationAccess } from "./organizations.js";
import { membershipDetails } from "./payments.js";

export async function membershipCardSnapshot(
  user: { id: string; name: string },
  organizationId: string,
) {
  const { organization } = await getOrganizationAccess(user.id, organizationId);
  const membership = await Membership.findOne({
    organizationId: organization._id,
    userId: user.id,
  });
  if (!membership)
    throw new AppError(404, "MEMBERSHIP_NOT_FOUND", "Membership not found.");
  if (!membership.expiresAt)
    throw new AppError(
      409,
      "CARD_NOT_AVAILABLE",
      "Your card will be available after your administrator activates your membership.",
    );

  // Use the same instant for the card and the refreshed membership status.
  const issuedAt = new Date();
  const status = membershipStatus(membership.expiresAt, issuedAt);
  return {
    card: {
      memberName: user.name,
      clubName: organization.name,
      membershipId: membership._id.toString(),
      startsAt: membership.startsAt ?? null,
      expiresAt: membership.expiresAt,
      status,
      issuedAt,
    },
    membership: { ...membershipDetails(membership), status },
  };
}
