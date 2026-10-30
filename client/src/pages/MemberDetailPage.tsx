import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useOrganization } from "../contexts/clubs-context";
import { useResource } from "../hooks/useResource";
import {
  Avatar,
  ErrorState,
  Loading,
  Notice,
  StatusBadge,
} from "../components/ui";
import { PaymentForm } from "../components/PaymentForm";
import { PaymentHistory } from "../components/PaymentHistory";
import { NotificationBanner } from "../components/NotificationBanner";
import { date } from "../lib/format";
import type { Membership, NotificationResult } from "../types";

export function MemberDetailPage() {
  const organization = useOrganization();
  const { membershipId } = useParams();
  const [notice, setNotice] = useState<{
    message: string;
    tone: "success" | "info";
  } | null>(null);
  const resource = useResource<{
    membership: Membership;
    user: { name: string; email: string };
  }>(
    organization.role === "admin"
      ? `/organizations/${organization.id}/memberships/${membershipId}`
      : null,
  );
  if (organization.role !== "admin")
    return <Navigate to={`/app/${organization.id}/membership`} replace />;
  function recorded(notification?: NotificationResult) {
    setNotice({
      message: `Payment recorded. ${notification?.message ?? "The membership is active."}`,
      tone: notification && notification.status !== "sent" ? "info" : "success",
    });
    resource.reload();
  }
  return (
    <>
      <NotificationBanner />
      <Link
        className="text-link back-link"
        to={`/app/${organization.id}/members`}
      >
        ← Back to members
      </Link>
      <div className="page-heading">
        <div>
          <span className="eyebrow">MEMBERSHIP MANAGEMENT</span>
          <h1>
            Member details<span className="heading-dot">.</span>
          </h1>
          <p>Confirm payments, manage renewals, and keep a clear history.</p>
        </div>
      </div>
      {notice && <Notice tone={notice.tone}>{notice.message}</Notice>}
      {resource.loading ? (
        <Loading />
      ) : resource.error ? (
        <ErrorState message={resource.error} retry={resource.reload} />
      ) : (
        resource.data && (
          <>
            <div className="workflow-grid">
              <section className="panel workflow-panel">
                <div className="profile-intro">
                  <Avatar name={resource.data.user.name} large />
                  <div>
                    <h2>{resource.data.user.name}</h2>
                    <p>{resource.data.user.email}</p>
                  </div>
                </div>
                <StatusBadge status={resource.data.membership.status} />
                <dl className="detail-list">
                  <div>
                    <dt>Member since</dt>
                    <dd>{date(resource.data.membership.joinedAt)}</dd>
                  </div>
                  <div>
                    <dt>Valid from</dt>
                    <dd>{date(resource.data.membership.startsAt)}</dd>
                  </div>
                  <div>
                    <dt>Expires</dt>
                    <dd>{date(resource.data.membership.expiresAt)}</dd>
                  </div>
                </dl>
              </section>
              <PaymentForm
                membership={resource.data.membership}
                onRecorded={recorded}
              />
            </div>
            <PaymentHistory payments={resource.data.membership.payments} />
          </>
        )
      )}
    </>
  );
}
