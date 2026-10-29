import request from "supertest";
import { describe, expect, it } from "vitest";
import { app, origin, signup, createClub, joinClub } from "./setup.js";
import { Membership } from "../src/models/Membership.js";
describe("club onboarding and isolation", () => {
  it("creates a club and hides its join code from enrolled members", async () => {
    const admin=request.agent(app), member=request.agent(app);
    await signup(admin); await signup(member,"jordan@example.com");
    const club=(await createClub(admin).expect(201)).body.organization;
    expect(club.role).toBe("admin"); expect(club.joinCode).toMatch(/^[A-F0-9]{12}$/);
    const joined=await joinClub(member,club.joinCode.toLowerCase()).expect(201);
    expect(joined.body.organization.role).toBe("member"); expect(joined.body.organization).not.toHaveProperty("joinCode");
    expect((await member.get("/api/organizations")).body.organizations).toHaveLength(1);
    expect((await member.get(`/api/organizations/${club.id}`)).body.organization).not.toHaveProperty("joinCode");
    await admin.post("/api/organizations").set("Origin",origin).send({ name:"Unsafe",feeCents:100,termDays:365,adminUserId:joined.body.organization.id }).expect(400);
  });
  it("prevents duplicate joins including concurrent requests and self-enrollment", async () => {
    const admin=request.agent(app), member=request.agent(app);
    await signup(admin);await signup(member,"jordan@example.com");
    const club=(await createClub(admin)).body.organization;
    await joinClub(admin,club.joinCode).expect(409);
    const results=await Promise.all([joinClub(member,club.joinCode),joinClub(member,club.joinCode)]);
    expect(results.map(r=>r.status).sort()).toEqual([201,409]);expect(await Membership.countDocuments()).toBe(1);
    await joinClub(member,"000000000000").expect(404);
  });
  it("limits club discovery and ownership to the current account", async () => {
    const admin=request.agent(app),other=request.agent(app),member=request.agent(app);
    await signup(admin);await signup(other,"other@example.com");await signup(member,"member@example.com");
    const club=(await createClub(admin)).body.organization;
    const otherClub=(await createClub(other,"Other Club")).body.organization;
    await joinClub(member,club.joinCode).expect(201);
    await member.get(`/api/organizations/${otherClub.id}`).expect(404);
    await admin.get(`/api/organizations/${otherClub.id}`).expect(404);
    await joinClub(other,club.joinCode).expect(201);
    const roles=(await other.get("/api/organizations")).body.organizations;
    expect(roles.find((c:{id:string})=>c.id===club.id).role).toBe("member");
    expect(roles.find((c:{id:string})=>c.id===otherClub.id).role).toBe("admin");
  });
});
