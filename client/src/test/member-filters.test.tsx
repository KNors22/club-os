import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { OrganizationContext } from "../contexts/clubs-context";
import { MembersPage } from "../pages/MembersPage";

function LocationControls() {
  const location = useLocation(),
    navigate = useNavigate();
  return (
    <>
      <output data-testid="location">{location.search}</output>
      <button onClick={() => navigate(-1)}>Back</button>
    </>
  );
}
function mount(search: string) {
  const fetch = vi
    .fn()
    .mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            memberships: [],
            pagination: { page: 1, pages: 0, total: 0, limit: 20 },
          }),
        ),
      ),
    );
  vi.stubGlobal("fetch", fetch);
  render(
    <MemoryRouter initialEntries={[`/app/club/members${search}`]}>
      <OrganizationContext.Provider
        value={{
          id: "club",
          name: "Riverside",
          description: "",
          role: "admin",
          feeCents: 2000,
          currency: "CAD",
          termDays: 365,
        }}
      >
        <MembersPage />
        <LocationControls />
      </OrganizationContext.Provider>
    </MemoryRouter>,
  );
  return fetch;
}
describe("member list URL filters", () => {
  it("loads shared filters, resets pagination on changes, and restores them on Back", async () => {
    const fetch = mount("?status=active&search=maya&page=2");
    expect(screen.getByLabelText("Status")).toHaveValue("active");
    expect(
      screen.getByLabelText("Search members by name or email"),
    ).toHaveValue("maya");
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching(/search=maya&status=active&page=2/),
        expect.anything(),
      ),
    );
    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText("Status"), "pending");
    expect(screen.getByTestId("location")).toHaveTextContent("status=pending");
    expect(screen.getByTestId("location")).not.toHaveTextContent("page=");
    await waitFor(() =>
      expect(fetch).toHaveBeenLastCalledWith(
        expect.stringMatching(/search=maya&status=pending&page=1/),
        expect.anything(),
      ),
    );
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByLabelText("Status")).toHaveValue("active");
    await waitFor(() =>
      expect(fetch).toHaveBeenLastCalledWith(
        expect.stringMatching(/search=maya&status=active&page=2/),
        expect.anything(),
      ),
    );
  });
  it("falls back safely for unknown status and invalid page values", async () => {
    const fetch = mount("?status=administrator&page=-2");
    expect(screen.getByLabelText("Status")).toHaveValue("all");
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching(/status=all&page=1/),
        expect.anything(),
      ),
    );
    await userEvent
      .setup()
      .selectOptions(screen.getByLabelText("Status"), "active");
    expect(screen.getByTestId("location")).toHaveTextContent("status=active");
    expect(screen.getByTestId("location")).not.toHaveTextContent("page=");
  });
});
