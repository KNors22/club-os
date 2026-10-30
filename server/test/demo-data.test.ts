import { describe, it, expect } from "vitest";
import { compare } from "bcryptjs";
import {
  seedDemoData,
  validateDemoDatabase,
  demoAccounts,
} from "../src/services/demo-data.js";
import { User } from "../src/models/User.js";
import { Organization } from "../src/models/Organization.js";
import { Membership } from "../src/models/Membership.js";
import { Event } from "../src/models/Event.js";
import "./setup.js";
const password = "FictionalDemo2026!";
describe("explicit fictional demonstration data", () => {
  it("creates useful scenarios and preserves edited records, credentials, history, and attendance on reruns", async () => {
    const now = new Date();
    const first = await seedDemoData(password, now);
    expect(first.createdUsers).toBe(5);
    expect(await Organization.countDocuments()).toBe(2);
    expect(await Membership.countDocuments()).toBe(3);
    expect(await Event.countDocuments()).toBe(2);
    expect(await Membership.countDocuments({ expiresAt: { $gt: now } })).toBe(
      1,
    );
    expect(await Membership.countDocuments({ expiresAt: null })).toBe(1);
    expect(
      await Membership.countDocuments({ expiresAt: { $lte: now, $ne: null } }),
    ).toBe(1);
    const before = await Membership.find().lean();
    const events = await Event.find().lean();
    await User.updateOne(
      { email: demoAccounts[0].email },
      { $set: { name: "Edited Demo Admin" } },
    );
    await Organization.updateOne(
      { name: "Demo Running Club" },
      { $set: { feeCents: 2550 } },
    );
    const repeat = await seedDemoData(
      "DifferentPassword2026!",
      new Date(now.getTime() + 86400000),
    );
    expect(repeat.createdUsers).toBe(0);
    expect(await User.countDocuments()).toBe(5);
    expect((await User.findOne({ email: demoAccounts[0].email }))!.name).toBe(
      "Edited Demo Admin",
    );
    expect(
      (await Organization.findOne({ name: "Demo Running Club" }))!.feeCents,
    ).toBe(2550);
    const admin = await User.findOne({ email: demoAccounts[0].email }).select(
      "+passwordHash",
    );
    expect(await compare(password, admin!.passwordHash)).toBe(true);
    // updatedAt metadata can advance on upsert checks; business fields must stay unchanged.
    const business = (records: Record<string, unknown>[]) =>
      records.map(({ updatedAt: _updatedAt, ...record }) => record);
    expect(business(await Membership.find().lean())).toEqual(business(before));
    expect(business(await Event.find().lean())).toEqual(business(events));
  });
  it("refuses reserved-address collisions before creating or changing accounts", async () => {
    await User.create({
      name: "Existing account",
      email: demoAccounts[0].email,
      passwordHash: "untouched",
    });
    await expect(seedDemoData(password)).rejects.toThrow("conflicts");
    expect(await User.countDocuments()).toBe(1);
    expect(await Organization.countDocuments()).toBe(0);
  });
  it("restricts the command to a dedicated database and validates demo passwords", async () => {
    expect(
      validateDemoDatabase("mongodb://127.0.0.1:27017/clubos_demo"),
    ).toContain("clubos_demo");
    for (const uri of [
      "mongodb://localhost/clubos",
      "mongodb://localhost/admin",
      "mongodb://localhost/",
      "not-a-uri",
    ])
      expect(() => validateDemoDatabase(uri)).toThrow();
    await expect(seedDemoData("short")).rejects.toThrow();
    expect(await User.countDocuments()).toBe(0);
  });
});
