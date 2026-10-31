import { compare, hash } from "bcryptjs";
import { Types } from "mongoose";
import { User } from "../models/User.js";
import { Organization } from "../models/Organization.js";
import { Membership } from "../models/Membership.js";
import { Event } from "../models/Event.js";
import { SeedState } from "../models/SeedState.js";
import { registerSchema } from "../validation.js";
import {
  buildSampleData,
  sampleAccounts,
  type SeedMembership,
  type SeedEvent,
} from "./sample-data.js";

// Retain existing environment/import compatibility and the configured public password.
export const PUBLIC_DEMO_PASSWORD = "ClubOSDemo2026!";
export const demoAccounts = sampleAccounts;
const stateId = "sample-data-v1.2";
export function validateDemoDatabase(uri: string) {
  let url: URL;
  try {
    url = new URL(uri);
  } catch {
    throw new Error("Use a MongoDB URI selecting the ClubOS-DB database.");
  }
  if (
    !["mongodb:", "mongodb+srv:"].includes(url.protocol) ||
    url.pathname !== "/ClubOS-DB"
  )
    throw new Error("Sample data must use the ClubOS-DB database.");
  return uri;
}
const conflict = () =>
  new Error(
    "A reserved demo account conflicts with an existing account. Sample seeding stopped without changing unrelated records.",
  );
