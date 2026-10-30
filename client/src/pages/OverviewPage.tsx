import {
  ArrowUpRight,
  CircleCheck,
  Clock3,
  UsersRound,
  UserX,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useOrganization } from "../contexts/clubs-context";
import { useResource } from "../hooks/useResource";
import { ErrorState, Loading } from "../components/ui";
import { JoinCode } from "../components/JoinCode";
import { MemberTable } from "../components/MemberTable";
import { money } from "../lib/format";
import { MembershipPage } from "./MembershipPage";
import type { DashboardData, MemberList } from "../types";

export function OverviewPage() {
  const organization = useOrganization();
  return organization.role === "admin" ? (
    <AdminOverview />
  ) : (
    <MembershipPage overview />
  );
}

function AdminOverview() {
  const organization = useOrganization();
  const counts = useResource<DashboardData>(
    `/organizations/${organization.id}/dashboard`,
  );
  const members = useResource<MemberList>(
    `/organizations/${organization.id}/memberships?limit=5`,
  );
  const stats = [
    {
      key: "total" as const,
      label: "Total members",
      icon: UsersRound,
      detail: "Your community, together",
    },
    {
      key: "active" as const,
      label: "Active memberships",
      icon: CircleCheck,
      detail: "Ready for what’s next",
    },
    {
      key: "pending" as const,
      label: "Awaiting payment",
      icon: Clock3,
      detail: "A little follow-up goes a long way",
    },
    {
      key: "expired" as const,
      label: "Expired memberships",
      icon: UserX,
      detail: "Time to reconnect",
    },
  ];
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">THE BIG PICTURE</span>
          <h1>
            A good day for your club<span className="heading-dot">.</span>
          </h1>
          <p>Here’s how things are looking at {organization.name}.</p>
        </div>
        <span className="role-pill role-admin">Administrator</span>
      </div>
      {counts.loading ? (
        <Loading label="Loading your overview…" />
      ) : counts.error ? (
        <ErrorState message={counts.error} retry={counts.reload} />
      ) : (
        counts.data && (
          <div className="stats-grid">
            {stats.map(({ key, label, icon: Icon, detail }) => (
              <section className={`stat-card stat-${key}`} key={key}>
                <div className="stat-top">
                  <span>{label}</span>
                  <Icon size={19} />
                </div>
                <strong>{counts.data!.counts[key]}</strong>
                <small>{detail}</small>
              </section>
            ))}
          </div>
        )
      )}
      {counts.data?.payments && (
        <section className="metrics-grid" aria-label="Club workflow summaries">
          <div className="panel metric-card">
            <span>Payments received</span>
            <strong>{money(counts.data.payments.totalCents)}</strong>
            <small>
              {counts.data.payments.transactions} confirmed transactions · CAD
            </small>
          </div>
          <div className="panel metric-card">
            <span>Upcoming renewals</span>
            <strong>{counts.data.renewals.dueSoon}</strong>
            <small>
              Expiring within {counts.data.renewals.windowDays} days
            </small>
          </div>
          <div className="panel metric-card">
            <span>Upcoming events</span>
            <strong>{counts.data.events.upcoming}</strong>
            <small>
              {counts.data.events.total}{" "}
              {counts.data.events.total === 1 ? "event" : "events"} in total
            </small>
          </div>
          <div className="panel metric-card">
            <span>Event registrations</span>
            <strong>{counts.data.events.registrations}</strong>
            <small>
              {counts.data.events.attendance}{" "}
              {counts.data.events.attendance === 1 ? "member" : "members"}{" "}
              checked in
            </small>
          </div>
        </section>
      )}
      <div className="overview-grid">
        <JoinCode code={organization.joinCode!} />
        <section className="panel plan-card">
          <span className="eyebrow">YOUR MEMBERSHIP PLAN</span>
          <h2>
            {money(organization.feeCents)} <small>CAD</small>
          </h2>
          <p>One membership. {organization.termDays} days of belonging.</p>
          <div className="plan-card-footer">
            <span className="plan-dot" />
            Club membership
          </div>
        </section>
      </div>
      <section className="panel members-panel">
        <div className="panel-heading">
          <div>
            <h2>The people behind your club</h2>
            <p>Your most recent members, at a glance.</p>
          </div>
          <Link className="text-link" to={`/app/${organization.id}/members`}>
            All members <ArrowUpRight size={17} />
          </Link>
        </div>
        {members.loading ? (
          <Loading label="Loading members…" />
        ) : members.error ? (
          <ErrorState message={members.error} retry={members.reload} />
        ) : members.data?.memberships.length ? (
          <MemberTable
            members={members.data.memberships}
            organizationId={organization.id}
          />
        ) : (
          <div className="empty-state">
            <UsersRound size={30} />
            <h3>Every community starts with one.</h3>
            <p>Share your join code and welcome your first members.</p>
          </div>
        )}
      </section>
    </>
  );
}
