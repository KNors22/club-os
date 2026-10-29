import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AuthContext, type AuthState } from "../contexts/auth-context";
import {
  ClubsContext,
  OrganizationContext,
  type ClubsState,
} from "../contexts/clubs-context";
import { MembershipPage } from "../pages/MembershipPage";
import { App } from "../App";
import type { Organization } from "../types";

const organization: Organization = {
  id: "507f1f77bcf86cd799439011",
  name: "Campus Running Club",
  description: "",
  feeCents: 2000,
  currency: "CAD",
  termDays: 365,
  role: "member",
};
function auth(overrides: Partial<AuthState> = {}): AuthState {
  return {
    user: null,
    loading: false,
    error: "",
    retry: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
    ...overrides,
  };
}
function clubs(): ClubsState {
  return {
    organizations: [organization],
    selectedOrganization: organization,
    loading: false,
    error: "",
    reload: vi.fn(),
    selectOrganization: vi.fn(),
  };
}

describe("member experience", () => {
  it("shows a real pending membership with contact guidance and no administrator controls", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({
              membership: {
                id: "membership",
                joinedAt: "2026-10-29T12:00:00Z",
                startsAt: null,
                expiresAt: null,
                status: "pending",
              },
            }),
            { headers: { "Content-Type": "application/json" } },
          ),
        ),
    );
    render(
      <MemoryRouter>
        <AuthContext.Provider
          value={auth({
            user: {
              id: "member",
              name: "Jordan Lee",
              email: "jordan@example.com",
            },
          })}
        >
          <OrganizationContext.Provider value={organization}>
            <MembershipPage />
          </OrganizationContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>,
    );
    expect(await screen.findByText("Awaiting payment")).toBeInTheDocument();
    expect(
      screen.getByText(/contact your club administrator/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /record payment/i }),
    ).not.toBeInTheDocument();
  });
  it("redirects anonymous visitors to sign in", async () => {
    render(
      <MemoryRouter initialEntries={["/clubs"]}>
        <AuthContext.Provider value={auth()}>
          <ClubsContext.Provider value={clubs()}>
            <App />
          </ClubsContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole("button", { name: /sign in to clubos/i }),
    ).toBeInTheDocument();
  });
  it("does not expose another organization through a guessed client-side URL", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    render(
      <MemoryRouter initialEntries={["/app/another-club/members"]}>
        <AuthContext.Provider
          value={auth({
            user: {
              id: "member",
              name: "Jordan Lee",
              email: "jordan@example.com",
            },
          })}
        >
          <ClubsContext.Provider value={clubs()}>
            <App />
          </ClubsContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>,
    );
    expect(
      await screen.findByText("This club isn’t available."),
    ).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });
  it("offers retry when session lookup fails instead of presenting a logged-out screen", async () => {
    const retry = vi.fn();
    render(
      <MemoryRouter>
        <AuthContext.Provider
          value={auth({ error: "We couldn’t reach ClubOS.", retry })}
        >
          <App />
        </AuthContext.Provider>
      </MemoryRouter>,
    );
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(retry).toHaveBeenCalledOnce());
    expect(
      screen.queryByRole("button", { name: /sign in to clubos/i }),
    ).not.toBeInTheDocument();
  });
});
