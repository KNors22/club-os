import {
  ArrowUpRight,
  CalendarDays,
  CircleCheck,
  CreditCard,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useOrganization } from "../contexts/clubs-context";
import { useResource } from "../hooks/useResource";
import { ErrorState, Loading } from "../components/ui";
import { DashboardCharts } from "../components/DashboardCharts";
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
          <>
            <DashboardMetrics data={counts.data} />
            <DashboardCharts
              data={counts.data}
              organizationId={organization.id}
            />
          </>
        )
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

function DashboardMetrics({ data }: { data: DashboardData }) {
  const rate = data.counts.total
    ? Math.round((data.counts.active / data.counts.total) * 100)
    : 0;
  return (
    <section className="dashboard-kpis" aria-label="Club workflow summaries">
      <div className="panel dashboard-kpi">
        <div className="kpi-heading">
          <span className="kpi-icon">
            <UsersRound size={20} />
          </span>
          <span>Total members</span>
        </div>
        <strong>{data.counts.total}</strong>
        <small>
          {data.counts.pending} awaiting payment · {data.counts.expired} expired
        </small>
      </div>
      <div className="panel dashboard-kpi">
        <div className="kpi-heading">
          <span className="kpi-icon">
            <CircleCheck size={20} />
          </span>
          <span>Active members</span>
        </div>
        <strong>{data.counts.active}</strong>
        <small>
          {rate}% of total · {data.renewals.dueSoon} expiring soon
        </small>
        <div
          className="active-share-track"
          role="meter"
          aria-label="Active membership share"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={rate}
          aria-valuetext={`${data.counts.active} of ${data.counts.total} members active`}
        >
          <span style={{ width: `${rate}%` }} />
        </div>
      </div>
      <div className="panel dashboard-kpi">
        <div className="kpi-heading">
          <span className="kpi-icon">
            <CalendarDays size={20} />
          </span>
          <span>Upcoming events</span>
        </div>
        <strong>{data.events.upcoming}</strong>
        <small>
          {data.events.registrations} registrations · {data.events.total} total
          events
        </small>
        <small>
          {data.events.attendance}{" "}
          {data.events.attendance === 1 ? "member" : "members"} checked in
        </small>
      </div>
      <div className="panel dashboard-kpi">
        <div className="kpi-heading">
          <span className="kpi-icon">
            <CreditCard size={20} />
          </span>
          <span>Payments received</span>
        </div>
        <strong>{money(data.payments.totalCents)}</strong>
        <small>{data.payments.transactions} confirmed transactions · CAD</small>
      </div>
    </section>
  );
}
