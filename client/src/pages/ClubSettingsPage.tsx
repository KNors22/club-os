import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useClubs, useOrganization } from "../contexts/clubs-context";
import { Button, Field, Notice } from "../components/ui";
import { api, ApiError, errorMessage } from "../lib/api";
import { money } from "../lib/format";
import type { Organization } from "../types";

export function ClubSettingsPage() {
  const organization = useOrganization();
  const clubs = useClubs();
  const [saved, setSaved] = useState(false);
  if (organization.role !== "admin")
    return <Navigate to={`/app/${organization.id}`} replace />;
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">CLUB ADMINISTRATION</span>
          <h1>
            Club settings<span className="heading-dot">.</span>
          </h1>
          <p>Keep your membership plan up to date.</p>
        </div>
      </div>
      {saved && (
        <Notice tone="success">
          Membership fee updated. Existing payment history and membership dates
          are unchanged.
        </Notice>
      )}
      <FeeForm
        key={`${organization.id}:${organization.feeCents}`}
        organization={organization}
        onSaved={(updated) => {
          clubs.updateOrganization(updated);
          setSaved(true);
        }}
        onRefresh={clubs.reload}
      />
    </>
  );
}
function FeeForm({
  organization,
  onSaved,
  onRefresh,
}: {
  organization: Organization;
  onSaved: (organization: Organization) => void;
  onRefresh: () => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [stale, setStale] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setStale(false);
    const fee = String(new FormData(event.currentTarget).get("fee"));
    try {
      const result = await api<{ organization: Organization }>(
        `/organizations/${organization.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            feeCents: Math.round(Number(fee) * 100),
            expectedFeeCents: organization.feeCents,
          }),
        },
      );
      onSaved(result.organization);
    } catch (error) {
      setError(errorMessage(error));
      setStale(error instanceof ApiError && error.code === "FEE_CHANGED");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel workflow-panel settings-panel">
      <h2>Membership fee</h2>
      <p className="subtle">
        The current fee is {money(organization.feeCents)} CAD for{" "}
        {organization.termDays} days. A new fee applies to future payments and
        renewals. Existing records stay unchanged.
      </p>
      <form
        aria-label="Update membership fee"
        className="stack-form"
        onSubmit={(event) => void submit(event)}
      >
        {error && <Notice>{error}</Notice>}
        <Field
          label="Membership fee (CAD)"
          name="fee"
          type="number"
          min="0.01"
          max="10000"
          step="0.01"
          defaultValue={(organization.feeCents / 100).toFixed(2)}
          required
          disabled={busy}
          hint="Record payments using the current full fee after receiving the funds."
        />
        <div className="form-actions">
          <Button type="submit" busy={busy} disabled={stale}>
            Save fee
          </Button>
          {stale && (
            <Button type="button" variant="secondary" onClick={onRefresh}>
              Refresh club settings
            </Button>
          )}
        </div>
      </form>
    </section>
  );
}
