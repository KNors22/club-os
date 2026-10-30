import { describe, expect, it } from "vitest";
import { origin, createClub } from "./setup.js";
import { Event } from "../src/models/Event.js";
import { eventFixture } from "./event-fixture.js";

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
