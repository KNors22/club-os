import request from "supertest";
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { app, origin, signup, createClub, joinClub } from "./setup.js";
import { Membership } from "../src/models/Membership.js";

async function fixture() {
  const admin = request.agent(app),
    member = request.agent(app),
    outsider = request.agent(app);
  await signup(admin);
  await signup(member, "member@example.com");
  await signup(outsider, "outsider@example.com");
  const club = (await createClub(admin)).body.organization;
  await joinClub(member, club.joinCode);
  const membership = await Membership.findOne({ organizationId: club.id });
  const path = `/api/organizations/${club.id}/memberships/${membership!.id}`;
  const input = {
    requestId: randomUUID(),
    amountCents: 2000,
    method: "e-transfer",
    reference: "BANK-123",
    paidAt: new Date(Date.now() - 1000).toISOString(),
  };
  return {
    admin,
    member,
    outsider,
    club,
    membership: membership!,
    path,
    input,
  };
}
describe("membership payments", () => {
  it("activates a membership, exposes own history, and extends an early renewal without losing remaining days", async () => {
    const { admin, member, path, input, club } = await fixture();
    const first = await admin
      .post(`${path}/payments`)
      .set("Origin", origin)
      .send(input)
      .expect(201);
    expect(first.body.membership.status).toBe("active");
    const expiry = first.body.membership.expiresAt;
    const renewed = await admin
      .post(`${path}/payments`)
      .set("Origin", origin)
      .send({ ...input, requestId: randomUUID(), reference: "BANK-456" })
      .expect(201);
    expect(
      new Date(renewed.body.membership.expiresAt).getTime() -
        new Date(expiry).getTime(),
    ).toBe(365 * 86400000);
    expect(renewed.body.membership.startsAt).toBe(
      first.body.membership.startsAt,
    );
    expect(renewed.body.membership.payments[1].periodStart).toBe(expiry);
    const own = await member
      .get(`/api/organizations/${club.id}/memberships/me`)
      .expect(200);
    expect(own.body.membership.payments).toHaveLength(2);
    expect((await admin.get(path)).body.user.email).toBe("member@example.com");
  });
  it("renews an expired member from now and keeps legacy memberships readable", async () => {
    const { admin, path, input, membership } = await fixture();
    await Membership.updateOne(
      { _id: membership._id },
      {
        $set: {
          expiresAt: new Date(Date.now() - 86400000),
          startsAt: new Date(Date.now() - 400 * 86400000),
        },
      },
    );
    const before = Date.now();
    const renewed = await admin
      .post(`${path}/payments`)
      .set("Origin", origin)
      .send(input)
      .expect(201);
    expect(
      new Date(renewed.body.membership.startsAt).getTime(),
    ).toBeGreaterThanOrEqual(before);
    expect(
      new Date(renewed.body.membership.expiresAt).getTime(),
    ).toBeGreaterThanOrEqual(before + 365 * 86400000);
  });
  it("handles repeated and concurrent identical requests without charging another term", async () => {
    const { admin, path, input } = await fixture();
    const results = await Promise.all(
      [1, 2, 3].map(() =>
        admin.post(`${path}/payments`).set("Origin", origin).send(input),
      ),
    );
    expect(results.map((result) => result.status).sort()).toEqual([
      200, 200, 201,
    ]);
    const stored = (await admin.get(path)).body.membership;
    expect(stored.payments).toHaveLength(1);
    await admin
      .post(`${path}/payments`)
      .set("Origin", origin)
      .send({ ...input, reference: "DIFFERENT" })
      .expect(409);
  });
  it("rejects partial amounts, future dates, non-admin writes, and cross-club membership IDs", async () => {
    const { admin, member, outsider, path, input, membership } =
      await fixture();
    await admin
      .post(`${path}/payments`)
      .set("Origin", origin)
      .send({ ...input, amountCents: 1000 })
      .expect(400);
    await admin
      .post(`${path}/payments`)
      .set("Origin", origin)
      .send({ ...input, paidAt: new Date(Date.now() + 86400000).toISOString() })
      .expect(400);
    await member
      .post(`${path}/payments`)
      .set("Origin", origin)
      .send(input)
      .expect(403);
    await outsider.get(path).expect(404);
    const otherClub = (await createClub(admin, "Other Club")).body.organization;
    await admin
      .post(
        `/api/organizations/${otherClub.id}/memberships/${membership.id}/payments`,
      )
      .set("Origin", origin)
      .send(input)
      .expect(404);
    expect((await Membership.findById(membership._id))!.payments).toHaveLength(
      0,
    );
  });
});