type Dataset = ReturnType<typeof buildSampleData>;
async function preflight(data: Dataset) {
  const existingUsers = await User.find({
    $or: [
      { _id: { $in: sampleAccounts.map((a) => a.id) } },
      {
        email: {
          $in: sampleAccounts.flatMap((a) => [
            a.email,
            ...(a.legacyEmail ? [a.legacyEmail] : []),
          ]),
        },
      },
    ],
  }).select("_id email name +passwordHash");
  const byId = new Map(existingUsers.map((u) => [u._id.toHexString(), u]));
  const byEmail = new Map(existingUsers.map((u) => [u.email, u]));
  for (const account of sampleAccounts) {
    const existing = byId.get(account.id);
    if (
      existing &&
      existing.email !== account.email &&
      existing.email !== account.legacyEmail
    )
      throw conflict();
    for (const email of [account.email, account.legacyEmail]) {
      const holder = email ? byEmail.get(email) : undefined;
      if (holder && holder._id.toHexString() !== account.id) throw conflict();
    }
  }
  const organizations = await Organization.find({
    $or: [
      { _id: { $in: data.organizations.map((o) => o._id) } },
      { joinCode: { $in: data.organizations.map((o) => o.joinCode) } },
    ],
  })
    .select("+joinCode")
    .lean();
  for (const found of organizations) {
    const expected = data.organizations.find((o) => o._id.equals(found._id));
    if (
      !expected ||
      !expected.adminUserId.equals(found.adminUserId) ||
      data.organizations.some(
        (o) => o.joinCode === found.joinCode && !o._id.equals(found._id),
      )
    )
      throw conflict();
  }
  const memberships = await Membership.find({
    $or: [
      { _id: { $in: data.memberships.map((m) => m._id) } },
      ...data.organizations.map((o) => ({
        organizationId: o._id,
        userId: { $in: sampleAccounts.map((a) => a.id) },
      })),
    ],
  })
    .select("_id organizationId userId createdAt payments")
    .lean();
  const ids = new Map(data.memberships.map((m) => [m._id.toHexString(), m]));
  const pairs = new Map(
    data.memberships.map((m) => [`${m.organizationId}:${m.userId}`, m]),
  );
  for (const found of memberships) {
    const expected = ids.get(found._id.toHexString());
    const pair = pairs.get(`${found.organizationId}:${found.userId}`);
    if (
      expected &&
      (!expected.organizationId.equals(found.organizationId) ||
        !expected.userId.equals(found.userId))
    )
      throw conflict();
    if (pair && !pair._id.equals(found._id)) {
      // A visitor may already have joined another starter club. Reuse that
      // relationship; preserve its dates/history and only reference valid periods.
      const generatedId = pair._id;
      pair._id = found._id;
      for (const event of data.events) {
        event.registrations = event.registrations.filter((registration) => {
          if (!registration.membershipId.equals(generatedId)) return true;
          if (
            found.createdAt > registration.registeredAt ||
            !found.payments.some(
              (payment) =>
                payment.periodStart <= registration.registeredAt &&
                payment.periodEnd > registration.registeredAt,
            )
          )
            return false;
          registration.membershipId = found._id;
          return true;
        });
      }
    }
  }
  const events = await Event.find({
    _id: { $in: data.events.map((e) => e._id) },
  })
    .select("_id organizationId createdBy")
    .lean();
  const eventIds = new Map(data.events.map((e) => [e._id.toHexString(), e]));
  for (const found of events) {
    const expected = eventIds.get(found._id.toHexString())!;
    if (
      !expected.organizationId.equals(found.organizationId) ||
      !expected.createdBy.equals(found.createdBy)
    )
      throw conflict();
  }
  return byId;
}
export async function seedDemoData(
  password = PUBLIC_DEMO_PASSWORD,
  now = new Date(),
  options: { syncPasswords?: boolean } = {},
) {
  registerSchema.shape.password.parse(password);
  const previous = await SeedState.findById(stateId);
  let data = buildSampleData(previous?.anchorAt ?? now);
  // Validate generated records and all reserved identities before any write.
  for (const account of sampleAccounts)
    registerSchema.parse({
      name: account.name,
      email: account.email,
      password,
    });
  for (const item of data.organizations) {
    const error = new Organization(item).validateSync();
    if (error) throw error;
  }
  for (const item of data.memberships) {
    const error = new Membership(item).validateSync();
    if (error) throw error;
  }
  for (const item of data.events) {
    const error = new Event(item).validateSync();
    if (error) throw error;
  }
  let existing = await preflight(data);
  const state = await SeedState.findOneAndUpdate(
    { _id: stateId },
    { $setOnInsert: { anchorAt: now } },
    { upsert: true, new: true },
  );
  if (state!.anchorAt.getTime() !== (previous?.anchorAt ?? now).getTime()) {
    data = buildSampleData(state!.anchorAt);
    existing = await preflight(data);
  }
  const passwordMatches = new Map<string, Promise<boolean>>();
  function matches(value: string) {
    let result = passwordMatches.get(value);
    if (!result) {
      result = compare(password, value);
      passwordMatches.set(value, result);
    }
    return result;
  }
  const needingPassword = await Promise.all(
    sampleAccounts.map(async (account) => {
      const found = existing.get(account.id);
      return (
        !found ||
        (options.syncPasswords && !(await matches(found.passwordHash)))
      );
    }),
  );
  const passwordHash = await hash(password, 12);
  const users = await User.bulkWrite(
    sampleAccounts.map((account) => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(account.id) },
        update: {
          $setOnInsert: {
            name: account.name,
            email: account.email,
            passwordHash: passwordHash!,
            createdAt: new Date("2010-01-01T00:00:00Z"),
            updatedAt: now,
          },
        },
        upsert: true,
        timestamps: false,
      },
    })),
  );
  let updatedPasswords = 0,
    migratedAccounts = 0;
  for (const [index, account] of sampleAccounts.entries()) {
    const found = existing.get(account.id);
    if (!found) continue;
    const changes: Record<string, unknown> = {};
    if (found.email === account.legacyEmail) changes.email = account.email;
    if (found.name === account.legacyName) changes.name = account.name;
    if (options.syncPasswords && needingPassword[index])
      changes.passwordHash = passwordHash;
    if (!Object.keys(changes).length) continue;
    const result = await User.updateOne(
      { _id: account.id, email: found.email, passwordHash: found.passwordHash },
      { $set: changes },
      { timestamps: false, runValidators: true },
    );
    if (result.modifiedCount) {
      if (changes.passwordHash) updatedPasswords++;
      if (changes.email || changes.name) migratedAccounts++;
    }
  }
  const clubs = await Organization.bulkWrite(
    data.organizations.map((item) => ({
      updateOne: {
        filter: { _id: item._id },
        update: { $setOnInsert: item },
        upsert: true,
        timestamps: false,
      },
    })),
  );
  const memberships = await Membership.bulkWrite<SeedMembership>(
    data.memberships.map((item) => ({
      updateOne: {
        filter: { _id: item._id },
        update: { $setOnInsert: item },
        upsert: true,
        timestamps: false,
      },
    })),
  );
  const events = await Event.bulkWrite<SeedEvent>(
    data.events.map((item) => ({
      updateOne: {
        filter: { _id: item._id },
        update: { $setOnInsert: item },
        upsert: true,
        timestamps: false,
      },
    })),
  );
  // Only exact, known starter labels are migrated. Visitor edits and histories survive.
  for (const [id, oldName, name] of [
    ["c10000000000000000000001", "Demo Running Club", "Riverside Running Club"],
    ["c10000000000000000000002", "Demo Art Club", "Atelier Arts Society"],
  ])
    await Organization.updateOne(
      { _id: id, name: oldName },
      { $set: { name } },
      { timestamps: false },
    );
  for (const [id, oldName, title] of [
    [
      "c30000000000000000000001",
      "Demo community run",
      "Riverside community run",
    ],
    ["c30000000000000000000002", "Demo welcome run", "Riverside welcome run"],
  ])
    await Event.updateOne(
      { _id: id, title: oldName },
      { $set: { title } },
      { timestamps: false },
    );
  await Membership.updateMany(
    { _id: { $in: ["c20000000000000000000001", "c20000000000000000000003"] } },
    { $set: { "payments.$[payment].reference": "RUN-MEMBERSHIP" } },
    {
      arrayFilters: [{ "payment.reference": "FICTIONAL-DEMO" }],
      timestamps: false,
    },
  );
  return {
    createdUsers: users.upsertedCount,
    updatedPasswords,
    migratedAccounts,
    createdClubs: clubs.upsertedCount,
    createdMemberships: memberships.upsertedCount,
    createdEvents: events.upsertedCount,
    anchorAt: state!.anchorAt,
    totals: {
      users: data.accounts.length,
      clubs: data.organizations.length,
      memberships: data.memberships.length,
      events: data.events.length,
      payments:
        (
          await Membership.aggregate([
            { $match: { _id: { $in: data.memberships.map((m) => m._id) } } },
            {
              $group: { _id: null, payments: { $sum: { $size: "$payments" } } },
            },
          ])
        )[0]?.payments ?? 0,
    },
    accounts: sampleAccounts.map(({ email, role }) => ({ email, role })),
  };
}
