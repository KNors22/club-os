import {
  Navigate,
  Outlet,
  Route,
  Routes,
  Link,
  useLocation,
  useParams,
} from "react-router-dom";
import { useAuth } from "./contexts/auth-context";
import { useClubs, OrganizationContext } from "./contexts/clubs-context";
import { AuthPage } from "./pages/AuthPage";
import { ClubSettingsPage } from "./pages/ClubSettingsPage";
import { ClubsPage } from "./pages/ClubsPage";
import { MembersPage } from "./pages/MembersPage";
import { MemberDetailPage } from "./pages/MemberDetailPage";
import { MembershipPage } from "./pages/MembershipPage";
import { OverviewPage } from "./pages/OverviewPage";
import { ProfilePage } from "./pages/ProfilePage";
import { EventsPage } from "./pages/EventsPage";
import { EventDetailPage } from "./pages/EventDetailPage";
import { WorkspaceLayout } from "./components/WorkspaceLayout";
import { ErrorState, Loading } from "./components/ui";
import { Brand } from "./components/Brand";

function RequireAuth() {
  const { user } = useAuth();
  const location = useLocation();
  return user ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from: location.pathname }} replace />
  );
}

function ClubBoundary() {
  const { orgId } = useParams();
  const clubs = useClubs();
  if (clubs.loading) return <Loading />;
  if (clubs.error)
    return <ErrorState message={clubs.error} retry={clubs.reload} />;
  const organization = clubs.organizations.find((club) => club.id === orgId);
  if (!organization)
    return (
      <div className="empty-state">
        <h1>This club isn't available.</h1>
        <p>Choose one of your clubs to continue.</p>
        <Link to="/clubs" className="button button-primary">
          Back to your clubs
        </Link>
      </div>
    );
  return (
    <OrganizationContext.Provider value={organization}>
      <Outlet />
    </OrganizationContext.Provider>
  );
}

export function App() {
  const auth = useAuth();
  if (auth.loading)
    return (
      <div className="full-screen-state">
        <Brand />
        <Loading label="Making yourself at home…" />
      </div>
    );
  if (auth.error)
    return (
      <div className="full-screen-state">
        <Brand />
        <ErrorState message={auth.error} retry={auth.retry} />
      </div>
    );
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<AuthPage register />} />
      <Route element={<RequireAuth />}>
        <Route element={<WorkspaceLayout />}>
          <Route path="/clubs" element={<ClubsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/app/:orgId" element={<ClubBoundary />}>
            <Route index element={<OverviewPage />} />
            <Route path="settings" element={<ClubSettingsPage />} />
            <Route path="members" element={<MembersPage />} />
            <Route
              path="members/:membershipId"
              element={<MemberDetailPage />}
            />
            <Route path="membership" element={<MembershipPage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="events/:eventId" element={<EventDetailPage />} />
          </Route>
        </Route>
      </Route>
      <Route
        path="/"
        element={<Navigate to={auth.user ? "/clubs" : "/login"} replace />}
      />
      <Route
        path="*"
        element={
          <div className="full-screen-state">
            <Brand />
            <h1>Looks like a wrong turn.</h1>
            <p>Let's get you back to your community.</p>
            <Link to="/clubs" className="button button-primary">
              Back to ClubOS
            </Link>
          </div>
        }
      />
    </Routes>
  );
}
