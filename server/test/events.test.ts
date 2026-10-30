import request from "supertest";
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { app, origin, signup, createClub, joinClub } from "./setup.js";
import { Membership } from "../src/models/Membership.js";
import { Event } from "../src/models/Event.js";

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
describe("events and registrations", () => {
  it("requires active membership, protects participant identities, and supports cancellation", async () => {
    const f = await eventFixture();
    await f.member
      .post(`${f.path}/registrations/me`)
      .set("Origin", origin)
      .send({})
      .expect(403);
    await f.activateAll();
    await f.member
      .post(`${f.path}/registrations/me`)
      .set("Origin", origin)
      .send({})
      .expect(201);
    await f.member
      .post(`${f.path}/registrations/me`)
      .set("Origin", origin)
      .send({})
      .expect(409);
    const list = await f.member.get(f.base).expect(200);
    expect(list.body.events[0].registration).not.toBeNull();
    expect(JSON.stringify(list.body)).not.toContain("second@example.com");
    await f.member.get(`${f.path}/participants`).expect(403);
    expect(
      (await f.admin.get(`${f.path}/participants`)).body.participants[0].name,
    ).toBe("Jordan Lee");
    await f.member
      .delete(`${f.path}/registrations/me`)
      .set("Origin", origin)
      .send({})
      .expect(200);
    expect((await f.member.get(f.path)).body.event.registrationCount).toBe(0);
  });
  it("atomically assigns the last seat under concurrent registration", async () => {
    const f = await eventFixture();
    await f.activateAll();
    const results = await Promise.all(
      [f.member, f.second].map((agent) =>
        agent.post(`${f.path}/registrations/me`).set("Origin", origin).send({}),
      ),
    );
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    expect((await Event.findById(f.event.id))!.registrations).toHaveLength(1);
  });
  it("validates dates/capacity and keeps event administration and records scoped", async () => {
    const f = await eventFixture();
    await f.member.post(f.base).set("Origin", origin).send(f.input).expect(403);
    await f.admin
      .post(f.base)
      .set("Origin", origin)
      .send({ ...f.input, capacity: 0 })
      .expect(400);
    await f.admin
      .post(f.base)
      .set("Origin", origin)
      .send({ ...f.input, startsAt: new Date(0).toISOString() })
      .expect(400);
    const other = (await createClub(f.admin, "Other club")).body.organization;
    await f.admin
      .get(`/api/organizations/${other.id}/events/${f.event.id}`)
      .expect(404);
    await f.member.get(`/api/organizations/${other.id}/events`).expect(404);
    await f.activateAll();
    await Event.updateOne(
      { _id: f.event.id },
      { $set: { startsAt: new Date(0) } },
    );
    await f.member
      .post(`${f.path}/registrations/me`)
      .set("Origin", origin)
      .send({})
      .expect(409);
    expect((await f.member.get(f.base)).body.events).toHaveLength(0);
    expect((await f.member.get(`${f.base}?view=all`)).body.events).toHaveLength(
      1,
    );
  });
});
