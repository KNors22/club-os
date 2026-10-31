import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { config, store, origin } from "./setup.js";
import { eventFixture } from "./event-fixture.js";
import { Membership } from "../src/models/Membership.js";
import { Event } from "../src/models/Event.js";
import { parseConfig } from "../src/config.js";
import { sendConfirmation } from "../src/services/notifications.js";
const email = {
  apiKey: "re_test_only",
  demoTo: "owner@example.com",
  from: "onboarding@resend.dev",
};
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
describe("confirmation delivery", () => {
  it("persists records before sending and overrides recipients with the demo inbox", async () => {
    const observed: boolean[] = [];
    const fetch = vi
      .fn()
      .mockImplementation(async (_url: string, options: RequestInit) => {
        const headers = options.headers as Record<string, string>;
        const key = headers["Idempotency-Key"];
        const id = key.split("/")[1];
        observed.push(
          Boolean(
            key.startsWith("membership-payment/")
              ? await Membership.exists({ "payments._id": id })
              : await Event.exists({ "registrations.registrationId": id }),
          ),
        );
        return new Response(JSON.stringify({ id: "email-receipt" }));
      });
    vi.stubGlobal("fetch", fetch);
    const application = createApp({ ...config, email }, store);
    const f = await eventFixture(1, application);
    await f.activateAll();
    const registered = await f.member
      .post(`${f.path}/registrations/me`)
      .set("Origin", origin)
      .send({})
      .expect(201);
    expect(registered.body.notification.status).toBe("sent");
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(observed).toEqual([true, true, true]);
    for (const call of fetch.mock.calls) {
      const body = JSON.parse(call[1].body);
      expect(body.to).toEqual(["owner@example.com"]);
      expect(call[0]).toBe("https://api.resend.com/emails");
    }
    const stored = await Membership.findById(f.members[0].id);
    const payment = stored!.payments[0];
    const replay = await f.admin
      .post(
        `/api/organizations/${f.club.id}/memberships/${stored!.id}/payments`,
      )
      .set("Origin", origin)
      .send({
        requestId: payment.requestId,
        amountCents: payment.amountCents,
        method: payment.method,
        reference: payment.reference,
        paidAt: payment.paidAt.toISOString(),
      })
      .expect(200);
    expect(replay.body.notification.status).toBe("skipped");
    expect(fetch).toHaveBeenCalledTimes(3);
    const publicConfig = await request(application)
      .get("/api/config")
      .expect(200);
    expect(publicConfig.body).toEqual({ notifications: { mode: "demo" } });
  });
  it("returns a delivery notice without losing payments or registrations when the provider fails", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockImplementation(() =>
          Promise.resolve(new Response("unavailable", { status: 503 })),
        ),
    );
    const f = await eventFixture(1, createApp({ ...config, email }, store));
    await f.activateAll();
    const registered = await f.member
      .post(`${f.path}/registrations/me`)
      .set("Origin", origin)
      .send({})
      .expect(201);
    expect(registered.body.notification.status).toBe("failed");
    expect(registered.body.event.registration).not.toBeNull();
    expect((await Membership.findById(f.members[0].id))!.payments).toHaveLength(
      1,
    );
    expect((await Event.findById(f.event.id))!.registrations).toHaveLength(1);
  });
  it("bounds transport time and returns a failure result on abort", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(
        (_url: string, options: RequestInit) =>
          new Promise((_resolve, reject) => {
            options.signal!.addEventListener(
              "abort",
              () => reject(new DOMException("timeout", "TimeoutError")),
              { once: true },
            );
          }),
      ),
    );
    const result = await sendConfirmation(
      { ...email, timeoutMs: 20 },
      { key: "test", subject: "Test", text: "Demo" },
    );
    expect(result.status).toBe("failed");
  });
  it("does not call the provider when delivery is unconfigured", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    expect(
      (
        await sendConfirmation(undefined, {
          key: "test",
          subject: "Test",
          text: "Demo",
        })
      ).status,
    ).toBe("disabled");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("requires paired sender credentials and a demo inbox at startup", () => {
    const environment = {
      NODE_ENV: "test",
      MONGODB_URI: "mongodb://127.0.0.1:27017/clubos_test",
      SESSION_SECRET: "test-session-secret-at-least-32-characters-long",
      APP_URL: "http://localhost:5173",
      PORT: "3000",
      DEMO_MODE: "false",
      EMAIL_FROM: "onboarding@resend.dev",
      RESEND_API_KEY: "re_test_only",
    };
    expect(() => parseConfig(environment)).toThrow(/EMAIL_DEMO_TO/);
    expect(
      parseConfig({ ...environment, EMAIL_DEMO_TO: "owner@example.com" }).email
        ?.demoTo,
    ).toBe("owner@example.com");
  });
});
