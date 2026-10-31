import { Membership } from "../models/Membership.js";
import { Event } from "../models/Event.js";
import type { OrganizationDocument } from "../models/Organization.js";
interface Stats {
  total: number;
  active: number;
  expired: number;
  pending: number;
  dueSoon: number;
}
interface PaymentStats {
  totalCents: number;
  transactions: number;
}
interface EventStats {
  total: number;
  upcoming: number;
  registrations: number;
  attendance: number;
}
interface MonthlyValue {
  _id: string;
  value: number;
}
interface UpcomingEvent {
  id: string;
  title: string;
  startsAt: Date;
  location: string;
  capacity: number;
  registrationCount: number;
}
const timeZone = "America/Toronto";
function monthKeys(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")!.value),
    month = Number(parts.find((part) => part.type === "month")!.value);
  const last = year * 12 + month - 1;
  return Array.from({ length: 12 }, (_, index) => {
    const current = last - 11 + index;
    return `${Math.floor(current / 12)}-${String((current % 12) + 1).padStart(2, "0")}`;
  });
}
function monthlyGroup(field: string, amount: string | number = 1) {
  return {
    _id: {
      $dateToString: { format: "%Y-%m", date: field, timezone: timeZone },
    },
    value: { $sum: amount },
  };
}
export async function dashboardSummary(
  organization: OrganizationDocument,
  now = new Date(),
) {
  const upcoming = new Date(now.getTime() + 30 * 86400000);
  const pending = { $eq: [{ $ifNull: ["$expiresAt", null] }, null] };
  const active = { $gt: ["$expiresAt", now] };
  const expired = {
    $and: [
      { $ne: [{ $ifNull: ["$expiresAt", null] }, null] },
      { $lte: ["$expiresAt", now] },
    ],
  };
  const count = (condition: object) => ({ $sum: { $cond: [condition, 1, 0] } });
  const [memberships, events] = await Promise.all([
    Membership.aggregate<{
      stats: Stats[];
      payments: PaymentStats[];
      joins: MonthlyValue[];
      paidHistory: MonthlyValue[];
    }>([
      { $match: { organizationId: organization._id } },
      {
        $facet: {
          stats: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                active: count(active),
                pending: count(pending),
                expired: count(expired),
                dueSoon: count({
                  $and: [active, { $lte: ["$expiresAt", upcoming] }],
                }),
              },
            },
          ],
          payments: [
            { $unwind: "$payments" },
            {
              $group: {
                _id: null,
                totalCents: { $sum: "$payments.amountCents" },
                transactions: { $sum: 1 },
              },
            },
          ],
          joins: [
            { $match: { createdAt: { $lte: now } } },
            { $group: monthlyGroup("$createdAt") },
          ],
          paidHistory: [
            { $unwind: "$payments" },
            { $match: { "payments.paidAt": { $lte: now } } },
            {
              $group: monthlyGroup("$payments.paidAt", "$payments.amountCents"),
            },
          ],
        },
      },
    ]),
    Event.aggregate<{
      stats: EventStats[];
      attendanceHistory: MonthlyValue[];
      upcoming: UpcomingEvent[];
    }>([
      { $match: { organizationId: organization._id } },
      {
        $facet: {
          stats: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                upcoming: count({ $gt: ["$startsAt", now] }),
                registrations: { $sum: { $size: "$registrations" } },
                attendance: {
                  $sum: {
                    $size: {
                      $filter: {
                        input: "$registrations",
                        as: "registration",
                        cond: { $ne: ["$$registration.checkedInAt", null] },
                      },
                    },
                  },
                },
              },
            },
          ],
          attendanceHistory: [
            { $unwind: "$registrations" },
            {
              $match: { "registrations.checkedInAt": { $ne: null, $lte: now } },
            },
            { $group: monthlyGroup("$registrations.checkedInAt") },
          ],
          upcoming: [
            { $match: { startsAt: { $gt: now } } },
            { $sort: { startsAt: 1, _id: 1 } },
            { $limit: 4 },
            {
              $project: {
                _id: 0,
                id: { $toString: "$_id" },
                title: 1,
                startsAt: 1,
                location: 1,
                capacity: 1,
                registrationCount: { $size: "$registrations" },
              },
            },
          ],
        },
      },
    ]),
  ]);
  const stats = memberships[0]?.stats[0] ?? {
    total: 0,
    active: 0,
    expired: 0,
    pending: 0,
    dueSoon: 0,
  };
  const payment = memberships[0]?.payments[0] ?? {
    totalCents: 0,
    transactions: 0,
  };
  const event = events[0]?.stats[0] ?? {
    total: 0,
    upcoming: 0,
    registrations: 0,
    attendance: 0,
  };
  const months = monthKeys(now);
  const joins = new Map(
    (memberships[0]?.joins ?? []).map((row) => [row._id, row.value]),
  );
  const revenue = new Map(
    (memberships[0]?.paidHistory ?? []).map((row) => [row._id, row.value]),
  );
  const attendance = new Map(
    (events[0]?.attendanceHistory ?? []).map((row) => [row._id, row.value]),
  );
  let totalMembers = [...joins]
    .filter(([month]) => month < months[0])
    .reduce((total, [, value]) => total + value, 0);
  const monthly = months.map((month) => {
    const joined = joins.get(month) ?? 0;
    totalMembers += joined;
    return {
      month,
      joins: joined,
      members: totalMembers,
      attendance: attendance.get(month) ?? 0,
      revenueCents: revenue.get(month) ?? 0,
    };
  });
  return {
    counts: {
      total: stats.total,
      active: stats.active,
      expired: stats.expired,
      pending: stats.pending,
    },
    payments: {
      totalCents: payment.totalCents,
      transactions: payment.transactions,
      awaitingInitialPaymentCents: stats.pending * organization.feeCents,
      currency: "CAD",
    },
    renewals: { dueSoon: stats.dueSoon, windowDays: 30 },
    events: {
      total: event.total,
      upcoming: event.upcoming,
      registrations: event.registrations,
      attendance: event.attendance,
    },
    analytics: { timeZone, monthly },
    upcomingEvents: events[0]?.upcoming ?? [],
  };
}
