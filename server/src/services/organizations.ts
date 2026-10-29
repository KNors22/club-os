import { randomBytes } from "node:crypto";
import {
  Organization,
  type OrganizationDocument,
} from "../models/Organization.js";
import { Membership } from "../models/Membership.js";
import { AppError } from "../errors.js";
import { idSchema } from "../validation.js";

export type ClubRole = "admin" | "member";

export function publicOrganization(
  organization: OrganizationDocument,
  userId: string,
) {
  const isAdmin = organization.adminUserId.toString() === userId;
  return {
    id: organization.id as string,
    name: organization.name,
    description: organization.description,
    feeCents: organization.feeCents,
    currency: organization.currency,
    termDays: organization.termDays,
    role: isAdmin ? ("admin" as const) : ("member" as const),
    ...(isAdmin ? { joinCode: organization.joinCode } : {}),
  };
}

export async function listOrganizations(userId: string) {
  const memberships = await Membership.find({ userId }).select(
    "organizationId",
  );
  const organizations = await Organization.find({
    $or: [
      { adminUserId: userId },
      {
        _id: {
          $in: memberships.map((membership) => membership.organizationId),
        },
      },
    ],
  })
    .select("+joinCode")
    .sort({ name: 1 });
  return organizations.map((organization) =>
    publicOrganization(organization, userId),
  );
}

export async function createOrganization(
  userId: string,
  input: {
    name: string;
    description: string;
    feeCents: number;
    termDays: number;
  },
) {
  const organization = await Organization.create({
    ...input,
    adminUserId: userId,
    joinCode: randomBytes(6).toString("hex").toUpperCase(),
  });
  return publicOrganization(organization, userId);
}

export async function joinOrganization(userId: string, joinCode: string) {
  const organization = await Organization.findOne({ joinCode });
  if (!organization)
    throw new AppError(
      404,
      "CLUB_NOT_FOUND",
      "No club matches that join code. Check the code with your administrator.",
    );
  if (organization.adminUserId.toString() === userId)
    throw new AppError(409, "ALREADY_ADMIN", "You already manage this club.");
  try {
    await Membership.create({ organizationId: organization._id, userId });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      throw new AppError(
        409,
        "ALREADY_MEMBER",
        "You have already joined this club.",
      );
    }
    throw error;
  }
  return publicOrganization(organization, userId);
}

export async function getOrganizationAccess(
  userId: string,
  organizationId: unknown,
) {
  const id = idSchema.parse(organizationId);
  const organization = await Organization.findById(id).select("+joinCode");
  if (!organization)
    throw new AppError(404, "CLUB_NOT_FOUND", "Club not found.");
  if (organization.adminUserId.toString() === userId)
    return { organization, role: "admin" as ClubRole };
  if (await Membership.exists({ organizationId: id, userId }))
    return { organization, role: "member" as ClubRole };
  throw new AppError(404, "CLUB_NOT_FOUND", "Club not found.");
}

export function requireAdmin(role: ClubRole) {
  if (role !== "admin")
    throw new AppError(
      403,
      "ADMIN_REQUIRED",
      "Only club administrators can view this information.",
    );
}
