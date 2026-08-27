/**
 * Server-only owner notifications for new bookings / expert requests.
 *
 * Uses Lovable's managed email sending (already configured for this project via
 * the verified sender domain in src/lib/email-templates/send-email.ts), so no
 * third-party provider key is needed.
 *
 * Required secret: OWNER_NOTIFICATION_EMAIL — the inbox that should receive
 * these alerts. If it is not set, notification is skipped (logged only) and the
 * booking still succeeds.
 */
import { sendTemplateEmail } from "./email-templates/send-email";

export interface OwnerBookingNotification {
  bookingId: string;
  isExpertRequest: boolean;
  country: string;
  offerName: string;
  offerSlug: string;
  status: string;
  providerName: string;
  price: string;
  name: string;
  email: string;
  timezone: string;
  preferredTimes: string;
  helpWith?: string | null;
}

export async function notifyOwnerOfBooking(input: OwnerBookingNotification): Promise<void> {
  const recipient = process.env["OWNER_NOTIFICATION_EMAIL"];
  if (!recipient) {
    console.warn(
      "[notifyOwner] OWNER_NOTIFICATION_EMAIL is not set — skipping owner notification",
      { bookingId: input.bookingId },
    );
    return;
  }

  const subjectPrefix = input.isExpertRequest
    ? "New expert request"
    : "New Retire Abroad booking";

  try {
    await sendTemplateEmail("booking-notification", recipient, {
      idempotencyKey: `booking-notification-${input.bookingId}`,
      replyTo: input.email,
      templateData: {
        subjectPrefix,
        requestType: input.isExpertRequest
          ? `Country expert request — ${input.country}`
          : `${input.country} planning call booking`,
        country: input.country,
        offerName: input.offerName,
        offerSlug: input.offerSlug,
        status: input.status,
        providerName: input.providerName,
        price: input.price,
        name: input.name,
        email: input.email,
        timezone: input.timezone,
        preferredTimes: input.preferredTimes,
        helpWith: input.helpWith ?? null,
        bookingId: input.bookingId,
      },
    });
  } catch (error) {
    // Never fail the booking because notification delivery failed.
    console.error("[notifyOwner] notification failed", {
      bookingId: input.bookingId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
