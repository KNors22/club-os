import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { OrganizationContext } from "../contexts/clubs-context";
import { CreateEventForm } from "../components/CreateEventForm";
import { EventDetailPage } from "../pages/EventDetailPage";
import type { Organization } from "../types";
const org: Organization = {
  id: "club",
  name: "Running Club",
  description: "",
  role: "member",
  feeCents: 2000,
  currency: "CAD",
  termDays: 365,
};
const event = {
  id: "event",
  title: "Club run",
  description: "An easy run",
  startsAt: new Date(Date.now() + 86400000).toISOString(),
  location: "Campus gate",
  capacity: 2,
  registrationCount: 0,
  attendanceCount: 0,
  registration: null,
};
function detail() {
  render(
    <MemoryRouter initialEntries={["/app/club/events/event"]}>
      <OrganizationContext.Provider value={org}>
        <Routes>
          <Route
            path="/app/:orgId/events/:eventId"
            element={<EventDetailPage />}
          />
        </Routes>
      </OrganizationContext.Provider>
    </MemoryRouter>,
  );
}
describe("event screens", () => {
  it("converts a local event date and numeric capacity into the create request", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ event })));
    vi.stubGlobal("fetch", fetch);
    const created = vi.fn();
    render(
      <OrganizationContext.Provider value={{ ...org, role: "admin" }}>
        <CreateEventForm onCreated={created} onCancel={vi.fn()} />
      </OrganizationContext.Provider>,
    );
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Event title"), "Club run");
    await user.type(screen.getByLabelText("Location"), "Campus gate");
    fireEvent.change(screen.getByLabelText("Capacity"), {
      target: { value: "12" },
    });
    await user.click(screen.getByRole("button", { name: "Create event" }));
    await screen.findByRole("button", { name: "Create event" });
    expect(created).toHaveBeenCalled();
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.capacity).toBe(12);
    expect(body.startsAt).toMatch(/Z$/);
  });
  it("explains why a pending membership cannot register", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockImplementation((path: string) =>
          Promise.resolve(
            new Response(
              JSON.stringify(
                path.endsWith("/memberships/me")
                  ? { membership: { status: "pending" } }
                  : { event },
              ),
            ),
          ),
        ),
    );
    detail();
    expect(
      await screen.findByRole("button", { name: "Register for event" }),
    ).toBeDisabled();
    expect(
      screen.getByText(/An active membership is required/),
    ).toBeInTheDocument();
  });
  it("allows registration followed by cancellation and refreshes the displayed state", async () => {
    let registered = false;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((path: string, options: RequestInit) => {
        if (options?.method === "POST") registered = true;
        if (options?.method === "DELETE") registered = false;
        const data = path.endsWith("/memberships/me")
          ? { membership: { status: "active" } }
          : {
              event: {
                ...event,
                registrationCount: registered ? 1 : 0,
                registration: registered
                  ? {
                      registrationId: "r",
                      registeredAt: new Date().toISOString(),
                      checkedInAt: null,
                    }
                  : null,
              },
            };
        return Promise.resolve(new Response(JSON.stringify(data)));
      }),
    );
    detail();
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", { name: "Register for event" }),
    );
    await user.click(
      await screen.findByRole("button", { name: "Cancel registration" }),
    );
    expect(
      await screen.findByRole("button", { name: "Register for event" }),
    ).toBeEnabled();
  });
});
