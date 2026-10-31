import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MembershipCardPanel } from "../components/MembershipCardPanel";
import {
  downloadMembershipCard,
  membershipCardPng,
} from "../lib/membership-card";
import type { Membership, MembershipCardData } from "../types";

vi.mock("../lib/membership-card", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/membership-card")>()),
  drawMembershipCard: vi.fn(),
  membershipCardPng: vi.fn(),
  downloadMembershipCard: vi.fn(),
}));

const membership: Membership = {
  id: "c20000000000000000000001",
  joinedAt: "2026-10-01T12:00:00Z",
  startsAt: "2026-10-01T12:00:00Z",
  expiresAt: "2027-10-01T12:00:00Z",
  status: "active",
  payments: [],
};
const card: MembershipCardData = {
  memberName: "Jordan Lee",
  clubName: "Campus Running Club",
  membershipId: membership.id,
  startsAt: membership.startsAt,
  expiresAt: "2028-10-01T12:00:00Z",
  status: "active",
  issuedAt: "2026-10-31T15:00:00Z",
};
const renewed = { ...membership, expiresAt: card.expiresAt };
function mount(record = membership) {
  const update = vi.fn();
  const view = render(
    <MembershipCardPanel
      organizationId="club"
      clubName="Campus Running Club"
      memberName="Jordan Lee"
      membership={record}
      onMembershipUpdated={update}
    />,
  );
  return { ...view, update };
}
function reply(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(membershipCardPng).mockResolvedValue(
    new Blob(["png"], { type: "image/png" }),
  );
});

describe("downloadable membership cards", () => {
  it("withholds unpaid cards and explains activation", () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    mount({
      ...membership,
      startsAt: null,
      expiresAt: null,
      status: "pending",
    });
    expect(
      screen.getByRole("button", { name: "Save card (PNG)" }),
    ).toBeDisabled();
    expect(screen.getByText("Available after activation")).toBeVisible();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("fetches current names and renewed dates for each save and refreshes the page's membership", async () => {
    const current = { ...card, memberName: "Jordan Rivera" };
    const fetch = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(reply({ card: current, membership: renewed })),
      );
    vi.stubGlobal("fetch", fetch);
    const { update } = mount();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Save card (PNG)" }));
    await waitFor(() => expect(downloadMembershipCard).toHaveBeenCalledOnce());
    expect(fetch).toHaveBeenCalledWith(
      "/api/organizations/club/memberships/me/card",
      expect.objectContaining({
        credentials: "same-origin",
        signal: expect.any(AbortSignal),
      }),
    );
    expect(membershipCardPng).toHaveBeenCalledWith(current);
    expect(downloadMembershipCard).toHaveBeenCalledWith(
      expect.any(Blob),
      "clubos-campus-running-club-00000001-active.png",
    );
    expect(update).toHaveBeenCalledWith(renewed);
    expect(screen.getByRole("img")).toHaveAccessibleName(/Jordan Rivera.*2028/);
    expect(screen.getByText(/2028/).closest("time")).toHaveAttribute(
      "datetime",
      card.expiresAt,
    );
    await user.click(screen.getByRole("button", { name: "Save card (PNG)" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(downloadMembershipCard).toHaveBeenCalledTimes(2);
  });

  it("clearly identifies expired proof and never labels it active", async () => {
    const expired = {
      ...card,
      expiresAt: "2025-10-01T12:00:00Z",
      status: "expired" as const,
    };
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          reply({ card: expired, membership: { ...membership, ...expired } }),
        ),
    );
    mount({ ...membership, ...expired });
    expect(screen.getByRole("img")).toHaveAccessibleName(/Expired/);
    expect(screen.getByText("Expired membership")).toBeVisible();
    expect(screen.queryByText("Active membership")).not.toBeInTheDocument();
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Save expired card (PNG)" }));
    await waitFor(() =>
      expect(downloadMembershipCard).toHaveBeenCalledWith(
        expect.any(Blob),
        expect.stringMatching(/-expired\.png$/),
      ),
    );
  });

  it("preserves the page on network or image failure and allows retry", async () => {
    const fetch = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("offline"))
      .mockImplementation(() =>
        Promise.resolve(reply({ card, membership: renewed })),
      );
    vi.stubGlobal("fetch", fetch);
    mount();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Save card (PNG)" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /couldn't reach ClubOS/,
    );
    expect(downloadMembershipCard).not.toHaveBeenCalled();
    vi.mocked(membershipCardPng).mockRejectedValueOnce(
      new Error("The card image could not be saved."),
    );
    await user.click(screen.getByRole("button", { name: "Save card (PNG)" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The card image could not be saved.",
    );
    expect(downloadMembershipCard).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Save card (PNG)" }));
    await waitFor(() => expect(downloadMembershipCard).toHaveBeenCalledOnce());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("prevents duplicate clicks and cancels download if the member leaves during preparation", async () => {
    let finish!: (blob: Blob) => void;
    vi.mocked(membershipCardPng).mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const fetch = vi
      .fn()
      .mockResolvedValue(reply({ card, membership: renewed }));
    vi.stubGlobal("fetch", fetch);
    const { unmount } = mount();
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Save card (PNG)" }));
    expect(
      await screen.findByRole("button", { name: "Preparing card…" }),
    ).toBeDisabled();
    expect(fetch).toHaveBeenCalledOnce();
    const signal = fetch.mock.calls[0][1].signal as AbortSignal;
    unmount();
    await act(async () => finish(new Blob(["png"])));
    expect(signal.aborted).toBe(true);
    expect(downloadMembershipCard).not.toHaveBeenCalled();
  });
});
