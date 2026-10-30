import { Router } from "express";
import { Membership } from "../models/Membership.js";
import { User } from "../models/User.js";
import { AppError } from "../errors.js";
import { requireAuth } from "../services/auth.js";
import {
  getOrganizationAccess,
  requireAdmin,
} from "../services/organizations.js";
import { membershipDetails, recordPayment } from "../services/payments.js";
import { idSchema, paymentInputSchema } from "../validation.js";

export function createPaymentRouter() {
  const router = Router();
  router.use(requireAuth);
  router.get("/:orgId/memberships/:membershipId", async (req, res) => {
    const { organization, role } = await getOrganizationAccess(
      req.session.userId!,
      req.params.orgId,
    );
    requireAdmin(role);
    const id = idSchema.parse(req.params.membershipId);
    const membership = await Membership.findOne({
      _id: id,
      organizationId: organization._id,
    });
    if (!membership)
      throw new AppError(404, "MEMBERSHIP_NOT_FOUND", "Membership not found.");
    const user = await User.findById(membership.userId).select("name email");
    if (!user) throw new AppError(404, "MEMBER_NOT_FOUND", "Member not found.");
    res.json({
      membership: membershipDetails(membership),
      user: { name: user.name, email: user.email },
    });
  });
  router.post(
    "/:orgId/memberships/:membershipId/payments",
    async (req, res) => {
      const { organization, role } = await getOrganizationAccess(
        req.session.userId!,
        req.params.orgId,
      );
      requireAdmin(role);
      const id = idSchema.parse(req.params.membershipId);
      const input = paymentInputSchema.parse(req.body);
      const result = await recordPayment(
        organization,
        id,
        req.session.userId!,
        input,
      );
      res
        .status(result.replayed ? 200 : 201)
        .json({
          membership: membershipDetails(result.membership),
          replayed: result.replayed,
        });
    },
  );
  return router;
}
