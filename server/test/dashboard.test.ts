import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { origin, createClub } from "./setup.js";
import { eventFixture } from "./event-fixture.js";
import { Organization } from "../src/models/Organization.js";

describe("club workflow dashboard", () => {
  it("summarizes confirmed payments, near-term renewals, registrations, and attendance without crossing clubs", async () => {
    const f = await eventFixture();
    await Organization.updateOne(
      { _id: f.club.id },
      { $set: { termDays: 14 } },
    );
    const payment = {
      requestId: randomUUID(),
      amountCents: 2000,
      method: "cash",
      reference: "",
      paidAt: new Date(Date.now() - 1000).toISOString(),
    };
    const paymentPath = `/api/organizations/${f.club.id}/memberships/${f.members[0].id}/payments`;
    await f.admin
      .post(paymentPath)
      .set("Origin", origin)
      .send(payment)
      .expect(201);
    await f.admin
      .post(paymentPath)
      .set("Origin", origin)
      .send(payment)
      .expect(200);
    await f.member
      .post(`${f.path}/registrations/me`)
      .set("Origin", origin)
      .send({})
      .expect(201);
    await f.admin
      .post(`${f.path}/attendance/${f.members[0].id}`)
      .set("Origin", origin)
      .send({})
      .expect(200);
    const summary = (
      await f.admin.get(`/api/organizations/${f.club.id}/dashboard`).expect(200)
    ).body;
    expect(summary.counts).toEqual({
      total: 2,
      active: 1,
      expired: 0,
      pending: 1,
    });
    expect(summary.payments).toEqual({
      totalCents: 2000,
      transactions: 1,
      awaitingInitialPaymentCents: 2000,
      currency: "CAD",
    });
    expect(summary.renewals).toEqual({ dueSoon: 1, windowDays: 30 });
    expect(summary.events).toEqual({
      total: 1,
      upcoming: 1,
      registrations: 1,
      attendance: 1,
    });
    const other = (await createClub(f.admin, "Other club")).body.organization;
    const empty = (
      await f.admin.get(`/api/organizations/${other.id}/dashboard`)
    ).body;
    expect(empty.payments.totalCents).toBe(0);
    expect(empty.events.registrations).toBe(0);
    expect(empty.counts.total).toBe(0);
    await f.member.get(`/api/organizations/${f.club.id}/dashboard`).expect(403);
  });
});
