import { createHash } from "node:crypto";
import { Types } from "mongoose";

export const sampleId = (kind: number, index: number) =>
  new Types.ObjectId(
    `d${kind.toString(16)}${index.toString(16).padStart(22, "0")}`,
  );
const originalId = (kind: number, index: number) =>
  new Types.ObjectId(
    `c${kind.toString(16)}${index.toString(16).padStart(22, "0")}`,
  );
const day = 86400000;
const digest = (value: string) =>
  createHash("sha256").update(`clubos:1.2:${value}`).digest("hex");
function uuid(value: string) {
  const valueHash = digest(value);
  return `${valueHash.slice(0, 8)}-${valueHash.slice(8, 12)}-4${valueHash.slice(13, 16)}-8${valueHash.slice(17, 20)}-${valueHash.slice(20, 32)}`;
}
const people = [
  ["Alex", "Rivera"],
  ["Jordan", "Lee"],
  ["Taylor", "Brooks"],
  ["Casey", "Nguyen"],
  ["Morgan", "Ellis"],
  ["Maya", "Desai"],
  ["Noah", "Bennett"],
  ["Olivia", "Chen"],
  ["Ethan", "Clark"],
  ["Ava", "Thompson"],
  ["Liam", "Martin"],
  ["Sofia", "Ramirez"],
  ["Lucas", "Wilson"],
  ["Amelia", "Scott"],
  ["Elijah", "Brown"],
  ["Isla", "Campbell"],
  ["James", "Park"],
  ["Charlotte", "Lewis"],
  ["Benjamin", "Young"],
  ["Harper", "Adams"],
  ["Henry", "Foster"],
  ["Evelyn", "Moore"],
  ["Jack", "Hughes"],
  ["Aria", "Singh"],
  ["Leo", "Mitchell"],
  ["Abigail", "Wright"],
  ["Daniel", "Kim"],
  ["Ella", "Patel"],
  ["Samuel", "Reed"],
  ["Chloe", "Tran"],
  ["Owen", "Price"],
  ["Grace", "Murphy"],
  ["Mateo", "Silva"],
  ["Lily", "Evans"],
  ["Sebastian", "Roy"],
  ["Zoe", "Anderson"],
  ["Aiden", "Cooper"],
  ["Nora", "Stewart"],
  ["Gabriel", "Moreau"],
  ["Scarlett", "Ross"],
  ["Isaac", "Bell"],
  ["Victoria", "James"],
  ["Julian", "Ortiz"],
  ["Hannah", "Wong"],
  ["Caleb", "Allen"],
  ["Layla", "Lewis"],
  ["Nathan", "Green"],
  ["Audrey", "Hall"],
];
const legacyEmails = [
  "admin@clubos.example",
  "member@clubos.example",
  "pending@clubos.example",
  "expired@clubos.example",
  "other-admin@clubos.example",
];
const legacyNames = [
  "Alex Demo",
  "Jordan Demo",
  "Taylor Demo",
  "Casey Demo",
  "Morgan Demo",
];
export const sampleAccounts = people.map(([first, last], index) => ({
  id: (index < 5
    ? originalId(0, index + 1)
    : sampleId(0, index + 1)
  ).toHexString(),
  name: `${first} ${last}`,
  email: `${first.toLowerCase()}@clubos`,
  role:
    [
      "Running club administrator",
      "Active member",
      "Awaiting payment",
      "Expired membership",
      "Arts club administrator",
      "Outdoor club administrator",
      "Cycling club administrator",
      "Book club administrator",
      "Makers club administrator",
    ][index] ?? "Member with club history",
  ...(index < 5
    ? { legacyEmail: legacyEmails[index], legacyName: legacyNames[index] }
    : {}),
}));
const publicSampleEmails = new Set([
  "alex@clubos",
  "jordan@clubos",
  "taylor@clubos",
  "morgan@clubos",
  "maya@clubos",
  "noah@clubos",
  "olivia@clubos",
  "ethan@clubos",
]);
export const publicSampleAccounts = sampleAccounts.filter((account) =>
  publicSampleEmails.has(account.email),
);
export const sampleClubs = [
  {
    name: "Riverside Running Club",
    admin: 0,
    year: 2010,
    fee: 2000,
    location: "Riverside Park",
    activity: "community run",
    meetup: "Run and coffee",
    next: [
      "Trail discovery run",
      "Riverside community run",
      "Saturday pacing workshop",
      "Sunrise social run",
    ],
  },
  {
    name: "Atelier Arts Society",
    admin: 4,
    year: 2012,
    fee: 1500,
    location: "Community Arts Studio",
    activity: "studio showcase",
    meetup: "Open studio",
    next: [
      "Watercolour workshop",
      "Community sketch walk",
      "Printmaking afternoon",
      "Winter gallery gathering",
    ],
  },
  {
    name: "Summit Outdoor Society",
    admin: 5,
    year: 2011,
    fee: 3000,
    location: "Rouge Valley Trailhead",
    activity: "trail gathering",
    meetup: "Trail skills circle",
    next: [
      "Forest conservation walk",
      "Autumn navigation hike",
      "Outdoor first-aid practice",
      "Winter trail planning",
    ],
  },
  {
    name: "Lakeside Cycling Club",
    admin: 6,
    year: 2013,
    fee: 2500,
    location: "Lakeside Pavilion",
    activity: "community ride",
    meetup: "Ride and repair",
    next: [
      "Lakeshore group ride",
      "Bike maintenance clinic",
      "Hill climbing practice",
      "Winter cycling workshop",
    ],
  },
  {
    name: "Campus Book Collective",
    admin: 7,
    year: 2010,
    fee: 1200,
    location: "Central Library",
    activity: "reading circle",
    meetup: "Readers roundtable",
    next: [
      "Contemporary fiction evening",
      "Poetry and tea",
      "Local author conversation",
      "Winter reading exchange",
    ],
  },
  {
    name: "Community Makers Guild",
    admin: 8,
    year: 2014,
    fee: 3500,
    location: "Innovation Workshop",
    activity: "makers showcase",
    meetup: "Workshop exchange",
    next: [
      "Woodworking fundamentals",
      "Repair cafe",
      "Creative electronics night",
      "Community project showcase",
    ],
  },
].map((club, index) => ({
  ...club,
  id: index < 2 ? originalId(1, index + 1) : sampleId(1, index + 1),
  joinCode: index < 2 ? `C1B0D3A0000${index + 1}` : `D1200000000${index + 1}`,
}));

