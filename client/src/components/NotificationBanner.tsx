import { useResource } from "../hooks/useResource";
import { Notice } from "./ui";

export function NotificationBanner() {
  const resource = useResource<{
    notifications: { mode: "demo" | "disabled" };
  }>("/config");
  const mode = resource.data?.notifications?.mode;
  if (!mode) return null;
  return (
    <div className="notification-banner">
      <Notice tone="info">
        {mode === "demo"
          ? "Email demo: confirmations are sent to the project demo inbox."
          : "Email confirmations are unavailable. Membership and event changes still save."}
      </Notice>
    </div>
  );
}
