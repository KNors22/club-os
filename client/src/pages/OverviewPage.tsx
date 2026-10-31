import {
  ArrowUpRight,
  CalendarDays,
  CircleCheck,
  CreditCard,
  UsersRound,
} from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useOrganization } from "../contexts/clubs-context";
import { useResource } from "../hooks/useResource";
import { ErrorState, Loading } from "../components/ui";
import {
  DashboardCharts,
  type ActivityMetric,
} from "../components/DashboardCharts";
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
  const [activity, setActivity] = useState<ActivityMetric>("attendance");
  const insights = useRef<HTMLElement>(null);
  function showPayments() {
    setActivity("revenueCents");
    const section = insights.current;
    if (!section) return;
    section.focus({ preventScroll: true });
    section.scrollIntoView({
      behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  }
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
            <DashboardMetrics
              data={counts.data}
              organizationId={organization.id}
              onShowPayments={showPayments}
            />
            <section
              ref={insights}
              id="club-insights"
              className="club-insights"
              tabIndex={-1}
              aria-label="Club insights"
            >
              <DashboardCharts
                data={counts.data}
                organizationId={organization.id}
                activity={activity}
                onActivityChange={setActivity}
              />
            </section>
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

function DashboardMetrics({
  data,
  organizationId,
  onShowPayments,
}: {
  data: DashboardData;
  organizationId: string;
  onShowPayments: () => void;
}) {
  const rate = data.counts.total
    ? Math.round((data.counts.active / data.counts.total) * 100)
    : 0;
  return (
    <section className="dashboard-kpis" aria-label="Club workflow summaries">
      <Link
        className="panel dashboard-kpi dashboard-kpi-action"
        to={`/app/${organizationId}/members`}
        aria-label="Total members"
        aria-describedby="total-members-count"
      >
        <div className="kpi-heading">
          <span className="kpi-icon">
            <UsersRound size={20} />
          </span>
          <span>Total members</span>
        </div>
        <strong id="total-members-count">{data.counts.total}</strong>
        <small>
          {data.counts.pending} awaiting payment · {data.counts.expired} expired
        </small>
      </Link>
      <Link
        className="panel dashboard-kpi dashboard-kpi-action"
        to={`/app/${organizationId}/members?status=active`}
        aria-label="Active members"
        aria-describedby="active-members-count"
      >
        <div className="kpi-heading">
          <span className="kpi-icon">
            <CircleCheck size={20} />
          </span>
          <span>Active members</span>
        </div>
        <strong id="active-members-count">{data.counts.active}</strong>
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
      </Link>
      <Link
        className="panel dashboard-kpi dashboard-kpi-action"
        to={`/app/${organizationId}/events`}
        aria-label="Upcoming events"
        aria-describedby="upcoming-events-count"
      >
        <div className="kpi-heading">
          <span className="kpi-icon">
            <CalendarDays size={20} />
          </span>
          <span>Upcoming events</span>
        </div>
        <strong id="upcoming-events-count">{data.events.upcoming}</strong>
        <small>
          {data.events.registrations} registrations · {data.events.total} total
          events
        </small>
        <small>
          {data.events.attendance}{" "}
          {data.events.attendance === 1 ? "member" : "members"} checked in
        </small>
      </Link>
      <button
        type="button"
        className="panel dashboard-kpi dashboard-kpi-action"
        onClick={onShowPayments}
        aria-label="Payments received"
        aria-describedby="payments-received-value"
        aria-controls="club-insights"
      >
        <span className="kpi-heading">
          <span className="kpi-icon">
            <CreditCard size={20} />
          </span>
          <span>Payments received</span>
        </span>
        <strong id="payments-received-value">
          {money(data.payments.totalCents)}
        </strong>
        <small>{data.payments.transactions} confirmed transactions · CAD</small>
      </button>
    </section>
  );
}
