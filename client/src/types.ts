export interface User {
  id: string;
  name: string;
  email: string;
}
export interface Organization {
  id: string;
  name: string;
  description: string;
  feeCents: number;
  currency: "CAD";
  termDays: number;
  role: "admin" | "member";
  joinCode?: string;
}
export type MembershipStatus = "pending" | "active" | "expired";
export interface Membership {
  id: string;
  joinedAt: string;
  startsAt: string | null;
  expiresAt: string | null;
  status: MembershipStatus;
}
export interface MemberRow extends Membership {
  user: { name: string; email: string };
}
export interface MemberList {
  memberships: MemberRow[];
  pagination: { total: number; page: number; limit: number; pages: number };
}
export interface DashboardCounts {
  total: number;
  active: number;
  expired: number;
  pending: number;
}
