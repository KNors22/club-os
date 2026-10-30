import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useOrganization } from "../contexts/clubs-context";
import { useResource } from "../hooks/useResource";
import { useNow } from "../hooks/useNow";
import { NotificationBanner } from "../components/NotificationBanner";
import { api, errorMessage } from "../lib/api";
import { dateTime } from "../lib/format";
import { Avatar, Button, ErrorState, Loading, Notice } from "../components/ui";
import type {
  ClubEvent,
  Membership,
  NotificationResult,
  Participant,
} from "../types";

export function EventDetailPage() {
  const organization = useOrganization();
  const now = useNow();
  const { eventId } = useParams();
  const isAdmin = organization.role === "admin";
  const path = `/organizations/${organization.id}/events/${eventId}`;
  const resource = useResource<{ event: ClubEvent }>(path);
  const participants = useResource<{ participants: Participant[] }>(
    isAdmin ? `${path}/participants` : null,
  );
  const ownMembership = useResource<{ membership: Membership | null }>(
    !isAdmin ? `/organizations/${organization.id}/memberships/me` : null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<{
    message: string;
    tone: "success" | "info";
  } | null>(null);
  function refresh() {
    resource.reload();
    participants.reload();
    ownMembership.reload();
  }
  async function registration(cancel = false) {
    setBusy(true);
    setError("");
    setNotice(null);
    try {
      const result = await api<{ notification?: NotificationResult }>(
        `${path}/registrations/me`,
        { method: cancel ? "DELETE" : "POST", body: "{}" },
      );
      setNotice({
        message: cancel
          ? "Your registration has been cancelled."
          : `You are registered. ${result.notification?.message ?? "See you at the event!"}`,
        tone:
          result.notification && result.notification.status !== "sent"
            ? "info"
            : "success",
      });
      refresh();
    } catch (error) {
      setError(errorMessage(error));
      resource.reload();
    } finally {
      setBusy(false);
    }
  }
  async function checkIn(membershipId: string) {
    setBusy(true);
    setError("");
    setNotice(null);
    try {
      const result = await api<{ alreadyCheckedIn: boolean }>(
        `${path}/attendance/${membershipId}`,
        { method: "POST", body: "{}" },
      );
      setNotice({
        message: result.alreadyCheckedIn
          ? "This member is already checked in."
          : "Attendance recorded.",
        tone: "success",
      });
      refresh();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  const event = resource.data?.event;
  const closed = event ? new Date(event.startsAt).getTime() <= now : false;
  const active = ownMembership.data?.membership?.status === "active";
  return (
    <>
      <NotificationBanner />
      <Link
        className="text-link back-link"
        to={`/app/${organization.id}/events`}
      >
        ← Back to events
      </Link>
      {resource.loading ? (
        <Loading />
      ) : resource.error ? (
        <ErrorState message={resource.error} retry={resource.reload} />
      ) : (
        event && (
          <>
            <div className="page-heading">
              <div>
                <span className="eyebrow">CLUB EVENT</span>
                <h1>
                  {event.title}
                  <span className="heading-dot">.</span>
                </h1>
                <p>
                  {dateTime(event.startsAt)} · {event.location}
                </p>
              </div>
              <Button variant="secondary" onClick={refresh}>
                Refresh event
              </Button>
            </div>
            {error && <Notice>{error}</Notice>}
            {notice && <Notice tone={notice.tone}>{notice.message}</Notice>}
            <section className="panel workflow-panel">
              <p className="event-detail-description">
                {event.description ||
                  "Join your community for this club event."}
              </p>
              <dl className="event-facts">
                <div>
                  <dt>When</dt>
                  <dd>{dateTime(event.startsAt)}</dd>
                </div>
                <div>
                  <dt>Where</dt>
                  <dd>{event.location}</dd>
                </div>
                <div>
                  <dt>Registration</dt>
                  <dd>
                    {event.registrationCount} / {event.capacity} places filled
                  </dd>
                </div>
                <div>
                  <dt>Attendance</dt>
                  <dd>{event.attendanceCount} checked in</dd>
                </div>
              </dl>
              {!isAdmin && (
                <div className="registration-controls">
                  {ownMembership.loading ? (
                    <Loading label="Checking your membership…" />
                  ) : ownMembership.error ? (
                    <ErrorState
                      message={ownMembership.error}
                      retry={ownMembership.reload}
                    />
                  ) : event.registration ? (
                    <>
                      <span className="status status-active">
                        {event.registration.checkedInAt
                          ? "Checked in"
                          : "You’re registered"}
                      </span>
                      {!closed && !event.registration.checkedInAt && (
                        <Button
                          variant="secondary"
                          busy={busy}
                          onClick={() => void registration(true)}
                        >
                          Cancel registration
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Button
                        busy={busy}
                        disabled={
                          !active ||
                          closed ||
                          event.registrationCount >= event.capacity
                        }
                        onClick={() => void registration()}
                      >
                        Register for event
                      </Button>
                      <span className="subtle">
                        {closed ? (
                          "Registration has closed."
                        ) : event.registrationCount >= event.capacity ? (
                          "This event is full."
                        ) : !active ? (
                          <>
                            An active membership is required.{" "}
                            <Link
                              className="text-link"
                              to={`/app/${organization.id}/membership`}
                            >
                              My membership →
                            </Link>
                          </>
                        ) : (
                          `${event.capacity - event.registrationCount} places available`
                        )}
                      </span>
                    </>
                  )}
                </div>
              )}
            </section>
            {isAdmin && (
              <section className="panel history-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Participants</h2>
                    <p>Registered members for this event.</p>
                  </div>
                </div>
                {participants.loading ? (
                  <Loading label="Loading participants…" />
                ) : participants.error ? (
                  <ErrorState
                    message={participants.error}
                    retry={participants.reload}
                  />
                ) : participants.data?.participants.length ? (
                  <div className="table-scroll">
                    <table className="member-table participant-table">
                      <caption className="sr-only">Event participants</caption>
                      <thead>
                        <tr>
                          <th scope="col">Member</th>
                          <th scope="col">Registered</th>
                          <th scope="col">Attendance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {participants.data.participants.map((participant) => (
                          <tr key={participant.membershipId}>
                            <td>
                              <div className="table-person">
                                <Avatar name={participant.name} />
                                <div>
                                  <strong>{participant.name}</strong>
                                  <small>{participant.email}</small>
                                </div>
                              </div>
                            </td>
                            <td>{dateTime(participant.registeredAt)}</td>
                            <td>
                              {participant.checkedInAt ? (
                                <>
                                  <span className="status status-active">
                                    Checked in
                                  </span>
                                  <small className="table-secondary">
                                    {dateTime(participant.checkedInAt)}
                                  </small>
                                </>
                              ) : (
                                <Button
                                  variant="secondary"
                                  disabled={busy}
                                  onClick={() =>
                                    void checkIn(participant.membershipId)
                                  }
                                  aria-label={`Check in ${participant.name}`}
                                >
                                  Check in
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>No members have registered yet.</p>
                  </div>
                )}
              </section>
            )}
          </>
        )
      )}
    </>
  );
}
