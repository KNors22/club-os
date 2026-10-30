import { useState, type FormEvent } from "react";
import { useOrganization } from "../contexts/clubs-context";
import { api, errorMessage } from "../lib/api";
import { localDateTime } from "../lib/format";
import { Button, Field, Notice } from "./ui";
import type { ClubEvent } from "../types";

export function CreateEventForm({
  onCreated,
  onCancel,
}: {
  onCreated: (event: ClubEvent) => void;
  onCancel: () => void;
}) {
  const organization = useOrganization();
  const [initialTime] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await api<{ event: ClubEvent }>(
        `/organizations/${organization.id}/events`,
        {
          method: "POST",
          body: JSON.stringify({
            title: String(form.get("title")).trim(),
            description: String(form.get("description")).trim(),
            location: String(form.get("location")).trim(),
            capacity: Number(form.get("capacity")),
            startsAt: new Date(String(form.get("startsAt"))).toISOString(),
          }),
        },
      );
      onCreated(result.event);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel workflow-panel event-create-panel">
      <h2>Create an event</h2>
      <form
        className="stack-form"
        onSubmit={(event) => void submit(event)}
        aria-label="Create an event"
      >
        {error && <Notice>{error}</Notice>}
        <fieldset disabled={busy}>
          <Field
            name="title"
            label="Event title"
            minLength={2}
            maxLength={120}
            required
            placeholder="Weekly community run"
          />
          <div className="field">
            <label htmlFor="event-description">Description (optional)</label>
            <textarea
              id="event-description"
              name="description"
              rows={3}
              maxLength={1000}
            />
          </div>
          <div className="form-row">
            <Field
              name="startsAt"
              label="Event date and time"
              type="datetime-local"
              defaultValue={localDateTime(new Date(initialTime + 86400000))}
              min={localDateTime(new Date(initialTime))}
              required
            />
            <Field
              name="capacity"
              label="Capacity"
              type="number"
              min={1}
              max={10000}
              step={1}
              defaultValue={20}
              required
            />
          </div>
          <Field
            name="location"
            label="Location"
            minLength={2}
            maxLength={200}
            required
            placeholder="Campus main entrance"
          />
        </fieldset>
        <div className="action-row">
          <Button type="submit" busy={busy}>
            Create event
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      </form>
    </section>
  );
}