export interface SeedPayment {
  _id: Types.ObjectId;
  requestId: string;
  amountCents: number;
  method: "cash" | "e-transfer" | "other";
  reference: string;
  paidAt: Date;
  recordedAt: Date;
  recordedBy: Types.ObjectId;
  periodStart: Date;
  periodEnd: Date;
}
export interface SeedMembership {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  startsAt: Date | null;
  expiresAt: Date | null;
  payments: SeedPayment[];
}
export interface SeedEvent {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  createdBy: Types.ObjectId;
  title: string;
  description: string;
  location: string;
  startsAt: Date;
  createdAt: Date;
  updatedAt: Date;
  capacity: number;
  registrations: {
    registrationId: string;
    membershipId: Types.ObjectId;
    registeredAt: Date;
    checkedInAt: Date | null;
  }[];
}

/** Relative scenarios use a persisted anchor; reruns never move their dates. */
export function buildSampleData(anchor: Date) {
  if (!Number.isFinite(anchor.getTime()) || anchor.getUTCFullYear() < 2015)
    throw new Error(
      "The sample dataset requires a valid anchor in 2015 or later.",
    );
  const now = anchor.getTime();
  const memberships: SeedMembership[] = [];
  for (const [clubIndex, club] of sampleClubs.entries()) {
    for (const [personIndex, person] of sampleAccounts.entries()) {
      if (personIndex === club.admin) continue;
      const legacy = clubIndex === 0 && personIndex >= 1 && personIndex <= 3;
      if (!legacy && personIndex !== 1 && (personIndex + clubIndex) % 4 === 0)
        continue;
      const key = (personIndex + clubIndex * 3) % 12;
      const pending = legacy ? personIndex === 2 : key >= 10;
      const expired = legacy ? personIndex === 3 : key === 8 || key === 9;
      let joinedAt: Date;
      if (legacy)
        joinedAt = new Date(
          now - (personIndex === 1 ? 10 : personIndex === 3 ? 400 : 5) * day,
        );
      else if (pending)
        joinedAt = new Date(
          now - (1 + ((personIndex * 11 + clubIndex * 7) % 120)) * day,
        );
      else if (personIndex === 5 && clubIndex === 0)
        joinedAt = new Date("2010-01-15T17:00:00Z");
      else if (personIndex % 7 === 0)
        joinedAt = new Date(
          now - (14 + ((personIndex + clubIndex) % 10) * 28) * day,
        );
      else {
        const year =
          club.year +
          ((personIndex * 3 + clubIndex) %
            (anchor.getUTCFullYear() - club.year + 1));
        joinedAt = new Date(
          Math.min(
            Date.UTC(year, (personIndex + clubIndex) % 12, 15, 17),
            now - 30 * day,
          ),
        );
      }
      if (expired && joinedAt.getTime() > now - 410 * day)
        joinedAt = new Date(now - 410 * day);
      const cycles = pending
        ? 0
        : expired
          ? Math.max(
              1,
              Math.floor((now - joinedAt.getTime() - 35 * day) / (365 * day)),
            )
          : Math.floor((now - joinedAt.getTime()) / (365 * day)) + 1;
      const membershipId = legacy
        ? originalId(2, personIndex)
        : sampleId(2, clubIndex * 100 + personIndex + 1);
      const payments: SeedPayment[] = Array.from(
        { length: cycles },
        (_, index) => {
          const periodStart = new Date(joinedAt.getTime() + index * 365 * day);
          const periodEnd = new Date(periodStart.getTime() + 365 * day);
          const year = periodStart.getUTCFullYear();
          return {
            _id: legacy
              ? originalId(4, personIndex === 1 ? 1 : 2)
              : new Types.ObjectId(
                  digest(`payment:${membershipId}:${index}`).slice(0, 24),
                ),
            requestId: legacy
              ? `10000000-0000-4000-8000-00000000000${personIndex === 1 ? 1 : 2}`
              : uuid(`payment:${membershipId}:${index}`),
            amountCents: Math.round(
              club.fee *
                (year < 2016
                  ? 0.6
                  : year < 2021
                    ? 0.75
                    : year < 2025
                      ? 0.9
                      : 1),
            ),
            method: (["cash", "e-transfer", "other"] as const)[
              (personIndex + index) % 3
            ],
            reference: `MEM-${clubIndex + 1}-${year}-${personIndex + 1}-${index + 1}`,
            paidAt: periodStart,
            recordedAt: periodStart,
            recordedBy: new Types.ObjectId(sampleAccounts[club.admin].id),
            periodStart,
            periodEnd,
          };
        },
      );
      memberships.push({
        _id: membershipId,
        organizationId: club.id,
        userId: new Types.ObjectId(person.id),
        createdAt: joinedAt,
        updatedAt: payments.at(-1)?.recordedAt ?? joinedAt,
        startsAt: pending ? null : joinedAt,
        expiresAt: payments.at(-1)?.periodEnd ?? null,
        payments,
      });
    }
  }
  const events: SeedEvent[] = [];
  function addEvent(
    clubIndex: number,
    id: Types.ObjectId,
    title: string,
    startsAt: Date,
    legacy = false,
  ) {
    const club = sampleClubs[clubIndex];
    const upcoming = startsAt.getTime() > now;
    const registeredAt = upcoming
      ? new Date(now - day)
      : new Date(startsAt.getTime() - (legacy ? 1 : 7) * day);
    const eligible = memberships.filter(
      (m) =>
        m.organizationId.equals(club.id) &&
        m.createdAt <= registeredAt &&
        m.payments.some(
          (p) => p.periodStart <= registeredAt && p.periodEnd > registeredAt,
        ),
    );
    const participants = legacy
      ? eligible.filter((m) => m._id.equals(originalId(2, 1)))
      : eligible
          .filter((_, i) => (i + startsAt.getUTCMonth()) % 3 !== 0)
          .slice(0, 5 + clubIndex);
    events.push({
      _id: id,
      organizationId: club.id,
      createdBy: new Types.ObjectId(sampleAccounts[club.admin].id),
      title,
      description: `Join the ${club.name} community for ${club.activity} activities. All experience levels are welcome.`,
      location: club.location,
      startsAt,
      createdAt: new Date(
        Math.max(
          Date.UTC(club.year, 0, 1),
          Math.min(startsAt.getTime() - 30 * day, now - 2 * day),
        ),
      ),
      updatedAt: upcoming
        ? new Date(now - day)
        : new Date(startsAt.getTime() + participants.length * 60000),
      capacity: legacy ? 10 : 24 + clubIndex * 6,
      registrations: participants.map((m, index) => ({
        registrationId: legacy
          ? `20000000-0000-4000-8000-00000000000${upcoming ? 1 : 2}`
          : uuid(`registration:${id}:${m._id}`),
        membershipId: m._id,
        registeredAt,
        checkedInAt:
          upcoming || index % 5 === 4
            ? null
            : new Date(startsAt.getTime() + index * 60000),
      })),
    });
  }
  for (const [clubIndex, club] of sampleClubs.entries()) {
    for (let year = club.year; year <= anchor.getUTCFullYear(); year++)
      for (let quarter = 0; quarter < 4; quarter++) {
        const date = new Date(Date.UTC(year, quarter * 3, 15, 17));
        if (date.getTime() > now - day) continue;
        addEvent(
          clubIndex,
          sampleId(3, clubIndex * 100000 + year * 10 + quarter),
          `${["Winter", "Spring", "Summer", "Autumn"][quarter]} ${club.activity} ${year}`,
          date,
        );
      }
    for (let month = 0; month < 12; month++) {
      const date = new Date(
        Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() - month, 8, 17),
      );
      if (date.getTime() > now - day) continue;
      const label = new Intl.DateTimeFormat("en-CA", {
        timeZone: "UTC",
        month: "short",
        year: "numeric",
      }).format(date);
      addEvent(
        clubIndex,
        sampleId(
          3,
          1000000 +
            clubIndex * 10000 +
            date.getUTCFullYear() * 12 +
            date.getUTCMonth(),
        ),
        `${club.meetup} · ${label}`,
        date,
      );
    }
    for (let slot = 0; slot < 4; slot++) {
      if (clubIndex === 0 && slot === 0) continue;
      addEvent(
        clubIndex,
        sampleId(3, 2000000 + clubIndex * 10 + slot),
        club.next[slot],
        new Date(now + [7, 14, 28, 42][slot] * day),
      );
    }
  }
  addEvent(
    0,
    originalId(3, 1),
    "Riverside community run",
    new Date(now + 7 * day),
    true,
  );
  addEvent(
    0,
    originalId(3, 2),
    "Riverside welcome run",
    new Date(now - 7 * day),
    true,
  );
  return {
    accounts: sampleAccounts,
    organizations: sampleClubs.map((club) => ({
      _id: club.id,
      name: club.name,
      adminUserId: new Types.ObjectId(sampleAccounts[club.admin].id),
      description: `A welcoming community for ${club.activity} activities, established in ${club.year}.`,
      joinCode: club.joinCode,
      feeCents: club.fee,
      currency: "CAD" as const,
      termDays: 365,
      createdAt: new Date(Date.UTC(club.year, 0, 1)),
      updatedAt: new Date(Date.UTC(club.year, 0, 1)),
    })),
    memberships,
    events,
  };
}
