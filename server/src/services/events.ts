import { randomUUID } from "node:crypto";
import { Event, type EventDocument } from "../models/Event.js";
import { Membership } from "../models/Membership.js";
import { AppError } from "../errors.js";

export function publicEvent(event: EventDocument, membershipId?: string) {
  const own = event.registrations.find(
    (registration) => registration.membershipId.toString() === membershipId,
  );
  return {
    id: event.id as string,
    title: event.title,
    description: event.description,
    startsAt: event.startsAt,
    location: event.location,
    capacity: event.capacity,
    registrationCount: event.registrations.length,
    attendanceCount: event.registrations.filter(
      (registration) => registration.checkedInAt,
    ).length,
    registration: own
      ? {
          registrationId: own.registrationId,
          registeredAt: own.registeredAt,
          checkedInAt: own.checkedInAt,
        }
      : null,
  };
}

export async function findEvent(organizationId: string, eventId: string) {
  const event = await Event.findOne({ _id: eventId, organizationId });
  if (!event) throw new AppError(404, "EVENT_NOT_FOUND", "Event not found.");
  return event;
}

export async function registerForEvent(
  organizationId: string,
  eventId: string,
  userId: string,
) {
  const now = new Date();
  const membership = await Membership.findOne({
    organizationId,
    userId,
    expiresAt: { $gt: now },
  });
  if (!membership)
    throw new AppError(
      403,
      "ACTIVE_MEMBERSHIP_REQUIRED",
      "An active membership is required to register. Contact your club administrator about payment.",
    );
  const registration = {
    registrationId: randomUUID(),
    membershipId: membership._id,
    registeredAt: now,
    checkedInAt: null,
  };
  // Capacity and duplicate prevention are checked in the same atomic event update.
  const event = await Event.findOneAndUpdate(
    {
      _id: eventId,
      organizationId,
      startsAt: { $gt: now },
      registrations: { $not: { $elemMatch: { membershipId: membership._id } } },
      $expr: { $lt: [{ $size: "$registrations" }, "$capacity"] },
    },
    { $push: { registrations: registration } },
    { new: true, runValidators: true },
  );
  if (event) return { event, membership, registration };
  const current = await findEvent(organizationId, eventId);
  if (
    current.registrations.some((item) =>
      item.membershipId.equals(membership._id),
    )
  )
    throw new AppError(
      409,
      "ALREADY_REGISTERED",
      "You are already registered for this event.",
    );
  if (current.startsAt <= now)
    throw new AppError(
      409,
      "EVENT_CLOSED",
      "Registration for this event has closed.",
    );
  throw new AppError(409, "EVENT_FULL", "This event has reached its capacity.");
}

export async function cancelRegistration(
  organizationId: string,
  eventId: string,
  userId: string,
) {
  const membership = await Membership.findOne({ organizationId, userId });
  const event = await findEvent(organizationId, eventId);
  const registration = event.registrations.find((item) =>
    item.membershipId.equals(membership?._id),
  );
  if (!membership || !registration) return { event, membership };
  if (event.startsAt <= new Date() || registration.checkedInAt)
    throw new AppError(
      409,
      "CANCELLATION_CLOSED",
      "This registration can no longer be cancelled.",
    );
  const updated = await Event.findOneAndUpdate(
    {
      _id: eventId,
      organizationId,
      startsAt: { $gt: new Date() },
      registrations: {
        $elemMatch: { membershipId: membership._id, checkedInAt: null },
      },
    },
    { $pull: { registrations: { membershipId: membership._id } } },
    { new: true },
  );
  if (!updated)
    throw new AppError(
      409,
      "REGISTRATION_CHANGED",
      "Registration changed. Refresh the event and try again.",
    );
  return { event: updated, membership };
}
