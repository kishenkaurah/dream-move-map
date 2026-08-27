import { createFileRoute } from "@tanstack/react-router";
import { bookingRequestSchema } from "@/lib/booking-schema";
import { offerBySlug, formatOfferPrice } from "@/data/offers";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const Route = createFileRoute("/api/public/bookings")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return json({ error: "Invalid request body" }, 400);
        }

        const parsed = bookingRequestSchema.safeParse(raw);
        if (!parsed.success) {
          return json({ error: "Please check the details you entered." }, 400);
        }

        const { offerSlug, name, email, timezone, preferredTimes, helpWith } = parsed.data;
        const offer = offerBySlug(offerSlug);
        if (!offer) return json({ error: "Unknown offer." }, 400);

        const normalizedEmail = email.toLowerCase();
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Light abuse guard: cap repeat requests from the same address.
        const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { count } = await supabaseAdmin
          .from("consultation_bookings")
          .select("id", { count: "exact", head: true })
          .eq("email", normalizedEmail)
          .gte("created_at", since);

        if ((count ?? 0) >= 5) {
          return json(
            { error: "You've already requested this a few times. We'll be in touch by email." },
            429,
          );
        }

        const { data: booking, error } = await supabaseAdmin
          .from("consultation_bookings")
          .insert({
            offer_slug: offer.slug,
            country: offer.country,
            provider_slug: offer.provider.slug,
            provider_name: offer.provider.name,
            price_cents: offer.priceCents,
            currency: offer.currency,
            duration_minutes: offer.durationMinutes,
            revenue_share_pct: offer.provider.revenueSharePct,
            // No confirmed provider yet => we must match an expert before payment.
            status: offer.provider.slug === "unassigned" ? "matching" : "interest",
            name,
            email: normalizedEmail,
            timezone,
            preferred_times: preferredTimes,
            help_with: helpWith ?? null,
            user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
          })
          .select("id")
          .single();

        if (error || !booking) {
          console.error("[bookings] insert failed", error);
          return json({ error: "We couldn't save your details. Please try again." }, 500);
        }

        // Owner alert. Requires the OWNER_NOTIFICATION_EMAIL secret; failures are
        // logged only and never affect the saved booking.
        try {
          const { notifyOwnerOfBooking } = await import("@/lib/notify-owner.server");
          await notifyOwnerOfBooking({
            bookingId: booking.id,
            isExpertRequest: offer.provider.slug === "unassigned",
            country: offer.country,
            offerName: offer.name,
            offerSlug: offer.slug,
            status: offer.provider.slug === "unassigned" ? "matching" : "interest",
            providerName: offer.provider.name,
            price: formatOfferPrice(offer),
            name,
            email: normalizedEmail,
            timezone,
            preferredTimes,
            helpWith: helpWith ?? null,
          });
        } catch (notifyError) {
          console.error("[bookings] owner notification failed", notifyError);
        }

        return json({ id: booking.id });
      },
    },
  },
});
