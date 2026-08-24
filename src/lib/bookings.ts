/**
 * Client helpers for the paid planning-call flow.
 *
 * Booking details are persisted server-side first, then we attempt checkout.
 * If payments are not connected yet the booking is kept as an interest record —
 * we never fake a successful payment.
 */
import type { BookingRequestInput } from "./booking-schema";

export interface CreateBookingResult {
  id: string;
}

export interface CheckoutResult {
  /** True when a real payment session was created. */
  stripeConfigured: boolean;
  url?: string;
}

export async function createBooking(input: BookingRequestInput): Promise<CreateBookingResult> {
  const res = await fetch("/api/public/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  let body: { id?: string; error?: string } = {};
  try {
    body = (await res.json()) as typeof body;
  } catch {
    /* non-JSON response */
  }

  if (!res.ok || !body.id) {
    throw new Error(body.error ?? "We couldn't save your details. Please try again.");
  }
  return { id: body.id };
}

export async function startCheckout(bookingId: string): Promise<CheckoutResult> {
  const res = await fetch("/api/public/offer-checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookingId, origin: window.location.origin }),
  });

  let body: { stripeConfigured?: boolean; url?: string; error?: string } = {};
  try {
    body = (await res.json()) as typeof body;
  } catch {
    /* non-JSON response */
  }

  if (!res.ok) throw new Error(body.error ?? "We couldn't start checkout. Please try again.");

  return {
    stripeConfigured: Boolean(body.stripeConfigured),
    ...(body.url ? { url: body.url } : {}),
  };
}

/** Confirms a returning Stripe Checkout session and marks the booking paid. */
export async function confirmCheckout(
  sessionId: string,
): Promise<{ status: "paid" | "unpaid" | "unknown" }> {
  const res = await fetch("/api/public/offer-checkout/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });
  if (!res.ok) return { status: "unknown" };
  try {
    const body = (await res.json()) as { status?: "paid" | "unpaid" };
    return { status: body.status ?? "unknown" };
  } catch {
    return { status: "unknown" };
  }
}
