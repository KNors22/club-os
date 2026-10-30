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
export async function dashboardSummary(organization: OrganizationDocument) {
  const now = new Date(),
    upcoming = new Date(now.getTime() + 30 * 86400000);
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
    Membership.aggregate<{ stats: Stats[]; payments: PaymentStats[] }>([
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
        },
      },
    ]),
    Event.aggregate<EventStats>([
      { $match: { organizationId: organization._id } },
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
  const event = events[0] ?? {
    total: 0,
    upcoming: 0,
    registrations: 0,
    attendance: 0,
  };
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
  };
}
