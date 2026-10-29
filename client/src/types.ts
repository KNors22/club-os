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
