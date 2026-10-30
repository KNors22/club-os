import { hash } from "bcryptjs";
import { Types } from "mongoose";
import { User } from "../models/User.js";
import { Organization } from "../models/Organization.js";
import { Membership } from "../models/Membership.js";
import { Event } from "../models/Event.js";
import { registerSchema } from "../validation.js";

export const demoAccounts = [
  {
    id: "c00000000000000000000001",
    email: "admin@clubos.example",
    name: "Alex Demo",
    role: "Running club administrator",
  },
  {
    id: "c00000000000000000000002",
    email: "member@clubos.example",
    name: "Jordan Demo",
    role: "Active member",
  },
  {
    id: "c00000000000000000000003",
    email: "pending@clubos.example",
    name: "Taylor Demo",
    role: "Awaiting payment",
  },
  {
    id: "c00000000000000000000004",
    email: "expired@clubos.example",
    name: "Casey Demo",
    role: "Expired membership",
  },
  {
    id: "c00000000000000000000005",
    email: "other-admin@clubos.example",
    name: "Morgan Demo",
    role: "Separate club administrator",
  },
] as const;
export function validateDemoDatabase(uri: string) {
  let url: URL;
  try {
    url = new URL(uri);
  } catch {
    throw new Error(
      "Use a MongoDB URI selecting the dedicated clubos_demo database.",
    );
  }
  if (
    !["mongodb:", "mongodb+srv:"].includes(url.protocol) ||
    url.pathname !== "/clubos_demo"
  )
    throw new Error("Demo data must use the dedicated clubos_demo database.");
  return uri;
}
const oid = (id: string) => new Types.ObjectId(id);
const day = 86400000;
export async function seedDemoData(password: string, now = new Date()) {
  registerSchema.shape.password.parse(password);
  // Reserved addresses cannot be used to take over an unrelated existing account.
  for (const account of demoAccounts) {
    const existing = await User.findOne({
      $or: [{ _id: account.id }, { email: account.email }],
    }).select("_id email");
    if (
      existing &&
      (existing.id !== account.id || existing.email !== account.email)
    )
      throw new Error(
        "A reserved demo account conflicts with an existing account. No existing credentials were changed.",
      );
  }
  const passwordHash = await hash(password, 12);
  let createdUsers = 0;
  for (const account of demoAccounts) {
    const result = await User.updateOne(
      { _id: account.id },
      {
        $setOnInsert: {
          name: account.name,
          email: account.email,
          passwordHash,
        },
      },
      { upsert: true, runValidators: true },
    );
    createdUsers += result.upsertedCount;
  }
  const clubId = oid("c10000000000000000000001");
  await Organization.updateOne(
    { _id: clubId },
    {
      $setOnInsert: {
        name: "Demo Running Club",
        description: "Fictional records for the capstone walkthrough.",
        adminUserId: oid(demoAccounts[0].id),
        joinCode: "C1B0D3A00001",
        feeCents: 2000,
        currency: "CAD",
        termDays: 365,
      },
    },
    { upsert: true, runValidators: true },
  );
  await Organization.updateOne(
    { _id: oid("c10000000000000000000002") },
    {
      $setOnInsert: {
        name: "Demo Art Club",
        description: "Separate fictional organization for access checks.",
        adminUserId: oid(demoAccounts[4].id),
        joinCode: "C1B0D3A00002",
        feeCents: 1500,
        currency: "CAD",
        termDays: 365,
      },
    },
    { upsert: true, runValidators: true },
  );
  const memberIds = [
    "c20000000000000000000001",
    "c20000000000000000000002",
    "c20000000000000000000003",
  ];
  for (let index = 0; index < 3; index++) {
    const pending = index === 1;
    const startsAt = pending
      ? null
      : new Date(now.getTime() - (index === 0 ? 10 : 400) * day);
    const expiresAt = pending
      ? null
      : new Date(startsAt!.getTime() + 365 * day);
    const payments = pending
      ? []
      : [
          {
            _id: oid(
              index === 0
                ? "c40000000000000000000001"
                : "c40000000000000000000002",
            ),
            requestId:
              index === 0
                ? "10000000-0000-4000-8000-000000000001"
                : "10000000-0000-4000-8000-000000000002",
            amountCents: 2000,
            method: "cash",
            reference: "FICTIONAL-DEMO",
            paidAt: startsAt,
            recordedAt: startsAt,
            recordedBy: oid(demoAccounts[0].id),
            periodStart: startsAt,
            periodEnd: expiresAt,
          },
        ];
    await Membership.updateOne(
      { _id: oid(memberIds[index]) },
      {
        $setOnInsert: {
          organizationId: clubId,
          userId: oid(demoAccounts[index + 1].id),
          startsAt,
          expiresAt,
          payments,
        },
      },
      { upsert: true, runValidators: true },
    );
  }
  for (const upcoming of [true, false]) {
    const startsAt = new Date(now.getTime() + (upcoming ? 7 : -7) * day);
    await Event.updateOne(
      {
        _id: oid(
          upcoming ? "c30000000000000000000001" : "c30000000000000000000002",
        ),
      },
      {
        $setOnInsert: {
          organizationId: clubId,
          createdBy: oid(demoAccounts[0].id),
          title: upcoming ? "Demo community run" : "Demo welcome run",
          description:
            "Fictional event; create a new event if this date has passed.",
          location: "Fictional campus meeting point",
          startsAt,
          capacity: 10,
          registrations: [
            {
              registrationId: upcoming
                ? "20000000-0000-4000-8000-000000000001"
                : "20000000-0000-4000-8000-000000000002",
              membershipId: oid(memberIds[0]),
              registeredAt: new Date(startsAt.getTime() - day),
              checkedInAt: upcoming ? null : startsAt,
            },
          ],
        },
      },
      { upsert: true, runValidators: true },
    );
  }
  return {
    createdUsers,
    accounts: demoAccounts.map(({ email, role }) => ({ email, role })),
  };
}
