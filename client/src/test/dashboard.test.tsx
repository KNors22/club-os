import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { OrganizationContext } from "../contexts/clubs-context";
import { OverviewPage } from "../pages/OverviewPage";
describe("workflow dashboard", () => {
  it("displays payment, renewal, and event metrics supplied by the scoped API", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockImplementation((path: string) =>
          Promise.resolve(
            new Response(
              JSON.stringify(
                path.endsWith("/dashboard")
                  ? {
                      counts: { total: 2, active: 1, pending: 1, expired: 0 },
                      payments: {
                        totalCents: 4000,
                        transactions: 2,
                        awaitingInitialPaymentCents: 2000,
                        currency: "CAD",
                      },
                      renewals: { dueSoon: 1, windowDays: 30 },
                      events: {
                        total: 2,
                        upcoming: 1,
                        registrations: 3,
                        attendance: 2,
                      },
                    }
                  : {
                      memberships: [],
                      pagination: { total: 0, page: 1, limit: 5, pages: 0 },
                    },
              ),
            ),
          ),
        ),
    );
    render(
      <MemoryRouter>
        <OrganizationContext.Provider
          value={{
            id: "club",
            name: "Running club",
            description: "",
            role: "admin",
            feeCents: 2000,
            currency: "CAD",
            termDays: 365,
            joinCode: "A1B2C3D4E5F6",
          }}
        >
          <OverviewPage />
        </OrganizationContext.Provider>
      </MemoryRouter>,
    );
    const region = await screen.findByRole("region", {
      name: "Club workflow summaries",
    });
    expect(within(region).getByText("$40.00")).toBeInTheDocument();
    expect(
      within(region).getByText("2 members checked in"),
    ).toBeInTheDocument();
    expect(
      within(region).getByText("Expiring within 30 days"),
    ).toBeInTheDocument();
  });
});
