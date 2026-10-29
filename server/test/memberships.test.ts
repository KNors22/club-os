import request from "supertest";
import { describe, expect, it } from "vitest";
import { app, signup, createClub, joinClub } from "./setup.js";
import { User } from "../src/models/User.js";
import { Membership } from "../src/models/Membership.js";
describe("club workflows and tenant isolation", () => {
  it("completes club creation and member joining while hiding the join code from members", async () => {
    const admin = request.agent(app);
    const member = request.agent(app);
    await signup(admin);
    await signup(member, "jordan@example.com", "Jordan Lee");
    const created = await createClub(admin);
    expect(created.status).toBe(201);
    const club = created.body.organization;
    expect(club).toMatchObject({
      role: "admin",
      currency: "CAD",
      feeCents: 2000,
    });
    expect(club.joinCode).toMatch(/^[A-F0-9]{12}$/);
    const joined = await joinClub(member, club.joinCode.toLowerCase()).expect(
      201,
    );
    expect(joined.body.organization.role).toBe("member");
    expect(joined.body.organization).not.toHaveProperty("joinCode");
    const membership = await member
      .get(`/api/organizations/${club.id}/memberships/me`)
      .expect(200);
    expect(membership.body.membership).toMatchObject({
      status: "pending",
      startsAt: null,
      expiresAt: null,
    });
    expect(
      (await member.get(`/api/organizations/${club.id}`)).body.organization,
    ).not.toHaveProperty("joinCode");
    expect(
      (await member.get("/api/organizations")).body.organizations[0],
    ).not.toHaveProperty("joinCode");
    const dashboard = await admin
      .get(`/api/organizations/${club.id}/dashboard`)
      .expect(200);
    expect(dashboard.body.counts).toEqual({
      total: 1,
      active: 0,
      expired: 0,
      pending: 1,
    });
    expect(
      (await admin.get(`/api/organizations/${club.id}/memberships`)).body
        .memberships[0].user.email,
    ).toBe("jordan@example.com");
  });
  it("prevents concurrent duplicate joins and an administrator joining their own club", async () => {
    const admin = request.agent(app),
      member = request.agent(app);
    await signup(admin);
    await signup(member, "jordan@example.com");
    const club = (await createClub(admin)).body.organization;
    await joinClub(admin, club.joinCode).expect(409);
    const results = await Promise.all([
      joinClub(member, club.joinCode),
      joinClub(member, club.joinCode),
    ]);
    expect(results.map((result) => result.status).sort()).toEqual([201, 409]);
    expect(await Membership.countDocuments()).toBe(1);
    await joinClub(member, "000000000000").expect(404);
  });
  it("isolates two organizations and enforces club-scoped administrator access", async () => {
    const adminA = request.agent(app),
      adminB = request.agent(app),
      member = request.agent(app);
    await signup(adminA, "a@example.com");
    await signup(adminB, "b@example.com");
    await signup(member, "member@example.com");
    const clubA = (await createClub(adminA, "Club A")).body.organization;
    const clubB = (await createClub(adminB, "Club B")).body.organization;
    await joinClub(member, clubA.joinCode);
    for (const suffix of [
      "",
      "/dashboard",
      "/memberships",
      "/memberships/me",
    ]) {
      await adminA.get(`/api/organizations/${clubB.id}${suffix}`).expect(404);
      await member.get(`/api/organizations/${clubB.id}${suffix}`).expect(404);
    }
    await member.get(`/api/organizations/${clubA.id}/memberships`).expect(403);
    await member.get(`/api/organizations/${clubA.id}/dashboard`).expect(403);
    expect(
      (await member.get("/api/organizations")).body.organizations.map(
        (club: { id: string }) => club.id,
      ),
    ).toEqual([clubA.id]);
    await joinClub(adminB, clubA.joinCode).expect(201);
    expect(
      (await adminB.get("/api/organizations")).body.organizations,
    ).toHaveLength(2);
    await adminB.get(`/api/organizations/${clubA.id}/dashboard`).expect(403);
    await adminB.get(`/api/organizations/${clubB.id}/dashboard`).expect(200);
  });
  it("searches literal names/emails, filters status, and paginates only the current club", async () => {
    const admin = request.agent(app),
      member = request.agent(app);
    await signup(admin);
    await signup(member, "jordan@example.com", "Jordan Lee");
    const club = (await createClub(admin)).body.organization;
    await joinClub(member, club.joinCode);
    const other = await User.create({
      name: "Taylor Kim",
      email: "taylor@example.com",
      passwordHash: "test-only-not-an-auth-account",
    });
    await Membership.create({
      organizationId: club.id,
      userId: other._id,
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 86400000),
    });
    const base = `/api/organizations/${club.id}/memberships`;
    expect(
      (await admin.get(`${base}?search=JORDAN`)).body.memberships,
    ).toHaveLength(1);
    expect(
      (await admin.get(`${base}?search=.*`)).body.memberships,
    ).toHaveLength(0);
    expect(
      (await admin.get(`${base}?status=pending`)).body.memberships[0].user
        .email,
    ).toBe("jordan@example.com");
    expect(
      (await admin.get(`${base}?status=active`)).body.memberships[0].user.email,
    ).toBe("taylor@example.com");
    const paged = await admin.get(`${base}?limit=1&page=2`).expect(200);
    expect(paged.body.memberships).toHaveLength(1);
    expect(paged.body.pagination).toMatchObject({
      total: 2,
      page: 2,
      pages: 2,
    });
    await admin.get(`${base}?limit=999`).expect(400);
    const dashboard = await admin.get(
      `/api/organizations/${club.id}/dashboard`,
    );
    expect(dashboard.body.counts).toEqual({
      total: 2,
      pending: 1,
      active: 1,
      expired: 0,
    });
  });
});
