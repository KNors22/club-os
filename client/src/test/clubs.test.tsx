import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AuthContext, type AuthState } from "../contexts/auth-context";
import { ClubsContext, type ClubsState } from "../contexts/clubs-context";
import { ClubsPage } from "../pages/ClubsPage";

function renderClubs() {
  const auth: AuthState = {
    user: { id: "admin", name: "Alex Morgan", email: "alex@example.com" },
    loading: false,
    error: "",
    retry: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
  };
  const clubs: ClubsState = {
    organizations: [],
    selectedOrganization: null,
    loading: false,
    error: "",
    reload: vi.fn(),
    updateOrganization: vi.fn(),
    selectOrganization: vi.fn(),
  };
  render(
    <MemoryRouter initialEntries={["/clubs"]}>
      <AuthContext.Provider value={auth}>
        <ClubsContext.Provider value={clubs}>
          <Routes>
            <Route path="/clubs" element={<ClubsPage />} />
            <Route path="/app/:orgId" element={<h1>Club workspace</h1>} />
          </Routes>
        </ClubsContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>,
  );
  return clubs;
}

describe("club onboarding forms", () => {
  it("creates a club using integer cents and selects the new workspace", async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ organization: { id: "new-club" } }), {
        status: 201,
      }),
    );
    vi.stubGlobal("fetch", fetch);
    const clubs = renderClubs();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Club name"), "Campus Running Club");
    await user.clear(screen.getByLabelText("Membership fee (CAD)"));
    await user.type(screen.getByLabelText("Membership fee (CAD)"), "12.50");
    await user.click(screen.getByRole("button", { name: "Create club" }));
    expect(
      await screen.findByRole("heading", { name: "Club workspace" }),
    ).toBeInTheDocument();
    expect(fetch.mock.calls[0][0]).toBe("/api/organizations");
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toMatchObject({
      name: "Campus Running Club",
      feeCents: 1250,
      termDays: 365,
    });
    expect(clubs.selectOrganization).toHaveBeenCalledWith("new-club");
    expect(clubs.reload).toHaveBeenCalledOnce();
  });
  it("keeps the join code after a conflict and permits retrying", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: {
              code: "ALREADY_MEMBER",
              message: "You have already joined this club.",
            },
          }),
          { status: 409 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ organization: { id: "joined-club" } }), {
          status: 201,
        }),
      );
    vi.stubGlobal("fetch", fetch);
    const clubs = renderClubs();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Club join code"), "A1B2C3D4E5F6");
    await user.click(screen.getByRole("button", { name: "Join a club" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "You have already joined this club.",
    );
    expect(screen.getByLabelText("Club join code")).toHaveValue("A1B2C3D4E5F6");
    await user.click(screen.getByRole("button", { name: "Join a club" }));
    expect(
      await screen.findByRole("heading", { name: "Club workspace" }),
    ).toBeInTheDocument();
    expect(clubs.selectOrganization).toHaveBeenCalledWith("joined-club");
  });
});
