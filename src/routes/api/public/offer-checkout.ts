import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { offerBySlug } from "@/data/offers";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const schema = z.object({
  bookingId: z.string().uuid(),
  origin: z.string().url().max(300),
});

export const Route = createFileRoute("/api/public/offer-checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return json({ error: "Invalid request body" }, 400);
        }

        const parsed = schema.safeParse(raw);
        if (!parsed.success) return json({ error: "Invalid request." }, 400);
        const { bookingId, origin } = parsed.data;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: booking, error } = await supabaseAdmin
          .from("consultation_bookings")
          .select("id, offer_slug, email, status")
          .eq("id", bookingId)
          .single();

        if (error || !booking) return json({ error: "Booking not found." }, 404);

        const offer = offerBySlug(booking.offer_slug);
        if (!offer) return json({ error: "Unknown offer." }, 400);

        const stripeKey = process.env["STRIPE_SECRET_KEY"];
        if (!stripeKey) {
          // Payments aren't connected yet — keep the booking as an interest record.
          return json({ stripeConfigured: false });
        }

        const params = new URLSearchParams();
        params.set("mode", "payment");
        params.set("customer_email", booking.email);
        params.set("client_reference_id", booking.id);
        params.set("success_url", `${origin}${offer.path}/confirmed?session_id={CHECKOUT_SESSION_ID}`);
        params.set("cancel_url", `${origin}${offer.path}?checkout=cancelled`);
        params.set("line_items[0][quantity]", "1");
        params.set("line_items[0][price_data][currency]", offer.currency);
        params.set("line_items[0][price_data][unit_amount]", String(offer.priceCents));
        params.set("line_items[0][price_data][product_data][name]", offer.name);
        params.set(
          "line_items[0][price_data][product_data][description]",
          `${offer.durationMinutes}-minute one-to-one planning call`,
        );
        params.set("metadata[booking_id]", booking.id);
        params.set("metadata[offer_slug]", offer.slug);

        const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${stripeKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        });

        const session = (await res.json()) as {
          id?: string;
          url?: string;
          error?: { message?: string };
        };

        if (!res.ok || !session.url || !session.id) {
          console.error("[offer-checkout] stripe session failed", session.error?.message);
          return json({ error: "We couldn't start checkout. Please try again." }, 502);
        }

        await supabaseAdmin
          .from("consultation_bookings")
          .update({ status: "awaiting_payment", stripe_session_id: session.id })
          .eq("id", booking.id);

        return json({ stripeConfigured: true, url: session.url });
      },
    },
  },
});
