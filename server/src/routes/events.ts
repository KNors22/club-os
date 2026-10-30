import { Router } from "express";
import { AppError } from "../errors.js";
import type { AppConfig } from "../config.js";
import { confirmRegistration } from "../services/notifications.js";
import { Event } from "../models/Event.js";
import { Membership } from "../models/Membership.js";
import { requireAuth } from "../services/auth.js";
import {
  getOrganizationAccess,
  requireAdmin,
} from "../services/organizations.js";
import {
  cancelRegistration,
  findEvent,
  publicEvent,
  registerForEvent,
} from "../services/events.js";
import {
  emptyBodySchema,
  eventInputSchema,
  eventQuerySchema,
  idSchema,
} from "../validation.js";

export function createEventRouter(config: AppConfig) {
  const router = Router();
  router.use(requireAuth);
  router.get("/:orgId/events", async (req, res) => {
    const { organization } = await getOrganizationAccess(
      req.session.userId!,
      req.params.orgId,
    );
    const query = eventQuerySchema.parse(req.query);
    const filter = {
      organizationId: organization._id,
      ...(query.view === "upcoming" ? { startsAt: { $gt: new Date() } } : {}),
    };
    const [events, total, membership] = await Promise.all([
      Event.find(filter)
        .sort({ startsAt: 1, _id: 1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit),
      Event.countDocuments(filter),
      Membership.findOne({
        organizationId: organization._id,
        userId: req.session.userId,
      }).select("_id"),
    ]);
    res.json({
      events: events.map((event) => publicEvent(event, membership?.id)),
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        pages: Math.ceil(total / query.limit),
      },
    });
  });
  router.post("/:orgId/events", async (req, res) => {
    const { organization, role } = await getOrganizationAccess(
      req.session.userId!,
      req.params.orgId,
    );
    requireAdmin(role);
    const input = eventInputSchema.parse(req.body);
    const event = await Event.create({
      ...input,
      startsAt: new Date(input.startsAt),
      organizationId: organization._id,
      createdBy: req.session.userId,
    });
    res.status(201).json({ event: publicEvent(event) });
  });
  router.get("/:orgId/events/:eventId", async (req, res) => {
    const { organization } = await getOrganizationAccess(
      req.session.userId!,
      req.params.orgId,
    );
    const event = await findEvent(
      organization.id,
      idSchema.parse(req.params.eventId),
    );
    const membership = await Membership.findOne({
      organizationId: organization._id,
      userId: req.session.userId,
    }).select("_id");
    res.json({ event: publicEvent(event, membership?.id) });
  });
  router.get("/:orgId/events/:eventId/participants", async (req, res) => {
    const { organization, role } = await getOrganizationAccess(
      req.session.userId!,
      req.params.orgId,
    );
    requireAdmin(role);
    const event = await findEvent(
      organization.id,
      idSchema.parse(req.params.eventId),
    );
    const members = await Membership.find({
      organizationId: organization._id,
      _id: { $in: event.registrations.map((item) => item.membershipId) },
    }).populate<{ userId: { name: string; email: string } }>(
      "userId",
      "name email",
    );
    res.json({
      participants: event.registrations.map((registration) => {
        const membership = members.find((member) =>
          member._id.equals(registration.membershipId),
        );
        return {
          membershipId: registration.membershipId.toString(),
          name: membership?.userId?.name ?? "Unavailable member",
          email: membership?.userId?.email ?? "",
          registeredAt: registration.registeredAt,
          checkedInAt: registration.checkedInAt,
        };
      }),
    });
  });
  router.post("/:orgId/events/:eventId/registrations/me", async (req, res) => {
    const { organization } = await getOrganizationAccess(
      req.session.userId!,
      req.params.orgId,
    );
    emptyBodySchema.parse(req.body);
    const result = await registerForEvent(
      organization.id,
      idSchema.parse(req.params.eventId),
      req.session.userId!,
    );
    const notification = await confirmRegistration(
      config.email,
      organization,
      result.event,
      result.membership,
      result.registration.registrationId,
    );
    res.status(201).json({
      event: publicEvent(result.event, result.membership.id),
      notification,
    });
  });
  router.delete(
    "/:orgId/events/:eventId/registrations/me",
    async (req, res) => {
      const { organization } = await getOrganizationAccess(
        req.session.userId!,
        req.params.orgId,
      );
      emptyBodySchema.parse(req.body);
      const result = await cancelRegistration(
        organization.id,
        idSchema.parse(req.params.eventId),
        req.session.userId!,
      );
      res.json({ event: publicEvent(result.event, result.membership?.id) });
    },
  );
  router.post(
    "/:orgId/events/:eventId/attendance/:membershipId",
    async (req, res) => {
      const { organization, role } = await getOrganizationAccess(
        req.session.userId!,
        req.params.orgId,
      );
      requireAdmin(role);
      emptyBodySchema.parse(req.body);
      const eventId = idSchema.parse(req.params.eventId);
      const membershipId = idSchema.parse(req.params.membershipId);
      const updated = await Event.findOneAndUpdate(
        {
          _id: eventId,
          organizationId: organization._id,
          registrations: { $elemMatch: { membershipId, checkedInAt: null } },
        },
        { $set: { "registrations.$.checkedInAt": new Date() } },
        { new: true, runValidators: true },
      );
      const event = updated ?? (await findEvent(organization.id, eventId));
      const registration = event.registrations.find(
        (item) => item.membershipId.toString() === membershipId,
      );
      if (!registration)
        throw new AppError(
          404,
          "NOT_REGISTERED",
          "This member is not registered for this event.",
        );
      res.json({
        event: publicEvent(event),
        checkedInAt: registration.checkedInAt,
        alreadyCheckedIn: !updated,
      });
    },
  );
  return router;
}
