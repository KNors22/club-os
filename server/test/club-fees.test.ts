import request from "supertest";
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { app, origin } from "./setup.js";
import { eventFixture } from "./event-fixture.js";

describe("administrator fee updates", () => {
  it("preserves membership dates and history, rejects stale payments, and permits saved-payment retries after a price change", async () => {
    const f = await eventFixture();
    const path = `/api/organizations/${f.club.id}`;
    const member = f.members[0];
    const paymentPath = `${path}/memberships/${member.id}/payments`;
    const input = {
      requestId: randomUUID(),
      amountCents: 2000,
      method: "cash",
      reference: "ORIGINAL",
      paidAt: new Date(Date.now() - 1000).toISOString(),
    };
    const paid = (
      await f.admin
        .post(paymentPath)
        .set("Origin", origin)
        .send(input)
        .expect(201)
    ).body.membership;
    const updated = await f.admin
      .patch(path)
      .set("Origin", origin)
      .send({ feeCents: 2550, expectedFeeCents: 2000 })
      .expect(200);
    expect(updated.body.organization).toMatchObject({
      feeCents: 2550,
      joinCode: f.club.joinCode,
      termDays: 365,
      role: "admin",
    });
    const replay = await f.admin
      .post(paymentPath)
      .set("Origin", origin)
      .send(input)
      .expect(200);
    expect(replay.body.membership).toEqual(paid);
    await f.admin
      .post(paymentPath)
      .set("Origin", origin)
      .send({ ...input, requestId: randomUUID() })
      .expect(400);
    const renewed = (
      await f.admin
        .post(paymentPath)
        .set("Origin", origin)
        .send({ ...input, requestId: randomUUID(), amountCents: 2550 })
        .expect(201)
    ).body.membership;
    expect(
      renewed.payments.map((p: { amountCents: number }) => p.amountCents),
    ).toEqual([2000, 2550]);
    expect(renewed.startsAt).toBe(paid.startsAt);
    expect(
      new Date(renewed.expiresAt).getTime() -
        new Date(paid.expiresAt).getTime(),
    ).toBe(365 * 86400000);
    expect((await f.member.get(path)).body.organization.feeCents).toBe(2550);
    expect(
      (await f.admin.get(`${path}/dashboard`)).body.payments,
    ).toMatchObject({ totalCents: 4550, awaitingInitialPaymentCents: 2550 });
  });
  it("rejects non-admin, cross-club and unauthenticated updates", async () => {
    const f = await eventFixture();
    const path = `/api/organizations/${f.club.id}`;
    const input = { feeCents: 3000, expectedFeeCents: 2000 };
    await f.member.patch(path).set("Origin", origin).send(input).expect(403);
    const outsider = request.agent(app);
    await outsider
      .post("/api/auth/register")
      .set("Origin", origin)
      .send({
        name: "Other Admin",
        email: "outside@example.com",
        password: "long-demo-password",
      })
      .expect(201);
    await outsider.patch(path).set("Origin", origin).send(input).expect(404);
    await request(app)
      .patch(path)
      .set("Origin", origin)
      .send(input)
      .expect(401);
    expect((await f.admin.get(path)).body.organization.feeCents).toBe(2000);
  });
  it("rejects invalid fields and resolves competing fee updates without losing changes", async () => {
    const f = await eventFixture();
    const path = `/api/organizations/${f.club.id}`;
    for (const body of [
      { feeCents: 0, expectedFeeCents: 2000 },
      { feeCents: 12.5, expectedFeeCents: 2000 },
      { feeCents: 1000001, expectedFeeCents: 2000 },
      { feeCents: 3000 },
      { feeCents: 3000, expectedFeeCents: 2000, adminUserId: "other" },
    ]) {
      await f.admin.patch(path).set("Origin", origin).send(body).expect(400);
    }
    const responses = await Promise.all(
      [2500, 3000].map((feeCents) =>
        f.admin
          .patch(path)
          .set("Origin", origin)
          .send({ feeCents, expectedFeeCents: 2000 }),
      ),
    );
    expect(responses.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(responses.find((r) => r.status === 409)!.body.error.code).toBe(
      "FEE_CHANGED",
    );
  });
});
