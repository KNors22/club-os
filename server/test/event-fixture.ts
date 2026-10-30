import request from "supertest";
import { randomUUID } from "node:crypto";
import { app, origin, signup, createClub, joinClub } from "./setup.js";
import { Membership } from "../src/models/Membership.js";

export async function eventFixture(capacity = 1) {
  const admin = request.agent(app),
    member = request.agent(app),
    second = request.agent(app);
  await signup(admin);
  await signup(member, "member@example.com", "Jordan Lee");
  await signup(second, "second@example.com", "Taylor Kim");
  const club = (await createClub(admin)).body.organization;
  await joinClub(member, club.joinCode);
  await joinClub(second, club.joinCode);
  const members = await Membership.find({ organizationId: club.id }).sort({
    createdAt: 1,
  });
  const base = `/api/organizations/${club.id}/events`;
  const input = {
    title: "Club social run",
    description: "An easy community run.",
    location: "Campus gate",
    startsAt: new Date(Date.now() + 86400000).toISOString(),
    capacity,
  };
  const event = (
    await admin.post(base).set("Origin", origin).send(input).expect(201)
  ).body.event;
  const path = `${base}/${event.id}`;
  async function activateAll() {
    for (const m of members)
      await admin
        .post(`/api/organizations/${club.id}/memberships/${m.id}/payments`)
        .set("Origin", origin)
        .send({
          requestId: randomUUID(),
          amountCents: 2000,
          method: "cash",
          reference: "",
          paidAt: new Date(Date.now() - 1000).toISOString(),
        })
        .expect(201);
  }
  return {
    admin,
    member,
    second,
    club,
    members,
    base,
    input,
    event,
    path,
    activateAll,
  };
}
