import { useState, type FormEvent } from "react";
import { useOrganization } from "../contexts/clubs-context";
import { api, errorMessage } from "../lib/api";
import { money } from "../lib/format";
import { Button, Field, Notice } from "./ui";
import type { Membership, NotificationResult } from "../types";

export function PaymentForm({
  membership,
  onRecorded,
}: {
  membership: Membership;
  onRecorded: (notification?: NotificationResult) => void;
}) {
  const organization = useOrganization();
  const [requestId] = useState(() => crypto.randomUUID());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const now = new Date();
  const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const input = {
      requestId,
      amountCents: organization.feeCents,
      method: String(form.get("method")),
      reference: String(form.get("reference")).trim(),
      paidAt: new Date(`${form.get("paidAt")}T00:00:00`).toISOString(),
    };
    try {
      const result = await api<{ notification?: NotificationResult }>(
        `/organizations/${organization.id}/memberships/${membership.id}/payments`,
        { method: "POST", body: JSON.stringify(input) },
      );
      onRecorded(result.notification);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel workflow-panel">
      <h2>
        {membership.expiresAt
          ? "Record a renewal"
          : "Record membership payment"}
      </h2>
      <p className="subtle">
        Confirm a full payment of{" "}
        <strong>{money(organization.feeCents)} CAD</strong> you have received.
        This activates or extends membership by {organization.termDays} days.
      </p>
      <form
        className="stack-form"
        onSubmit={(event) => void submit(event)}
        aria-label="Record membership payment"
      >
        {error && <Notice>{error}</Notice>}
        <fieldset disabled={busy}>
          <div className="field">
            <label htmlFor="payment-method">Payment method</label>
            <select id="payment-method" name="method" defaultValue="e-transfer">
              <option value="e-transfer">E-transfer</option>
              <option value="cash">Cash</option>
              <option value="other">Other</option>
            </select>
          </div>
          <Field
            label="Transaction reference"
            name="reference"
            maxLength={120}
            placeholder="Bank reference or receipt number"
          />
          <Field
            label="Payment received on"
            name="paidAt"
            type="date"
            defaultValue={today}
            max={today}
            required
          />
          <label className="checkbox-field">
            <input type="checkbox" required />I verified receipt of this
            payment.
          </label>
        </fieldset>
        <Button type="submit" busy={busy}>
          {membership.expiresAt ? "Record renewal" : "Record payment"}
        </Button>
      </form>
    </section>
  );
}
