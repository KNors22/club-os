import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  Check,
  UsersRound,
  ShieldCheck,
  Layers3,
} from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/auth-context";
import { PublicDemoPanel } from "../components/PublicDemoPanel";
import { AppFooter } from "../components/AppFooter";
import { Brand } from "../components/Brand";
import { Button, Field, Notice } from "../components/ui";
import { errorMessage } from "../lib/api";

export function AuthPage({ register = false }: { register?: boolean }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [emailValue, setEmailValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (auth.user) return <Navigate to="/clubs" replace />;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email")).trim();
    const password = String(form.get("password"));
    try {
      if (register)
        await auth.register(String(form.get("name")).trim(), email, password);
      else await auth.login(email, password);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from?.startsWith("/app/") ? from : "/clubs", { replace: true });
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <aside className="auth-story">
        <Brand light />
        <div className="auth-story-content">
          <span className="eyebrow light">
            FOR THE PEOPLE WHO BRING PEOPLE TOGETHER
          </span>
          <h1>
            Less admin.
            <br />
            More <em>belonging.</em>
          </h1>
          <p>
            A home for your club, your members, and everything you’re building
            together.
          </p>
          <div className="community-art" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <span className="art-center">✳</span>
            <span className="art-bubble bubble-one">
              <UsersRound />
            </span>
            <span className="art-bubble bubble-two">
              <ShieldCheck />
            </span>
            <span className="art-bubble bubble-three">
              <Layers3 />
            </span>
            <span className="art-label">A little more connected.</span>
          </div>
          <div className="auth-benefits">
            <span>
              <Check size={16} />
              One place for your people
            </span>
            <span>
              <Check size={16} />
              Made for student clubs
            </span>
          </div>
        </div>
        <small className="auth-story-footer">
          Your community starts with you.
        </small>
      </aside>
      <main className="auth-main">
        <div className="auth-mobile-brand">
          <Brand />
        </div>
        <div className="auth-topline">
          {register ? "Already part of a club?" : "New around here?"}{" "}
          <Link to={register ? "/login" : "/register"}>
            {register ? "Sign in" : "Create an account"}{" "}
            <ArrowRight size={14} />
          </Link>
        </div>
        <div className="auth-form-wrap">
          <span className="eyebrow">YOUR CLUB, ALL TOGETHER</span>
          <h2>{register ? "Find your people." : "Welcome back."}</h2>
          <p className="auth-description">
            {register
              ? "Create your account. A great community is one step away."
              : "Sign in and pick up where your community left off."}
          </p>
          <form
            onSubmit={(event) => void submit(event)}
            className="stack-form"
            aria-label={register ? "Create account" : "Sign in"}
          >
            {error && <Notice>{error}</Notice>}
            {register && (
              <Field
                name="name"
                label="Full name"
                autoComplete="name"
                placeholder="Alex Morgan"
                required
                minLength={2}
                maxLength={100}
              />
            )}
            <Field
              value={emailValue}
              onChange={(event) => setEmailValue(event.target.value)}
              name="email"
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="you@university.ca"
              required
              maxLength={254}
            />
            <Field
              value={passwordValue}
              onChange={(event) => setPasswordValue(event.target.value)}
              name="password"
              label="Password"
              type="password"
              autoComplete={register ? "new-password" : "current-password"}
              required
              minLength={register ? 10 : 1}
              maxLength={72}
              hint={
                register
                  ? "At least 10 characters. Make it something only you know."
                  : undefined
              }
            />
            <Button type="submit" busy={busy} className="button-full">
              {register ? "Create your account" : "Sign in to ClubOS"}
              <ArrowRight size={18} />
            </Button>
          </form>
          {!register && (
            <PublicDemoPanel
              onChoose={(email, password) => {
                setEmailValue(email);
                setPasswordValue(password);
                setError("");
              }}
            />
          )}
          <p className="auth-form-note">
            <ShieldCheck size={15} />
            Your club’s information stays within your club.
          </p>
        </div>
        <AppFooter variant="auth" />
      </main>
    </div>
  );
}
