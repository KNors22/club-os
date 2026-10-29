import { useState, type ReactNode } from "react";
import { useAuth } from "./auth-context";
import { ClubsContext } from "./clubs-context";
import { useResource } from "../hooks/useResource";
import type { Organization } from "../types";

export function ClubsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  // Key by account as well as URL so another account never receives cached club data.
  const resource = useResource<{ organizations: Organization[] }>(
    user ? `/organizations?account=${encodeURIComponent(user.id)}` : null,
  );
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    try {
      return localStorage.getItem("clubos:club");
    } catch {
      return null;
    }
  });
  const organizations = resource.data?.organizations ?? [];
  const selectedOrganization =
    organizations.find((organization) => organization.id === selectedId) ??
    organizations[0] ??
    null;
  return (
    <ClubsContext.Provider
      value={{
        organizations,
        selectedOrganization,
        loading: resource.loading,
        error: resource.error,
        reload: resource.reload,
        selectOrganization: (id) => {
          setSelectedId(id);
          try {
            localStorage.setItem("clubos:club", id);
          } catch {
            /* Storage is optional. */
          }
        },
      }}
    >
      {children}
    </ClubsContext.Provider>
  );
}
