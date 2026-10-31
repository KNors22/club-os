import { randomUUID } from "node:crypto";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { Membership } from "../src/models/Membership.js";
import { app, createClub, joinClub, origin, signup } from "./setup.js";

async function fixture() {
  const admin = request.agent(app),
    member = request.agent(app);
  await signup(admin, "admin@example.com");
  await signup(member, "member@example.com", "Jordan Lee");
  const club = (await createClub(admin)).body.organization;
  await joinClub(member, club.joinCode).expect(201);
  const membership = (
    await member.get(`/api/organizations/${club.id}/memberships/me`)
  ).body.membership;
  return {
    admin,
    member,
    club,
    membership,
    url: `/api/organizations/${club.id}/memberships/me/card`,
    pay: () =>
      admin
        .post(
          `/api/organizations/${club.id}/memberships/${membership.id}/payments`,
        )
        .set("Origin", origin)
        .send({
          requestId: randomUUID(),
          amountCents: 2000,
          method: "cash",
          reference: "Card test",
          paidAt: new Date().toISOString(),
        })
        .expect(201),
  };
}

describe("membership card snapshots", () => {
  it("requires activation before issuing a card", async () => {
    const { member, url } = await fixture();
    const result = await member.get(url).expect(409);
    expect(result.body.error.code).toBe("CARD_NOT_AVAILABLE");
    expect(result.body).not.toHaveProperty("card");
  });

  it("uses the current profile and renewed dates without exposing private account or payment fields", async () => {
    const { member, url, membership, club, pay } = await fixture();
    await pay();
    const initial = await member.get(url).expect(200);
    expect(initial.headers["cache-control"]).toBe("no-store");
    expect(initial.body.card).toEqual({
      memberName: "Jordan Lee",
      clubName: club.name,
      membershipId: membership.id,
      startsAt: initial.body.membership.startsAt,
      expiresAt: initial.body.membership.expiresAt,
      status: "active",
      issuedAt: expect.any(String),
    });
    await member
      .patch("/api/me")
      .set("Origin", origin)
      .send({ name: "Jordan Rivera" })
      .expect(200);
    await pay();
    const renewed = await member.get(url).expect(200);
    expect(renewed.body.card.memberName).toBe("Jordan Rivera");
    expect(new Date(renewed.body.card.expiresAt).getTime()).toBe(
      new Date(initial.body.card.expiresAt).getTime() + 365 * 86400000,
    );
    expect(renewed.body.membership.payments).toHaveLength(2);
    expect(renewed.body.card.expiresAt).toBe(renewed.body.membership.expiresAt);
    expect(
      new Date(renewed.body.card.issuedAt).getTime(),
    ).toBeGreaterThanOrEqual(new Date(initial.body.card.issuedAt).getTime());
  });

  it("labels expired cards honestly and retains their original validity dates", async () => {
    const { member, url, membership } = await fixture();
    const expiresAt = new Date(Date.now() - 1000);
    const startsAt = new Date(expiresAt.getTime() - 365 * 86400000);
    await Membership.updateOne({ _id: membership.id }, { startsAt, expiresAt });
    const result = await member.get(url).expect(200);
    expect(result.body.card).toMatchObject({
      status: "expired",
      startsAt: startsAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });
    expect(result.body.membership.status).toBe("expired");
  });

  it("requires authentication and restricts cards to the signed-in member in the selected club", async () => {
    const { admin, member, club, url, membership, pay } = await fixture();
    await pay();
    await request(app).get(url).expect(401);
    await admin.get(url).expect(404); // Creating a club does not enroll its administrator.
    const other = request.agent(app);
    await signup(other, "other@example.com");
    const otherClub = (await createClub(other, "Other Club")).body.organization;
    await member
      .get(`/api/organizations/${otherClub.id}/memberships/me/card`)
      .expect(404);
    await other.get(url).expect(404);
    await joinClub(other, club.joinCode).expect(201);
    await other.get(url).expect(409); // Their own unpaid record, never Jordan's paid record.
    await other
      .get(`/api/organizations/${club.id}/memberships/${membership.id}/card`)
      .expect(404);
  });
});
