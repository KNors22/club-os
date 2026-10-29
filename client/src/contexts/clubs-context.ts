import { createContext, useContext } from "react";
import type { Organization } from "../types";

export interface ClubsState {
  organizations: Organization[];
  selectedOrganization: Organization | null;
  loading: boolean;
  error: string;
  reload: () => void;
  selectOrganization: (id: string) => void;
}
export const ClubsContext = createContext<ClubsState | null>(null);
export function useClubs() {
  const context = useContext(ClubsContext);
  if (!context) throw new Error("ClubsProvider is required");
  return context;
}
export const OrganizationContext = createContext<Organization | null>(null);
export function useOrganization() {
  const organization = useContext(OrganizationContext);
  if (!organization) throw new Error("OrganizationContext is required");
  return organization;
}
