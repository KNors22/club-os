import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  KeyRound,
  Layers3,
  Plus,
  UsersRound,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/auth-context";
import { useClubs } from "../contexts/clubs-context";
import {
  Avatar,
  Button,
  ErrorState,
  Field,
  Loading,
  Notice,
} from "../components/ui";
import { api, errorMessage } from "../lib/api";
import { money } from "../lib/format";
import type { Organization } from "../types";

export function ClubsPage() {
  const { user } = useAuth();
  const clubs = useClubs();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState<{ form: string; message: string } | null>(
    null,
  );
  async function submit(
    event: FormEvent<HTMLFormElement>,
    action: "create" | "join",
  ) {
    event.preventDefault();
    setBusy(action);
    setError(null);
    const form = new FormData(event.currentTarget);
    const body =
      action === "join"
        ? { joinCode: String(form.get("joinCode")).trim() }
        : {
            name: String(form.get("name")).trim(),
            description: String(form.get("description")).trim(),
            feeCents: Math.round(Number(form.get("fee")) * 100),
            termDays: Number(form.get("termDays")),
          };
    try {
      const { organization } = await api<{ organization: Organization }>(
        action === "join" ? "/organizations/join" : "/organizations",
        { method: "POST", body: JSON.stringify(body) },
      );
      clubs.selectOrganization(organization.id);
      clubs.reload();
      navigate(`/app/${organization.id}`);
    } catch (error) {
      setError({ form: action, message: errorMessage(error) });
    } finally {
      setBusy(null);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR COMMUNITY STARTS HERE</span>
          <h1>
            Your clubs<span className="heading-dot">.</span>
          </h1>
          <p>A place for your people, all together.</p>
        </div>
        <span className="date-label">
          Good to see you, {user!.name.split(" ")[0]}{" "}
          <span aria-hidden="true">↗</span>
        </span>
      </div>
      <section className="welcome-banner">
        <div>
          <span className="banner-kicker">
            LESS SPREADSHEET. MORE COMMUNITY.
          </span>
          <h2>
            Great clubs start
            <br />
            with connected people.
          </h2>
          <p>Start a club of your own, or join the one you call home.</p>
          <a href="#club-forms" className="banner-link">
            Make yourself at home <ArrowUpRight size={18} />
          </a>
        </div>
        <div className="banner-art" aria-hidden="true">
          <span className="banner-ring" />
          <span className="banner-asterisk">✳</span>
          <span className="banner-art-caption">Better, together.</span>
        </div>
      </section>
      <div className="section-heading">
        <h2>
          Your communities{" "}
          <span className="count-pill">{clubs.organizations.length}</span>
        </h2>
        <span className="subtle">One account. Every club.</span>
      </div>
      {clubs.loading ? (
        <Loading label="Finding your clubs…" />
      ) : clubs.error ? (
        <ErrorState message={clubs.error} retry={clubs.reload} />
      ) : clubs.organizations.length > 0 ? (
        <div className="club-grid">
          {clubs.organizations.map((club) => (
            <Link
              key={club.id}
              to={`/app/${club.id}`}
              onClick={() => clubs.selectOrganization(club.id)}
              className="club-card"
            >
              <div className="club-card-top">
                <Avatar name={club.name} large />
                <span
                  className={`role-pill ${club.role === "admin" ? "role-admin" : ""}`}
                >
                  {club.role === "admin" ? "Administrator" : "Member"}
                </span>
              </div>
              <h3>{club.name}</h3>
              <p>{club.description || "A community worth being part of."}</p>
              <div className="club-card-bottom">
                <span>
                  {money(club.feeCents)} <small>/ {club.termDays} days</small>
                </span>
                <ArrowUpRight size={21} />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-clubs">
          <div className="empty-icon">
            <UsersRound size={26} />
          </div>
          <div>
            <h3>Your people are out there.</h3>
            <p>
              Create your first club below, or ask an administrator for a join
              code.
            </p>
          </div>
        </div>
      )}
      <div id="club-forms" className="onboarding-grid">
        <section className="panel onboarding-panel" id="create-club">
          <div className="panel-icon">
            <Plus size={22} />
          </div>
          <h2>Start something good.</h2>
          <p className="subtle">
            Create a home for your club. You'll be its administrator.
          </p>
          <form
            onSubmit={(event) => void submit(event, "create")}
            className="stack-form"
          >
            {error?.form === "create" && <Notice>{error.message}</Notice>}
            <fieldset disabled={busy !== null}>
              <Field
                name="name"
                label="Club name"
                placeholder="e.g. Campus Running Club"
                required
                minLength={2}
                maxLength={100}
              />
              <div className="field">
                <label htmlFor="club-description">
                  A little about your club{" "}
                  <span className="optional">(optional)</span>
                </label>
                <textarea
                  id="club-description"
                  name="description"
                  placeholder="What brings your people together?"
                  maxLength={500}
                  rows={3}
                />
              </div>
              <div className="form-row">
                <Field
                  name="fee"
                  label="Membership fee (CAD)"
                  type="number"
                  min="0.01"
                  max="10000"
                  step="0.01"
                  defaultValue="20.00"
                  required
                />
                <Field
                  name="termDays"
                  label="Term length (days)"
                  type="number"
                  min="1"
                  max="1095"
                  step="1"
                  defaultValue="365"
                  required
                />
              </div>
            </fieldset>
            <Button
              type="submit"
              busy={busy === "create"}
              disabled={busy !== null && busy !== "create"}
            >
              Create club <ArrowRight size={17} />
            </Button>
          </form>
        </section>
        <section className="panel onboarding-panel join-panel">
          <div className="panel-icon">
            <KeyRound size={22} />
          </div>
          <h2>Already found your people?</h2>
          <p className="subtle">
            Use the code your club administrator shared with you.
          </p>
          <form
            onSubmit={(event) => void submit(event, "join")}
            className="stack-form"
          >
            {error?.form === "join" && <Notice>{error.message}</Notice>}
            <fieldset disabled={busy !== null}>
              <Field
                name="joinCode"
                label="Club join code"
                placeholder="A1B2C3D4E5F6"
                required
                minLength={12}
                maxLength={12}
                autoCapitalize="characters"
                spellCheck={false}
                className="code-input"
                hint="Your 12-character code connects you to the right club."
              />
            </fieldset>
            <Button
              type="submit"
              variant="secondary"
              busy={busy === "join"}
              disabled={busy !== null && busy !== "join"}
            >
              Join a club <ArrowRight size={17} />
            </Button>
          </form>
          <div className="join-note">
            <Layers3 size={20} />
            <p>
              Part of more than one community?
              <br />
              <strong>You can join as many clubs as you like.</strong>
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
