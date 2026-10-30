import { useState } from "react";
import { Link, NavLink, Outlet, useMatch, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  ChevronDown,
  LayoutDashboard,
  Layers3,
  LogOut,
  Menu,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
  CalendarDays,
} from "lucide-react";
import { useAuth } from "../contexts/auth-context";
import { useClubs } from "../contexts/clubs-context";
import { Brand } from "./Brand";
import { Avatar, Notice } from "./ui";
import { errorMessage } from "../lib/api";

export function WorkspaceLayout() {
  const { user, logout } = useAuth();
  const { organizations } = useClubs();
  const match = useMatch("/app/:orgId/*");
  const organization = organizations.find(
    (club) => club.id === match?.params.orgId,
  );
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function signOut() {
    setBusy(true);
    setError("");
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  const close = () => setOpen(false);
  return (
    <div className="workspace">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {open && (
        <button
          className="sidebar-backdrop"
          onClick={close}
          aria-label="Close navigation"
        />
      )}
      <aside
        id="workspace-nav"
        className={`sidebar${open ? " sidebar-open" : ""}`}
      >
        <div className="sidebar-brand">
          <Brand light />
          <button
            className="icon-button mobile-only"
            onClick={close}
            aria-label="Close navigation"
          >
            <X size={22} />
          </button>
        </div>
        <Link to="/clubs" onClick={close} className="club-switcher">
          <span className="switcher-icon">
            <Layers3 size={19} />
          </span>
          <span>
            <small>YOUR WORKSPACE</small>
            <strong>{organization?.name ?? "Your clubs"}</strong>
          </span>
          <ChevronDown size={16} />
        </Link>
        <div className="nav-label">WORKSPACE</div>
        <nav className="main-nav" aria-label="Main navigation">
          <NavLink to="/clubs" onClick={close}>
            <Layers3 size={19} />
            Your clubs
          </NavLink>
          {organization && (
            <>
              <NavLink to={`/app/${organization.id}`} end onClick={close}>
                <LayoutDashboard size={19} />
                Overview
              </NavLink>
              <NavLink to={`/app/${organization.id}/events`} onClick={close}>
                <CalendarDays size={19} />
                Events
              </NavLink>
              {organization.role === "admin" ? (
                <>
                  <NavLink
                    to={`/app/${organization.id}/settings`}
                    onClick={close}
                  >
                    <ShieldCheck size={19} />
                    Club settings
                  </NavLink>
                  <NavLink
                    to={`/app/${organization.id}/members`}
                    onClick={close}
                  >
                    <UsersRound size={19} />
                    Members
                  </NavLink>
                </>
              ) : (
                <NavLink
                  to={`/app/${organization.id}/membership`}
                  onClick={close}
                >
                  <ShieldCheck size={19} />
                  My membership
                </NavLink>
              )}
            </>
          )}
          <NavLink to="/profile" onClick={close}>
            <UserRound size={19} />
            My account
          </NavLink>
        </nav>
        <div className="sidebar-note">
          <span className="small-spark">✳</span>
          <p>
            Good things happen
            <br />
            when people come together.
          </p>
          <Link to="/clubs" onClick={close}>
            Find your people <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="sidebar-user">
          <Avatar name={user!.name} />
          <div>
            <strong>{user!.name}</strong>
            <small>{user!.email}</small>
          </div>
          <button
            disabled={busy}
            onClick={() => void signOut()}
            className="icon-button"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={19} />
          </button>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="topbar">
          <div className="topbar-location">
            <button
              className="icon-button mobile-only"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
              aria-expanded={open}
              aria-controls="workspace-nav"
            >
              <Menu size={22} />
            </button>
            <span>Workspace</span>
            <span className="breadcrumb-divider">/</span>
            <strong>{organization?.name ?? "ClubOS"}</strong>
          </div>
          <span className="topbar-label">
            <span />
            Built around your community
          </span>
        </header>
        <main id="main-content" className="page-content" tabIndex={-1}>
          {error && <Notice>{error}</Notice>}
          <Outlet />
        </main>
        <footer className="workspace-footer">
          <span>ClubOS · A little less admin. A lot more club.</span>
          <span>
            Made for student communities <span aria-hidden="true">↗</span>
          </span>
        </footer>
      </div>
    </div>
  );
}
