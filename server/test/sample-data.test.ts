import { describe, expect, it } from "vitest";
import { Types } from "mongoose";
import {
  buildSampleData,
  sampleAccounts,
  sampleClubs,
  sampleId,
} from "../src/services/sample-data.js";
import { seedDemoData } from "../src/services/demo-data.js";
import { User } from "../src/models/User.js";
import { Organization } from "../src/models/Organization.js";
import { Membership } from "../src/models/Membership.js";
import { Event } from "../src/models/Event.js";
import { SeedState } from "../src/models/SeedState.js";
import "./setup.js";
const anchor = new Date("2026-10-31T12:00:00Z");

describe("historical sample dataset", () => {
  it("contains natural names, first-name addresses, six clubs, and substantial history from 2010", () => {
    const data = buildSampleData(anchor);
    expect(data.accounts).toHaveLength(48);
    expect(data.organizations).toHaveLength(6);
    expect(data.memberships.length).toBeGreaterThan(150);
    expect(data.events.length).toBeGreaterThan(300);
    expect(data.memberships.flatMap((m) => m.payments).length).toBeGreaterThan(
      1000,
    );
    expect(new Set(data.accounts.map((a) => a.email)).size).toBe(48);
    for (const person of data.accounts) {
      expect(person.email).toBe(
        `${person.name.split(" ")[0].toLowerCase()}@clubos`,
      );
      expect(person.name).not.toMatch(/demo/i);
    }
    expect(
      JSON.stringify([data.organizations, data.memberships, data.events]),
    ).not.toMatch(/demo/i);
    expect(
      Math.min(...data.memberships.map((m) => m.createdAt.getUTCFullYear())),
    ).toBe(2010);
    expect(
      Math.min(...data.events.map((e) => e.startsAt.getUTCFullYear())),
    ).toBe(2010);
    expect(
      Math.min(
        ...data.memberships.flatMap((m) =>
          m.payments.map((p) => p.paidAt.getUTCFullYear()),
        ),
      ),
    ).toBe(2010);
    expect(
      data.memberships.filter((m) => m.expiresAt && m.expiresAt > anchor)
        .length,
    ).toBeGreaterThan(50);
    expect(data.memberships.filter((m) => !m.expiresAt).length).toBeGreaterThan(
      20,
    );
    expect(
      data.memberships.filter((m) => m.expiresAt && m.expiresAt <= anchor)
        .length,
    ).toBeGreaterThan(20);
  });
  it("keeps renewal periods and event attendance chronologically and organizationally consistent", () => {
    const data = buildSampleData(anchor);
    const members = new Map(
      data.memberships.map((m) => [m._id.toHexString(), m]),
    );
    const users = new Set(data.accounts.map((a) => a.id));
    const clubs = new Map(
      data.organizations.map((o) => [o._id.toHexString(), o]),
    );
    for (const member of data.memberships) {
      const club = clubs.get(member.organizationId.toHexString())!;
      expect(users.has(member.userId.toHexString())).toBe(true);
      expect(member.createdAt >= club.createdAt).toBe(true);
      for (const [index, payment] of member.payments.entries()) {
        expect(payment.recordedBy.equals(club.adminUserId)).toBe(true);
        expect(
          payment.paidAt >= member.createdAt && payment.paidAt <= anchor,
        ).toBe(true);
        expect(
          payment.recordedAt >= payment.paidAt && payment.recordedAt <= anchor,
        ).toBe(true);
        expect(
          payment.periodEnd.getTime() - payment.periodStart.getTime(),
        ).toBe(365 * 86400000);
        if (index)
          expect(payment.periodStart).toEqual(
            member.payments[index - 1].periodEnd,
          );
      }
      expect(member.expiresAt).toEqual(
        member.payments.at(-1)?.periodEnd ?? null,
      );
    }
    for (const event of data.events) {
      expect(event.registrations.length).toBeLessThanOrEqual(event.capacity);
      expect(
        new Set(event.registrations.map((r) => r.membershipId.toHexString()))
          .size,
      ).toBe(event.registrations.length);
      for (const registration of event.registrations) {
        const member = members.get(registration.membershipId.toHexString())!;
        expect(member.organizationId.equals(event.organizationId)).toBe(true);
        expect(
          registration.registeredAt >= member.createdAt &&
            registration.registeredAt >= event.createdAt,
        ).toBe(true);
        expect(
          registration.registeredAt < event.startsAt &&
            registration.registeredAt <= anchor,
        ).toBe(true);
        expect(
          member.payments.some(
            (p) =>
              p.periodStart <= registration.registeredAt &&
              p.periodEnd > registration.registeredAt,
          ),
        ).toBe(true);
        if (registration.checkedInAt)
          expect(
            registration.checkedInAt >= event.startsAt &&
              registration.checkedInAt <= anchor &&
              registration.checkedInAt <= event.updatedAt,
          ).toBe(true);
        if (event.startsAt > anchor)
          expect(registration.checkedInAt).toBeNull();
      }
    }
  });
  it("anchors first-run dates and resumes missing records without moving edited data on later years", async () => {
    const first = await seedDemoData(undefined, anchor);
    expect(first.totals).toMatchObject({ users: 48, clubs: 6 });
    expect(first.totals.payments).toBeGreaterThan(1000);
    const user = await User.findById(sampleAccounts[5].id).lean();
    const before = await Membership.find().lean();
    const events = await Event.find().lean();
    const removed = events.at(-1)!;
    await Event.deleteOne({ _id: removed._id });
    await seedDemoData(undefined, new Date("2029-04-01T12:00:00Z"));
    expect(await Event.findById(removed._id).lean()).toEqual(removed);
    expect(await Membership.find().lean()).toEqual(before);
    expect(await User.findById(sampleAccounts[5].id).lean()).toEqual(user);
    expect((await SeedState.findOne())!.anchorAt).toEqual(anchor);
  });
  it("migrates only known starter labels and addresses while retaining IDs, edits and histories", async () => {
    await seedDemoData(undefined, anchor);
    for (const account of sampleAccounts.slice(0, 5))
      await User.updateOne(
        { _id: account.id },
        { $set: { email: account.legacyEmail, name: account.legacyName } },
        { timestamps: false },
      );
    await User.updateOne(
      { _id: sampleAccounts[1].id },
      { $set: { name: "Jordan's chosen name" } },
    );
    await Organization.updateOne(
      { _id: sampleClubs[0].id },
      { $set: { name: "Demo Running Club", feeCents: 2750 } },
      { timestamps: false },
    );
    await Organization.updateOne(
      { _id: sampleClubs[1].id },
      { $set: { name: "Members' Art Society" } },
      { timestamps: false },
    );
    await Event.updateOne(
      { _id: "c30000000000000000000001" },
      { $set: { title: "Demo community run" } },
      { timestamps: false },
    );
    const before = await Membership.find().lean();
    const result = await seedDemoData(
      undefined,
      new Date("2027-01-01T00:00:00Z"),
    );
    expect(result.migratedAccounts).toBe(5);
    expect((await User.findById(sampleAccounts[0].id))!.name).toBe(
      "Alex Rivera",
    );
    expect((await User.findById(sampleAccounts[1].id))!.name).toBe(
      "Jordan's chosen name",
    );
    expect(
      await User.countDocuments({
        email: { $in: sampleAccounts.slice(0, 5).map((a) => a.legacyEmail) },
      }),
    ).toBe(0);
    expect((await Organization.findById(sampleClubs[0].id))!.name).toBe(
      "Riverside Running Club",
    );
    expect((await Organization.findById(sampleClubs[0].id))!.feeCents).toBe(
      2750,
    );
    expect((await Organization.findById(sampleClubs[1].id))!.name).toBe(
      "Members' Art Society",
    );
    expect((await Event.findById("c30000000000000000000001"))!.title).toBe(
      "Riverside community run",
    );
    expect(await Membership.find().lean()).toEqual(before);
  });
  it("preflights the entire dataset, including the last reserved address, before any writes", async () => {
    const ordinary = await User.create({
      name: "Existing Audrey",
      email: "audrey@clubos",
      passwordHash: "preserved",
    });
    await expect(
      seedDemoData(undefined, anchor, { syncPasswords: true }),
    ).rejects.toThrow("conflicts");
    expect(await User.countDocuments()).toBe(1);
    expect(
      (await User.findById(ordinary._id).select("+passwordHash"))!.passwordHash,
    ).toBe("preserved");
    expect(await Organization.countDocuments()).toBe(0);
    expect(await SeedState.countDocuments()).toBe(0);
  });
  it("rejects a club join-code collision before creating accounts or rewriting ownership", async () => {
    const person = await User.create({
      name: "Existing Organizer",
      email: "organizer@example.com",
      passwordHash: "preserved",
    });
    const club = await Organization.create({
      name: "Existing Club",
      adminUserId: person._id,
      joinCode: sampleClubs[5].joinCode,
      feeCents: 1500,
      termDays: 365,
    });
    await expect(seedDemoData(undefined, anchor)).rejects.toThrow("conflicts");
    expect(await User.countDocuments()).toBe(1);
    expect((await Organization.findById(club._id))!.adminUserId).toEqual(
      person._id,
    );
    expect(await SeedState.countDocuments()).toBe(0);
  });
  it("rejects a reserved membership ID pointing at another organization", async () => {
    await seedDemoData(undefined, anchor);
    await Membership.updateOne(
      { _id: sampleId(2, 6) },
      { $set: { organizationId: new Types.ObjectId() } },
    );
    await expect(seedDemoData(undefined, anchor)).rejects.toThrow("conflicts");
  });
  it("preserves an existing joined relationship with a different ID and avoids dangling event references", async () => {
    await seedDemoData(undefined, anchor);
    const originalId = sampleId(2, 6);
    const record = (await Membership.findById(originalId).lean())!;
    await Membership.deleteOne({ _id: originalId });
    const existing = await Membership.create({
      ...record,
      _id: new Types.ObjectId(),
    });
    await Event.deleteMany({ organizationId: sampleClubs[0].id });
    const before = await Membership.findById(existing._id).lean();
    await seedDemoData(undefined, anchor);
    expect(await Membership.findById(originalId)).toBeNull();
    expect(await Membership.findById(existing._id).lean()).toEqual(before);
    expect(
      await Membership.countDocuments({
        userId: existing.userId,
        organizationId: existing.organizationId,
      }),
    ).toBe(1);
    const events = await Event.find({
      organizationId: sampleClubs[0].id,
    }).lean();
    expect(
      events.some((e) =>
        e.registrations.some((r) => r.membershipId.equals(existing._id)),
      ),
    ).toBe(true);
    expect(
      events.some((e) =>
        e.registrations.some((r) => r.membershipId.equals(originalId)),
      ),
    ).toBe(false);
  });
});
