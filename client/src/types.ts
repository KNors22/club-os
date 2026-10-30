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
  payments?: Payment[];
}
export interface Payment {
  id: string;
  requestId: string;
  amountCents: number;
  method: "cash" | "e-transfer" | "other";
  reference: string;
  paidAt: string;
  recordedAt: string;
  periodStart: string;
  periodEnd: string;
}
export interface NotificationResult {
  status: "sent" | "failed" | "disabled" | "skipped";
  message: string;
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
export interface ClubEvent {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  location: string;
  capacity: number;
  registrationCount: number;
  attendanceCount: number;
  registration: {
    registrationId: string;
    registeredAt: string;
    checkedInAt: string | null;
  } | null;
}
export interface Participant {
  membershipId: string;
  name: string;
  email: string;
  registeredAt: string;
  checkedInAt: string | null;
}
export interface EventList {
  events: ClubEvent[];
  pagination: { total: number; page: number; limit: number; pages: number };
}
