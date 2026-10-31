import { useEffect, useId, useRef, useState } from "react";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";
import { money, dateTime } from "../lib/format";
import type { DashboardData, MonthlyActivity } from "../types";

function monthLabel(month: string, long = false) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "UTC",
    month: long ? "long" : "short",
    ...(long ? { year: "numeric" as const } : {}),
  }).format(new Date(`${month}-15T12:00:00Z`));
}
type Metric = "attendance" | "members" | "revenueCents";
export type ActivityMetric = Exclude<Metric, "members">;
function LineChart({
  rows,
  metric,
  title,
}: {
  rows: MonthlyActivity[];
  metric: Metric;
  title: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600),
    [selected, setSelected] = useState<number | null>(null);
  const id = useId();
  useEffect(() => {
    if (!ref.current || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const value = entries[0]?.contentRect.width;
      if (value) setWidth(Math.max(280, Math.round(value)));
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  const currency = metric === "revenueCents";
  const format = (value: number) => (currency ? money(value) : String(value));
  const axis = (value: number) =>
    currency
      ? new Intl.NumberFormat("en-CA", {
          style: "currency",
          currency: "CAD",
          notation: "compact",
          maximumFractionDigits: value < 100 ? 2 : 1,
        }).format(value / 100)
      : String(value);
  const height = 224,
    left = currency ? 48 : 35,
    right = 16,
    top = 14,
    bottom = 36;
  const plotWidth = width - left - right,
    plotHeight = height - top - bottom;
  const maximum = Math.max(0, ...rows.map((row) => row[metric]));
  const step = Math.max(1, Math.ceil(maximum / 4)),
    ceiling = step * 4;
  const points = rows.map((row, index) => ({
    x: left + (rows.length > 1 ? index / (rows.length - 1) : 0.5) * plotWidth,
    y: top + plotHeight - (row[metric] / ceiling) * plotHeight,
  }));
  const line = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const area = points.length
    ? `${line} L ${points.at(-1)!.x} ${height - bottom} L ${points[0].x} ${height - bottom} Z`
    : "";
  const current = selected === null ? undefined : rows[selected];
  return (
    <div ref={ref} className="trend-visual">
      <div className="chart-readout" aria-live="polite">
        {current ? (
          <>
            <strong>{monthLabel(current.month, true)}</strong>
            <span>
              {format(current[metric])}
              {currency ? " CAD" : ""}
            </span>
          </>
        ) : (
          <span>Point to a month or focus a point for its value.</span>
        )}
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="trend-svg"
        role="img"
        aria-label={title}
      >
        <title>{title}</title>
        <desc>Monthly recorded values. A data table follows the chart.</desc>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-green)" stopOpacity=".2" />
            <stop
              offset="100%"
              stopColor="var(--chart-green)"
              stopOpacity="0"
            />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((index) => {
          const y = top + plotHeight - (index / 4) * plotHeight;
          return (
            <g key={index}>
              <line
                x1={left}
                y1={y}
                x2={width - right}
                y2={y}
                className="chart-grid-line"
              />
              <text
                x={left - 8}
                y={y + 4}
                textAnchor="end"
                className="chart-axis"
              >
                {axis(step * index)}
              </text>
            </g>
          );
        })}
        {area && <path d={area} fill={`url(#${id})`} />}
        {line && <path d={line} className="chart-line" />}
        {rows.map((row, index) => {
          const point = points[index];
          return (
            <g
              key={row.month}
              tabIndex={0}
              role="img"
              aria-label={`${monthLabel(row.month, true)}: ${format(row[metric])}${currency ? " CAD" : ""}`}
              onMouseEnter={() => setSelected(index)}
              onMouseLeave={() => setSelected(null)}
              onFocus={() => setSelected(index)}
              onBlur={() => setSelected(null)}
              className="chart-point"
            >
              <title>
                {monthLabel(row.month, true)}: {format(row[metric])}
              </title>
              <circle cx={point.x} cy={point.y} r="11" fill="transparent" />
              <circle
                cx={point.x}
                cy={point.y}
                r={selected === index ? 5 : 3.5}
                className="chart-dot"
              />
              <text
                x={point.x}
                y={height - 9}
                textAnchor={
                  index === 0
                    ? "start"
                    : index === rows.length - 1
                      ? "end"
                      : "middle"
                }
                className="chart-axis"
              >
                {monthLabel(row.month)}
              </text>
            </g>
          );
        })}
      </svg>
      {maximum === 0 && (
        <p className="chart-empty">
          No{" "}
          {metric === "revenueCents"
            ? "payments"
            : metric === "members"
              ? "member records"
              : "check-ins"}{" "}
          recorded in this period.
        </p>
      )}
      <details className="chart-data">
        <summary>View chart data</summary>
        <div className="table-scroll">
          <table>
            <caption>{title} — monthly values</caption>
            <thead>
              <tr>
                <th scope="col">Month</th>
                <th scope="col">
                  {currency
                    ? "Received (CAD)"
                    : metric === "members"
                      ? "Total members"
                      : "Check-ins"}
                </th>
                {metric === "members" && <th scope="col">New members</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.month}>
                  <th scope="row">{monthLabel(row.month, true)}</th>
                  <td>{format(row[metric])}</td>
                  {metric === "members" && <td>{row.joins}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
function MembershipChart({
  data,
  organizationId,
}: {
  data: DashboardData;
  organizationId: string;
}) {
  const { total, active, pending, expired } = data.counts;
  const values = [
    { label: "Active", count: active, color: "var(--chart-green)" },
    { label: "Awaiting payment", count: pending, color: "var(--chart-amber)" },
    { label: "Expired", count: expired, color: "var(--chart-coral)" },
  ];
  const circumference = 2 * Math.PI * 53;
  let offset = 0;
  return (
    <section className="panel insight-panel" aria-label="Membership status">
      <div className="insight-heading">
        <h2>Membership status</h2>
        <Link to={`/app/${organizationId}/members`} className="text-link">
          View members <ArrowUpRight size={15} />
        </Link>
      </div>
      <div className="membership-chart-layout">
        <svg
          viewBox="0 0 144 144"
          className="membership-donut"
          role="img"
          aria-label={`${total} members: ${active} active, ${pending} awaiting payment, ${expired} expired`}
        >
          <title>Current membership status</title>
          <circle
            cx="72"
            cy="72"
            r="53"
            fill="none"
            stroke="#e8ede4"
            strokeWidth="16"
          />
          {values
            .filter((value) => value.count > 0)
            .map((value) => {
              const length = (value.count / (total || 1)) * circumference;
              const start = offset;
              offset += length;
              return (
                <circle
                  key={value.label}
                  cx="72"
                  cy="72"
                  r="53"
                  fill="none"
                  stroke={value.color}
                  strokeWidth="16"
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-start}
                  transform="rotate(-90 72 72)"
                />
              );
            })}
          <text x="72" y="71" textAnchor="middle" className="donut-total">
            {total}
          </text>
          <text x="72" y="91" textAnchor="middle" className="donut-caption">
            total members
          </text>
        </svg>
        <ul className="status-legend">
          {values.map((value) => (
            <li key={value.label}>
              <span
                className="legend-swatch"
                style={{ background: value.color }}
                aria-hidden="true"
              />
              <span>{value.label}</span>
              <strong>
                {value.count}{" "}
                <small>
                  ({total ? Math.round((value.count / total) * 100) : 0}%)
                </small>
              </strong>
            </li>
          ))}
        </ul>
      </div>
      <div className="insight-note">
        <strong>{data.renewals.dueSoon}</strong> active{" "}
        {data.renewals.dueSoon === 1
          ? "membership expires"
          : "memberships expire"}{" "}
        within {data.renewals.windowDays} days.
      </div>
      {total === 0 && (
        <p className="chart-empty">
          Share your join code to welcome your first member.
        </p>
      )}
    </section>
  );
}
export function DashboardCharts({
  data,
  organizationId,
  activity: selectedActivity,
  onActivityChange,
}: {
  data: DashboardData;
  organizationId: string;
  activity?: ActivityMetric;
  onActivityChange?: (activity: ActivityMetric) => void;
}) {
  const [period, setPeriod] = useState(6),
    [localActivity, setLocalActivity] = useState<ActivityMetric>("attendance");
  const activity = selectedActivity ?? localActivity;
  function chooseActivity(value: ActivityMetric) {
    if (selectedActivity === undefined) setLocalActivity(value);
    onActivityChange?.(value);
  }
  const monthly = data.analytics?.monthly ?? [];
  const rows = monthly.slice(-period);
  const events = data.upcomingEvents ?? [];
  const title =
    activity === "attendance" ? "Attendance trend" : "Payments received";
  const trendTotal = rows.reduce((sum, row) => sum + row[activity], 0);
  return (
    <>
      <div className="insights-toolbar">
        <div>
          <span className="eyebrow">YOUR CLUB IN VIEW</span>
          <h2>Club insights</h2>
          <p>Monthly activity · Eastern Time</p>
        </div>
        <div className="insight-period">
          <label htmlFor="insight-period">Chart period</label>
          <select
            id="insight-period"
            value={period}
            onChange={(event) => setPeriod(Number(event.target.value))}
          >
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
          </select>
        </div>
      </div>
      <div className="insights-grid">
        <section className="panel insight-panel" aria-label="Monthly activity">
          <div className="insight-heading">
            <div>
              <h2>{title}</h2>
              <p>
                <strong>
                  {activity === "attendance" ? trendTotal : money(trendTotal)}
                </strong>{" "}
                {activity === "attendance"
                  ? "recorded check-ins"
                  : "CAD received"}{" "}
                in this period
              </p>
            </div>
            <select
              aria-label="Activity metric"
              value={activity}
              onChange={(event) =>
                chooseActivity(event.target.value as ActivityMetric)
              }
            >
              <option value="attendance">Attendance</option>
              <option value="revenueCents">Payments</option>
            </select>
          </div>
          <LineChart
            key={activity + period}
            rows={rows}
            metric={activity}
            title={title}
          />
        </section>
        <MembershipChart data={data} organizationId={organizationId} />
        <section className="panel insight-panel" aria-label="Member growth">
          <div className="insight-heading">
            <div>
              <h2>Member growth</h2>
              <p>
                <strong>{rows.reduce((sum, row) => sum + row.joins, 0)}</strong>{" "}
                joined in this period
              </p>
            </div>
            <span className="chart-series-label">
              <span />
              Total members
            </span>
          </div>
          <LineChart
            key={period}
            rows={rows}
            metric="members"
            title="Member growth"
          />
        </section>
        <section
          className="panel insight-panel"
          aria-label="Upcoming event capacity"
        >
          <div className="insight-heading">
            <h2>Upcoming events</h2>
            <Link to={`/app/${organizationId}/events`} className="text-link">
              View all <ArrowUpRight size={15} />
            </Link>
          </div>
          {events.length ? (
            <ul className="upcoming-event-list">
              {events.map((event) => (
                <li key={event.id}>
                  <span className="upcoming-event-icon" aria-hidden="true">
                    <CalendarDays size={19} />
                  </span>
                  <div className="upcoming-event-body">
                    <Link to={`/app/${organizationId}/events/${event.id}`}>
                      {event.title}
                    </Link>
                    <p>{dateTime(event.startsAt)}</p>
                    <small>{event.location}</small>
                    <div className="event-capacity-label">
                      <span>Registered</span>
                      <strong>
                        {event.registrationCount} / {event.capacity}
                      </strong>
                    </div>
                    <div
                      className="capacity-track"
                      role="progressbar"
                      aria-label={`${event.title} registration capacity`}
                      aria-valuenow={event.registrationCount}
                      aria-valuemin={0}
                      aria-valuemax={event.capacity}
                    >
                      <span
                        style={{
                          width: `${Math.min(100, (event.registrationCount / event.capacity) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="insight-empty">
              <CalendarDays size={28} />
              <h3>Your next gathering starts here.</h3>
              <p>Create an event to see its date and available places.</p>
              <Link to={`/app/${organizationId}/events`} className="text-link">
                Plan an event <ArrowUpRight size={15} />
              </Link>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
