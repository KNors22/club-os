import {
  CalendarDays,
  Clock3,
  Mail,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { Navigate } from "react-router-dom";
import { useOrganization } from "../contexts/clubs-context";
import { useAuth } from "../contexts/auth-context";
import { useResource } from "../hooks/useResource";
import { Avatar, ErrorState, Loading, StatusBadge } from "../components/ui";
import { PaymentHistory } from "../components/PaymentHistory";
import { date, money } from "../lib/format";
import type { Membership } from "../types";

export function MembershipPage({ overview = false }: { overview?: boolean }) {
  const organization = useOrganization();
  const { user } = useAuth();
  const resource = useResource<{ membership: Membership | null }>(
    organization.role === "member"
      ? `/organizations/${organization.id}/memberships/me`
      : null,
  );
  if (organization.role === "admin")
    return <Navigate to={`/app/${organization.id}`} replace />;
  const membership = resource.data?.membership;
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOU’RE PART OF SOMETHING GOOD</span>
          <h1>
            {overview ? `Welcome to ${organization.name}` : "My membership"}
            <span className="heading-dot">.</span>
          </h1>
          <p>Your place in the community, all in one place.</p>
        </div>
      </div>
      {resource.loading ? (
        <Loading label="Loading your membership…" />
      ) : resource.error ? (
        <ErrorState message={resource.error} retry={resource.reload} />
      ) : !membership ? (
        <ErrorState message="We couldn’t find your membership. Try refreshing your clubs." />
      ) : (
        <div className="membership-grid">
          <section className="membership-card">
            <div className="membership-card-top">
              <span className="membership-card-label">CLUB MEMBERSHIP</span>
              <ShieldCheck size={28} />
            </div>
            <div className="membership-card-person">
              <Avatar name={user!.name} large />
              <h2>{user!.name}</h2>
              <p>{organization.name}</p>
            </div>
            <div className="membership-card-bottom">
              <span>
                MEMBER SINCE<strong>{date(membership.joinedAt)}</strong>
              </span>
              <span className="card-symbol" aria-hidden="true">
                ✳
              </span>
            </div>
          </section>
          <section className="panel membership-details">
            <div className="panel-heading compact">
              <h2>Your membership</h2>
              <StatusBadge status={membership.status} />
            </div>
            <dl className="detail-list">
              <div>
                <dt>
                  <UsersRound size={17} />
                  Club
                </dt>
                <dd>{organization.name}</dd>
              </div>
              <div>
                <dt>
                  <ShieldCheck size={17} />
                  Membership fee
                </dt>
                <dd>{money(organization.feeCents)} CAD</dd>
              </div>
              <div>
                <dt>
                  <Clock3 size={17} />
                  Term
                </dt>
                <dd>{organization.termDays} days</dd>
              </div>
              <div>
                <dt>
                  <CalendarDays size={17} />
                  Valid from
                </dt>
                <dd>{date(membership.startsAt)}</dd>
              </div>
              <div>
                <dt>
                  <CalendarDays size={17} />
                  Expires
                </dt>
                <dd>{date(membership.expiresAt)}</dd>
              </div>
            </dl>
            <div className="membership-note">
              <Mail size={20} />
              <p>
                {membership.status === "pending"
                  ? "Contact your club administrator to confirm payment and activate your membership."
                  : membership.status === "expired"
                    ? "Ready for another chapter? Contact your administrator about renewing your membership."
                    : "You’re all set. Your club administrator can help with any membership questions."}
              </p>
            </div>
          </section>
          <PaymentHistory payments={membership.payments} />
        </div>
      )}
    </>
  );
}
