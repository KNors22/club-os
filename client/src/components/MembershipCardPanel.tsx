import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, ShieldCheck } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import {
  cardExpiration,
  downloadMembershipCard,
  drawMembershipCard,
  membershipCardFilename,
  membershipCardPng,
} from "../lib/membership-card";
import type { Membership, MembershipCardData } from "../types";
import { Button, Notice } from "./ui";

export function MembershipCardPanel({
  organizationId,
  clubName,
  memberName,
  membership,
  onMembershipUpdated,
}: {
  organizationId: string;
  clubName: string;
  memberName: string;
  membership: Membership;
  onMembershipUpdated: (membership: Membership) => void;
}) {
  const [snapshot, setSnapshot] = useState<MembershipCardData | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const requests = useRef(new Set<AbortController>());
  useEffect(() => {
    const pending = requests.current;
    return () => {
      for (const controller of pending) controller.abort();
    };
  }, []);
  const preview = useMemo<MembershipCardData | null>(
    () =>
      snapshot ??
      (membership.expiresAt
        ? {
            memberName,
            clubName,
            membershipId: membership.id,
            startsAt: membership.startsAt,
            expiresAt: membership.expiresAt,
            status: membership.status === "expired" ? "expired" : "active",
            issuedAt: new Date().toISOString(),
          }
        : null),
    [snapshot, membership, memberName, clubName],
  );
  const paint = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      if (canvas && preview) {
        try {
          drawMembershipCard(canvas, preview);
        } catch {
          /* The accessible summary remains available if canvas is unsupported. */
        }
      }
    },
    [preview],
  );

  async function save() {
    if (requests.current.size) return;
    const controller = new AbortController();
    requests.current.add(controller);
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const result = await api<{
        card: MembershipCardData;
        membership: Membership;
      }>(`/organizations/${organizationId}/memberships/me/card`, {
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      setSnapshot(result.card);
      onMembershipUpdated(result.membership);
      const blob = await membershipCardPng(result.card);
      if (controller.signal.aborted) return;
      downloadMembershipCard(blob, membershipCardFilename(result.card));
      setSaved(true);
    } catch (error) {
      if (!controller.signal.aborted) setError(errorMessage(error));
    } finally {
      requests.current.delete(controller);
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  return (
    <section className="panel card-download-panel" aria-label="Membership card">
      <div className="card-download-heading">
        <span className="eyebrow">TAKE YOUR CLUB WITH YOU</span>
        <h2>Membership card</h2>
        <p>Keep a copy of your membership and its expiration date.</p>
      </div>
      {preview ? (
        <>
          <canvas
            className="membership-card-preview"
            ref={paint}
            role="img"
            aria-label={`Membership card for ${preview.memberName}, ${preview.clubName}. ${preview.status === "expired" ? "Expired" : "Active at issue"}. Expires ${cardExpiration(preview.expiresAt)}. Membership ID ${preview.membershipId}.`}
          />
          <dl className="card-summary">
            <div>
              <dt>Card status</dt>
              <dd
                className={
                  preview.status === "expired" ? "card-expired-label" : ""
                }
              >
                {preview.status === "expired"
                  ? "Expired membership"
                  : "Active membership"}
              </dd>
            </div>
            <div>
              <dt>Expiration · Eastern time</dt>
              <dd>
                <time dateTime={preview.expiresAt}>
                  {cardExpiration(preview.expiresAt)}
                </time>
              </dd>
            </div>
            <div>
              <dt>Membership ID</dt>
              <dd className="card-membership-id">{preview.membershipId}</dd>
            </div>
          </dl>
        </>
      ) : (
        <div className="card-unavailable">
          <ShieldCheck size={36} aria-hidden="true" />
          <h3>Available after activation</h3>
          <p>
            Your administrator needs to activate your membership before you can
            save a card.
          </p>
        </div>
      )}
      {error && <Notice>{error}</Notice>}
      {saved && (
        <Notice tone="success">
          Your PNG is ready. Check your browser's downloads.
        </Notice>
      )}
      <Button onClick={save} busy={busy} disabled={!preview}>
        <Download size={17} aria-hidden="true" />
        {busy
          ? "Preparing card…"
          : preview?.status === "expired"
            ? "Save expired card (PNG)"
            : "Save card (PNG)"}
      </Button>
      <p className="card-download-note">
        {preview?.status === "expired"
          ? "This card records an expired membership. Contact your administrator to renew. "
          : ""}
        Saved cards are static copies. Save a new card after renewal.
      </p>
    </section>
  );
}
