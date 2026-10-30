import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OrganizationContext } from "../contexts/clubs-context";
import { PaymentForm } from "../components/PaymentForm";
import { PaymentHistory } from "../components/PaymentHistory";
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
describe("payment screens", () => {
  it("preserves the payment request ID and date across a network retry", async () => {
    const fetch = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("connection lost"))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ replayed: true }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetch);
    const recorded = vi.fn();
    render(
      <OrganizationContext.Provider value={organization}>
        <PaymentForm
          membership={{
            id: "member",
            joinedAt: "2026-10-01",
            startsAt: null,
            expiresAt: null,
            status: "pending",
          }}
          onRecorded={recorded}
        />
      </OrganizationContext.Provider>,
    );
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Transaction reference"), "BANK-123");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Record payment" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "couldn’t reach",
    );
    await user.click(screen.getByRole("button", { name: "Record payment" }));
    await waitFor(() => expect(recorded).toHaveBeenCalledOnce());
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual(
      JSON.parse(fetch.mock.calls[1][1].body),
    );
    expect(JSON.parse(fetch.mock.calls[0][1].body).amountCents).toBe(2000);
  });
  it("shows the empty history without suggesting a completed payment", () => {
    render(<PaymentHistory />);
    expect(
      screen.getByText("No payments have been recorded yet."),
    ).toBeInTheDocument();
  });
});
