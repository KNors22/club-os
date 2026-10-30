import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarDays, MapPin, Plus, UsersRound } from "lucide-react";
import { useOrganization } from "../contexts/clubs-context";
import { useResource } from "../hooks/useResource";
import { Button, ErrorState, Loading } from "../components/ui";
import { CreateEventForm } from "../components/CreateEventForm";
import { dateTime } from "../lib/format";
import type { EventList } from "../types";

export function EventsPage() {
  const organization = useOrganization();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [view, setView] = useState("upcoming");
  const [page, setPage] = useState(1);
  const resource = useResource<EventList>(
    `/organizations/${organization.id}/events?view=${view}&page=${page}`,
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">BRING YOUR COMMUNITY TOGETHER</span>
          <h1>
            Events<span className="heading-dot">.</span>
          </h1>
          <p>Make plans, find your people, and take part.</p>
        </div>
        {organization.role === "admin" && !creating && (
          <Button onClick={() => setCreating(true)}>
            <Plus size={17} />
            New event
          </Button>
        )}
      </div>
      {creating && (
        <CreateEventForm
          onCancel={() => setCreating(false)}
          onCreated={(event) =>
            navigate(`/app/${organization.id}/events/${event.id}`)
          }
        />
      )}
      <div className="section-heading">
        <h2>{view === "upcoming" ? "Upcoming events" : "All events"}</h2>
        <div className="filter-input">
          <label htmlFor="event-view">Show</label>
          <select
            id="event-view"
            value={view}
            onChange={(event) => {
              setView(event.target.value);
              setPage(1);
            }}
          >
            <option value="upcoming">Upcoming events</option>
            <option value="all">All events</option>
          </select>
        </div>
      </div>
      {resource.loading ? (
        <Loading label="Loading club events…" />
      ) : resource.error ? (
        <ErrorState message={resource.error} retry={resource.reload} />
      ) : resource.data?.events.length ? (
        <>
          <div className="event-grid">
            {resource.data.events.map((event) => (
              <article className="panel event-card" key={event.id}>
                <div className="event-card-top">
                  <CalendarDays size={24} />
                  {event.registration && (
                    <span className="status status-active">Registered</span>
                  )}
                </div>
                <h2>
                  <Link to={`/app/${organization.id}/events/${event.id}`}>
                    {event.title}
                  </Link>
                </h2>
                <p className="event-description">
                  {event.description ||
                    "A chance to come together with your club."}
                </p>
                <div className="event-meta">
                  <span>
                    <CalendarDays size={16} />
                    {dateTime(event.startsAt)}
                  </span>
                  <span>
                    <MapPin size={16} />
                    {event.location}
                  </span>
                  <span>
                    <UsersRound size={16} />
                    {event.registrationCount} / {event.capacity} registered
                  </span>
                </div>
                <Link
                  className="button button-secondary"
                  to={`/app/${organization.id}/events/${event.id}`}
                >
                  View event →
                </Link>
              </article>
            ))}
          </div>
          <div className="pagination">
            <span>
              {resource.data.pagination.total} events · Page {page} of{" "}
              {resource.data.pagination.pages}
            </span>
            <div>
              <Button
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                disabled={page >= resource.data!.pagination.pages}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="panel empty-state">
          <CalendarDays size={30} />
          <h2>No events here yet.</h2>
          <p>
            {organization.role === "admin"
              ? "Create an event and give your members something to look forward to."
              : "Your club’s events will appear here when they are announced."}
          </p>
        </div>
      )}
    </>
  );
}
