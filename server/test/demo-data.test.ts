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
    expect(await Membership.find().lean()).toEqual(before);
    expect(await Event.find().lean()).toEqual(events);
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
  it("requires the exact ClubOS-DB database name and validates demo passwords", async () => {
    for (const uri of [
      "mongodb://127.0.0.1:27017/ClubOS-DB",
      "mongodb+srv://demo:password@cluster.example.mongodb.net/ClubOS-DB?retryWrites=true&w=majority",
    ])
      expect(validateDemoDatabase(uri)).toBe(uri);
    for (const uri of [
      "mongodb://localhost/clubos",
      "mongodb://localhost/clubos-db",
      "mongodb://localhost/ClubOS-DB-backup",
      "mongodb://localhost/admin",
      "mongodb://localhost/",
      "not-a-uri",
    ])
      expect(() => validateDemoDatabase(uri)).toThrow();
    await expect(seedDemoData("short")).rejects.toThrow();
    expect(await User.countDocuments()).toBe(0);
  });
});

describe("public demo password synchronization", () => {
  it("synchronizes only reserved accounts while preserving normal accounts and all demo records", async () => {
    const { PUBLIC_DEMO_PASSWORD } = await import(
      "../src/services/demo-data.js"
    );
    await seedDemoData("PreviousDemoPassword2026!");
    await User.create({
      name: "Private Test Account",
      email: "private-test@example.com",
      passwordHash: await import("bcryptjs").then(({ hash }) =>
        hash("PrivateAccount2026!", 12),
      ),
    });
    const before = await Membership.find().lean();
    await Organization.updateOne(
      { name: "Demo Running Club" },
      { $set: { feeCents: 2550 } },
    );
    const sync = await seedDemoData(PUBLIC_DEMO_PASSWORD, new Date(), {
      syncPasswords: true,
    });
    expect(sync.updatedPasswords).toBe(5);
    expect(sync.createdUsers).toBe(0);
    for (const account of demoAccounts) {
      const user = await User.findById(account.id).select("+passwordHash");
      expect(await compare(PUBLIC_DEMO_PASSWORD, user!.passwordHash)).toBe(
        true,
      );
    }
    const privateUser = await User.findOne({
      email: "private-test@example.com",
    }).select("+passwordHash");
    expect(
      await compare("PrivateAccount2026!", privateUser!.passwordHash),
    ).toBe(true);
    expect(await Membership.find().lean()).toEqual(before);
    expect(
      (await Organization.findOne({ name: "Demo Running Club" }))!.feeCents,
    ).toBe(2550);
    expect(
      (
        await seedDemoData(PUBLIC_DEMO_PASSWORD, new Date(), {
          syncPasswords: true,
        })
      ).updatedPasswords,
    ).toBe(0);
  });
});
