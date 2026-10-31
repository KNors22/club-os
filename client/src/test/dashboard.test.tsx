import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { OrganizationContext } from "../contexts/clubs-context";
import { OverviewPage } from "../pages/OverviewPage";
import { DashboardCharts } from "../components/DashboardCharts";
import type { DashboardData } from "../types";
function data(): DashboardData {
  return {
    counts: { total: 2, active: 1, pending: 1, expired: 0 },
    payments: {
      totalCents: 4000,
      transactions: 2,
      awaitingInitialPaymentCents: 2000,
      currency: "CAD",
    },
    renewals: { dueSoon: 1, windowDays: 30 },
    events: { total: 2, upcoming: 1, registrations: 3, attendance: 2 },
    analytics: {
      timeZone: "America/Toronto",
      monthly: Array.from({ length: 12 }, (_, index) => ({
        month: `2026-${String(index + 1).padStart(2, "0")}`,
        joins: index === 9 ? 1 : 0,
        members: index < 9 ? 1 : 2,
        attendance: index === 9 ? 2 : 0,
        revenueCents: index === 9 ? 4000 : 0,
      })),
    },
    upcomingEvents: [
      {
        id: "event",
        title: "Campus run",
        startsAt: "2027-01-01T12:00:00Z",
        location: "Campus gate",
        capacity: 10,
        registrationCount: 3,
      },
    ],
  };
}
describe("club insights dashboard", () => {
  it("displays scoped summaries, current status, and upcoming capacity from the API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((path: string) =>
        Promise.resolve(
          new Response(
            JSON.stringify(
              path.endsWith("/dashboard")
                ? data()
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
      screen.getByRole("meter", { name: "Active membership share" }),
    ).toHaveAttribute("aria-valuenow", "50");
    const status = screen.getByRole("region", { name: "Membership status" });
    expect(within(status).getByRole("img")).toHaveAccessibleName(
      "2 members: 1 active, 1 awaiting payment, 0 expired",
    );
    expect(
      within(status).getByText(/active membership expires/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", {
        name: "Campus run registration capacity",
      }),
    ).toHaveAttribute("aria-valuenow", "3");
    expect(screen.getByRole("link", { name: "Campus run" })).toHaveAttribute(
      "href",
      "/app/club/events/event",
    );
    expect(
      within(region).getByRole("link", { name: "Total members" }),
    ).toHaveAttribute("href", "/app/club/members");
    expect(
      within(region).getByRole("link", { name: "Active members" }),
    ).toHaveAttribute("href", "/app/club/members?status=active");
    expect(
      within(region).getByRole("link", { name: "Upcoming events" }),
    ).toHaveAttribute("href", "/app/club/events");
    const insights = screen.getByRole("region", { name: "Club insights" });
    const scroll = vi.fn();
    Object.defineProperty(insights, "scrollIntoView", { value: scroll });
    const user = userEvent.setup();
    const payments = within(region).getByRole("button", {
      name: "Payments received",
    });
    await user.click(payments);
    expect(
      screen.getByRole("combobox", { name: "Activity metric" }),
    ).toHaveValue("revenueCents");
    expect(insights).toHaveFocus();
    expect(scroll).toHaveBeenCalledWith(
      expect.objectContaining({ block: "start" }),
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Activity metric" }),
      "attendance",
    );
    payments.focus();
    await user.keyboard("{Enter}");
    expect(
      screen.getByRole("combobox", { name: "Activity metric" }),
    ).toHaveValue("revenueCents");
    expect(scroll).toHaveBeenCalledTimes(2);
  });
  it("switches real activity metrics and periods and provides a readable table", async () => {
    render(
      <MemoryRouter>
        <DashboardCharts data={data()} organizationId="club" />
      </MemoryRouter>,
    );
    const user = userEvent.setup();
    const activity = screen.getByRole("region", { name: "Monthly activity" });
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Activity metric" }),
      "revenueCents",
    );
    expect(
      within(activity).getByRole("heading", { name: "Payments received" }),
    ).toBeInTheDocument();
    await user.click(within(activity).getByText("View chart data"));
    expect(within(activity).getByRole("table")).toHaveTextContent("$40.00");
    expect(within(activity).getAllByRole("row")).toHaveLength(7);
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Chart period" }),
      "12",
    );
    await user.click(within(activity).getByText("View chart data"));
    expect(within(activity).getAllByRole("row")).toHaveLength(13);
    const point = within(activity).getByRole("img", {
      name: "October 2026: $40.00 CAD",
    });
    await user.hover(point);
    expect(
      within(activity).getByText("October 2026", {
        selector: ".chart-readout strong",
      }),
    ).toBeInTheDocument();
  });
  it("keeps zero-data charts finite and offers useful empty states", () => {
    const empty = data();
    empty.counts = { total: 0, active: 0, pending: 0, expired: 0 };
    empty.renewals.dueSoon = 0;
    empty.analytics.monthly = empty.analytics.monthly.map((row) => ({
      ...row,
      joins: 0,
      members: 0,
      attendance: 0,
      revenueCents: 0,
    }));
    empty.upcomingEvents = [];
    const { container } = render(
      <MemoryRouter>
        <DashboardCharts data={empty} organizationId="club" />
      </MemoryRouter>,
    );
    expect(
      screen.getByText("No check-ins recorded in this period."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Your next gathering starts here."),
    ).toBeInTheDocument();
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
  });
});
