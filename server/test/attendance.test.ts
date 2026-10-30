import { describe, expect, it } from "vitest";
import { origin, createClub } from "./setup.js";
import { Event } from "../src/models/Event.js";
import { eventFixture } from "./event-fixture.js";
describe("manual attendance", () => {
  it("checks in a registered member once under concurrent retries", async () => {
    const f = await eventFixture();
    await f.activateAll();
    await f.member
      .post(`${f.path}/registrations/me`)
      .set("Origin", origin)
      .send({})
      .expect(201);
    const target = `${f.path}/attendance/${f.members[0].id}`;
    const results = await Promise.all(
      [1, 2, 3].map(() => f.admin.post(target).set("Origin", origin).send({})),
    );
    expect(results.every((r) => r.status === 200)).toBe(true);
    expect(new Set(results.map((r) => r.body.checkedInAt)).size).toBe(1);
    expect(results.filter((r) => !r.body.alreadyCheckedIn)).toHaveLength(1);
    expect((await f.member.get(f.path)).body.event.attendanceCount).toBe(1);
    await f.member
      .delete(`${f.path}/registrations/me`)
      .set("Origin", origin)
      .send({})
      .expect(409);
  });
  it("rejects member writes, nonparticipants, and foreign event IDs", async () => {
    const f = await eventFixture();
    const target = `${f.path}/attendance/${f.members[0].id}`;
    await f.member.post(target).set("Origin", origin).send({}).expect(403);
    await f.admin.post(target).set("Origin", origin).send({}).expect(404);
    const other = (await createClub(f.admin, "Other club")).body.organization;
    await f.admin
      .post(
        `/api/organizations/${other.id}/events/${f.event.id}/attendance/${f.members[0].id}`,
      )
      .set("Origin", origin)
      .send({})
      .expect(404);
  });
  it("keeps attendance consistent when cancellation and check-in race", async () => {
    const f = await eventFixture();
    await f.activateAll();
    await f.member
      .post(`${f.path}/registrations/me`)
      .set("Origin", origin)
      .send({})
      .expect(201);
    const results = await Promise.all([
      f.member
        .delete(`${f.path}/registrations/me`)
        .set("Origin", origin)
        .send({}),
      f.admin
        .post(`${f.path}/attendance/${f.members[0].id}`)
        .set("Origin", origin)
        .send({}),
    ]);
    const event = await Event.findById(f.event.id);
    expect(event!.registrations.length).toBeLessThanOrEqual(1);
    if (event!.registrations.length) {
      expect(event!.registrations[0].checkedInAt).not.toBeNull();
      expect(results.map((r) => r.status)).toEqual([409, 200]);
    } else {
      expect(results.map((r) => r.status)).toEqual([200, 404]);
    }
  });
});
