import { randomUUID } from "node:crypto";
import { describe, it, expect } from "vitest";
import { eventFixture } from "./event-fixture.js";
import { createClub } from "./setup.js";
import { Membership } from "../src/models/Membership.js";
import { Organization } from "../src/models/Organization.js";
import { Event } from "../src/models/Event.js";
import { dashboardSummary } from "../src/services/dashboard.js";
describe("recorded dashboard analytics", () => {
  it("groups Eastern-time months, retains prior membership totals, and scopes trends/upcoming capacity to one club", async () => {
    const f = await eventFixture();
    const scopedOrganization = (await Organization.findById(f.club.id))!;
    const now = new Date("2026-04-01T02:00:00Z");
    await Membership.updateOne(
      { _id: f.members[0]._id },
      {
        $set: {
          createdAt: new Date("2025-01-01"),
          startsAt: new Date("2026-02-01"),
          expiresAt: new Date("2026-04-20"),
        },
        $push: {
          payments: {
            requestId: randomUUID(),
            amountCents: 2000,
            method: "cash",
            reference: "TIMEZONE",
            paidAt: new Date("2026-03-01T02:00:00Z"),
            recordedAt: new Date("2026-03-01T02:00:00Z"),
            recordedBy: scopedOrganization.adminUserId,
            periodStart: new Date("2026-02-01"),
            periodEnd: new Date("2026-04-20"),
          },
        },
      },
    );
    await Membership.updateOne(
      { _id: f.members[1]._id },
      { $set: { createdAt: new Date("2026-03-01T02:00:00Z") } },
    );
    // Historical fixtures override the model's immutable creation timestamp directly.
    await Membership.collection.updateOne(
      { _id: f.members[0]._id },
      { $set: { createdAt: new Date("2025-01-01") } },
    );
    await Membership.collection.updateOne(
      { _id: f.members[1]._id },
      { $set: { createdAt: new Date("2026-03-01T02:00:00Z") } },
    );
    const original = await Event.findById(f.event.id);
    await Event.updateOne(
      { _id: f.event.id },
      {
        $set: {
          startsAt: new Date("2026-02-20"),
          registrations: [
            {
              registrationId: randomUUID(),
              membershipId: f.members[0]._id,
              registeredAt: new Date("2026-02-19"),
              checkedInAt: new Date("2026-03-01T04:59:00Z"),
            },
          ],
        },
      },
    );
    for (let index = 1; index <= 6; index++)
      await Event.create({
        organizationId: f.club.id,
        createdBy: original!.createdBy,
        title: `Upcoming ${index}`,
        location: "Campus",
        capacity: 10,
        startsAt: new Date(now.getTime() + index * 86400000),
        registrations:
          index === 1
            ? [
                {
                  registrationId: randomUUID(),
                  membershipId: f.members[0]._id,
                  registeredAt: now,
                },
              ]
            : [],
      });
    const foreign = (await createClub(f.admin, "Separate Club")).body
      .organization;
    await Membership.create({
      organizationId: foreign.id,
      userId: f.members[0].userId,
      createdAt: new Date("2026-02-01"),
    });
    await Event.create({
      organizationId: foreign.id,
      createdBy: original!.createdBy,
      title: "Foreign event",
      location: "Other campus",
      capacity: 5,
      startsAt: new Date(now.getTime() + 1000),
      registrations: [
        {
          registrationId: randomUUID(),
          membershipId: f.members[0]._id,
          registeredAt: now,
          checkedInAt: new Date("2026-03-01T04:59:00Z"),
        },
      ],
    });
    const organization = await Organization.findById(f.club.id);
    const data = await dashboardSummary(organization!, now);
    expect(data.analytics.timeZone).toBe("America/Toronto");
    expect(data.analytics.monthly).toHaveLength(12);
    expect(data.analytics.monthly[0]).toMatchObject({
      month: "2025-04",
      joins: 0,
      members: 1,
      attendance: 0,
      revenueCents: 0,
    });
    expect(
      data.analytics.monthly.find((row) => row.month === "2026-02"),
    ).toEqual({
      month: "2026-02",
      joins: 1,
      members: 2,
      attendance: 1,
      revenueCents: 2000,
    });
    expect(data.analytics.monthly.at(-1)).toEqual({
      month: "2026-03",
      joins: 0,
      members: 2,
      attendance: 0,
      revenueCents: 0,
    });
    expect(data.upcomingEvents.map((event) => event.title)).toEqual([
      "Upcoming 1",
      "Upcoming 2",
      "Upcoming 3",
      "Upcoming 4",
    ]);
    expect(data.upcomingEvents[0]).toMatchObject({
      capacity: 10,
      registrationCount: 1,
    });
    expect(data.upcomingEvents[0]).not.toHaveProperty("registrations");
  });
  it("returns twelve zero-filled months and an empty event list for an empty club", async () => {
    const f = await eventFixture();
    const other = (await createClub(f.admin, "Empty Club")).body.organization;
    const data = await dashboardSummary(
      (await Organization.findById(other.id))!,
      new Date("2026-10-31T12:00:00Z"),
    );
    expect(data.analytics.monthly).toHaveLength(12);
    expect(
      data.analytics.monthly.every(
        (row) =>
          row.joins === 0 &&
          row.members === 0 &&
          row.attendance === 0 &&
          row.revenueCents === 0,
      ),
    ).toBe(true);
    expect(data.upcomingEvents).toEqual([]);
  });
});
