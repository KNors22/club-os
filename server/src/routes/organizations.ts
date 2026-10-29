import { Router } from "express";
import { Membership } from "../models/Membership.js";
import { User } from "../models/User.js";
import { requireAuth } from "../services/auth.js";
import { membershipSummary } from "../services/memberships.js";
import {
  createOrganization,
  getOrganizationAccess,
  joinOrganization,
  listOrganizations,
  publicOrganization,
  requireAdmin,
} from "../services/organizations.js";
import {
  joinSchema,
  membershipQuerySchema,
  organizationSchema,
} from "../validation.js";

export const organizationRouter = Router();
organizationRouter.use(requireAuth);
organizationRouter.get("/", async (req, res) =>
  res.json({ organizations: await listOrganizations(req.session.userId!) }),
);
organizationRouter.post("/", async (req, res) => {
  const organization = await createOrganization(
    req.session.userId!,
    organizationSchema.parse(req.body),
  );
  res.status(201).json({ organization });
});
organizationRouter.post("/join", async (req, res) => {
  const { joinCode } = joinSchema.parse(req.body);
  res
    .status(201)
    .json({
      organization: await joinOrganization(req.session.userId!, joinCode),
    });
});
organizationRouter.get("/:orgId", async (req, res) => {
  const { organization } = await getOrganizationAccess(
    req.session.userId!,
    req.params.orgId,
  );
  res.json({
    organization: publicOrganization(organization, req.session.userId!),
  });
});
organizationRouter.get("/:orgId/memberships/me", async (req, res) => {
  const { organization, role } = await getOrganizationAccess(
    req.session.userId!,
    req.params.orgId,
  );
  const membership = await Membership.findOne({
    organizationId: organization._id,
    userId: req.session.userId,
  });
  res.json({
    membership: membership ? membershipSummary(membership) : null,
    role,
  });
});
organizationRouter.get("/:orgId/memberships", async (req, res) => {
  const { organization, role } = await getOrganizationAccess(
    req.session.userId!,
    req.params.orgId,
  );
  requireAdmin(role);
  const query = membershipQuerySchema.parse(req.query);
  const now = new Date();
  const filter: Record<string, unknown> = { organizationId: organization._id };
  if (query.status === "pending") filter.expiresAt = null;
  if (query.status === "active") filter.expiresAt = { $gt: now };
  if (query.status === "expired") filter.expiresAt = { $ne: null, $lte: now };
  if (query.search) {
    const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const expression = new RegExp(escaped, "i");
    const users = await User.find({
      $or: [{ name: expression }, { email: expression }],
    }).select("_id");
    filter.userId = { $in: users.map((user) => user._id) };
  }
  const [memberships, total] = await Promise.all([
    Membership.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .populate<{ userId: { name: string; email: string } }>(
        "userId",
        "name email",
      ),
    Membership.countDocuments(filter),
  ]);
  res.json({
    memberships: memberships.map((membership) => ({
      ...membershipSummary(membership),
      user: { name: membership.userId.name, email: membership.userId.email },
    })),
    pagination: {
      total,
      page: query.page,
      limit: query.limit,
      pages: Math.ceil(total / query.limit),
    },
  });
});
organizationRouter.get("/:orgId/dashboard", async (req, res) => {
  const { organization, role } = await getOrganizationAccess(
    req.session.userId!,
    req.params.orgId,
  );
  requireAdmin(role);
  const base = { organizationId: organization._id };
  const now = new Date();
  const [total, active, expired, pending] = await Promise.all([
    Membership.countDocuments(base),
    Membership.countDocuments({ ...base, expiresAt: { $gt: now } }),
    Membership.countDocuments({ ...base, expiresAt: { $ne: null, $lte: now } }),
    Membership.countDocuments({ ...base, expiresAt: null }),
  ]);
  res.json({ counts: { total, active, expired, pending } });
});
