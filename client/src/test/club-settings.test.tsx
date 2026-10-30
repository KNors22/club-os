import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import {
  ClubsContext,
  OrganizationContext,
  type ClubsState,
} from "../contexts/clubs-context";
import { ClubSettingsPage } from "../pages/ClubSettingsPage";
import type { Organization } from "../types";
const organization: Organization = {
  id: "club",
  name: "Running Club",
  description: "",
  role: "admin",
  feeCents: 2000,
  currency: "CAD",
  termDays: 365,
};
function setup(role: "admin" | "member" = "admin") {
  const clubs: ClubsState = {
    organizations: [organization],
    selectedOrganization: organization,
    loading: false,
    error: "",
    reload: vi.fn(),
    selectOrganization: vi.fn(),
    updateOrganization: vi.fn(),
  };
  render(
    <MemoryRouter initialEntries={["/app/club/settings"]}>
      <ClubsContext.Provider value={clubs}>
        <OrganizationContext.Provider value={{ ...organization, role }}>
          <Routes>
            <Route path="/app/club/settings" element={<ClubSettingsPage />} />
            <Route path="/app/club" element={<h1>Overview</h1>} />
          </Routes>
        </OrganizationContext.Provider>
      </ClubsContext.Provider>
    </MemoryRouter>,
  );
  return clubs;
}
describe("club fee settings", () => {
  it("saves integer CAD cents with the observed fee and updates shared club state", async () => {
    const updated = { ...organization, feeCents: 2550 };
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ organization: updated })),
      );
    vi.stubGlobal("fetch", fetch);
    const clubs = setup();
    const user = userEvent.setup();
    await user.clear(screen.getByLabelText("Membership fee (CAD)"));
    await user.type(screen.getByLabelText("Membership fee (CAD)"), "25.50");
    await user.click(screen.getByRole("button", { name: "Save fee" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Membership fee updated",
    );
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
      feeCents: 2550,
      expectedFeeCents: 2000,
    });
    expect(clubs.updateOrganization).toHaveBeenCalledWith(updated);
  });
  it("keeps the entered amount on a stale-save conflict and offers refresh", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({
              error: {
                code: "FEE_CHANGED",
                message:
                  "The club fee changed. Refresh the club settings before saving again.",
              },
            }),
            { status: 409 },
          ),
        ),
    );
    const clubs = setup();
    const user = userEvent.setup();
    await user.clear(screen.getByLabelText("Membership fee (CAD)"));
    await user.type(screen.getByLabelText("Membership fee (CAD)"), "30");
    await user.click(screen.getByRole("button", { name: "Save fee" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("fee changed");
    expect(screen.getByLabelText("Membership fee (CAD)")).toHaveValue(30);
    expect(screen.getByRole("button", { name: "Save fee" })).toBeDisabled();
    await user.click(
      screen.getByRole("button", { name: "Refresh club settings" }),
    );
    expect(clubs.reload).toHaveBeenCalledOnce();
  });
  it("redirects members without requesting administrator information", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    setup("member");
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Overview" }),
      ).toBeInTheDocument(),
    );
    expect(fetch).not.toHaveBeenCalled();
  });
});
