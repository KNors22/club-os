import { useState, type FormEvent } from "react";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../contexts/auth-context";
import { Avatar, Button, Field, Notice } from "../components/ui";
import { api, errorMessage } from "../lib/api";
import type { User } from "../types";

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSaved(false);
    const name = String(new FormData(event.currentTarget).get("name")).trim();
    try {
      const result = await api<{ user: User }>("/me", {
        method: "PATCH",
        body: JSON.stringify({ name }),
      });
      updateUser(result.user);
      setSaved(true);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">A LITTLE ABOUT YOU</span>
          <h1>
            My account<span className="heading-dot">.</span>
          </h1>
          <p>One profile, wherever your community takes you.</p>
        </div>
      </div>
      <section className="panel profile-panel">
        <div className="profile-intro">
          <Avatar name={user!.name} large />
          <div>
            <h2>{user!.name}</h2>
            <p>{user!.email}</p>
          </div>
        </div>
        <form onSubmit={(event) => void submit(event)} className="stack-form">
          {error && <Notice>{error}</Notice>}
          {saved && (
            <Notice tone="success">Your profile has been updated.</Notice>
          )}
          <Field
            name="name"
            label="Full name"
            defaultValue={user!.name}
            minLength={2}
            maxLength={100}
            autoComplete="name"
            required
          />
          <Field
            label="Email address"
            value={user!.email}
            readOnly
            hint="This is the email you use to sign in."
          />
          <Button type="submit" busy={busy}>
            Save changes
          </Button>
        </form>
        <div className="profile-privacy">
          <ShieldCheck size={18} />
          <p>
            Your name is shared with the administrators of clubs you join. Your
            profile is yours to manage.
          </p>
        </div>
      </section>
    </>
  );
}
