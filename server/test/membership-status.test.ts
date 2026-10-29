import { describe, expect, it } from "vitest";
import { membershipStatus } from "../src/services/memberships.js";
describe("membership status boundaries", () => {
  it("distinguishes unpaid, active, and expired memberships at the exact expiration", () => {
    const now = new Date("2026-10-29T12:00:00Z");
    expect(membershipStatus(null, now)).toBe("pending");
    expect(membershipStatus(new Date(now.getTime() + 1), now)).toBe("active");
    expect(membershipStatus(now, now)).toBe("expired");
    expect(membershipStatus(new Date(now.getTime() - 1), now)).toBe("expired");
  });
});
