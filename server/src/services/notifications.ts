import type { EmailConfig } from "../config.js";
import type { MembershipDocument } from "../models/Membership.js";
import type { OrganizationDocument } from "../models/Organization.js";
import type { EventDocument } from "../models/Event.js";
import { User } from "../models/User.js";

export interface NotificationResult {
  status: "sent" | "failed" | "disabled" | "skipped";
  message: string;
}
export const notificationsDisabled: NotificationResult = {
  status: "disabled",
  message:
    "Email confirmations are not configured. Your changes have been saved.",
};
export const notificationSkipped: NotificationResult = {
  status: "skipped",
  message:
    "This payment was already recorded; no additional confirmation was sent.",
};
function failure(): NotificationResult {
  console.warn(
    "Confirmation delivery could not be confirmed; the club record remains saved.",
  );
  return {
    status: "failed",
    message:
      "Your changes were saved, but email delivery could not be confirmed.",
  };
}

export async function sendConfirmation(
  config: EmailConfig | undefined,
  message: { key: string; subject: string; text: string },
): Promise<NotificationResult> {
  if (!config) return notificationsDisabled;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(config.timeoutMs ?? 5000),
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": message.key,
      },
      // The demo inbox overrides all recipients; member email addresses are never used here.
      body: JSON.stringify({
        from: config.from,
        to: [config.demoTo],
        subject: message.subject.replace(/[\r\n]/g, " "),
        text: message.text,
      }),
    });
    if (!response.ok) return failure();
    const receipt = (await response.json()) as { id?: unknown };
    if (typeof receipt.id !== "string") return failure();
    return { status: "sent", message: "Confirmation sent to the demo inbox." };
  } catch {
    return failure();
  }
}

export async function confirmPayment(
  config: EmailConfig | undefined,
  organization: OrganizationDocument,
  membership: MembershipDocument,
  requestId: string,
): Promise<NotificationResult> {
  if (!config) return notificationsDisabled;
  try {
    const payment = membership.payments.find(
      (item) => item.requestId === requestId,
    );
    if (!payment) return failure();
    const user = await User.findById(membership.userId).select("name");
    return await sendConfirmation(config, {
      key: `membership-payment/${payment._id}`,
      subject: `Membership confirmed: ${organization.name}`,
      text: `Hello ${user?.name ?? "member"},\n\nYour ${(payment.amountCents / 100).toFixed(2)} CAD payment for ${organization.name} is confirmed.\nMembership period: ${payment.periodStart.toISOString()} to ${payment.periodEnd.toISOString()}.\n\nClubOS demo: this confirmation is routed to the configured demo inbox.`,
    });
  } catch {
    return failure();
  }
}

export async function confirmRegistration(
  config: EmailConfig | undefined,
  organization: OrganizationDocument,
  event: EventDocument,
  membership: MembershipDocument,
  registrationId: string,
): Promise<NotificationResult> {
  if (!config) return notificationsDisabled;
  try {
    const user = await User.findById(membership.userId).select("name");
    return await sendConfirmation(config, {
      key: `event-registration/${registrationId}`,
      subject: `Registration confirmed: ${event.title}`,
      text: `Hello ${user?.name ?? "member"},\n\nYou are registered for ${event.title} with ${organization.name}.\nWhen: ${event.startsAt.toISOString()}\nWhere: ${event.location}\n\nClubOS demo: this confirmation is routed to the configured demo inbox.`,
    });
  } catch {
    return failure();
  }
}
