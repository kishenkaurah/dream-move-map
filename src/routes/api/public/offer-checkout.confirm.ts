import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const schema = z.object({ sessionId: z.string().trim().min(10).max(200) });

/**
 * Verifies a returning Stripe Checkout session server-side and records the
 * payment result. The confirmation page never decides payment status itself.
 */
export const Route = createFileRoute("/api/public/offer-checkout/confirm")({
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

        const stripeKey = process.env["STRIPE_SECRET_KEY"];
        if (!stripeKey) return json({ status: "unpaid" });

        const res = await fetch(
          `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(parsed.data.sessionId)}`,
          { headers: { Authorization: `Bearer ${stripeKey}` } },
        );
        const session = (await res.json()) as {
          id?: string;
          payment_status?: string;
          client_reference_id?: string;
        };

        if (!res.ok || !session.id) return json({ status: "unpaid" });

        const paid = session.payment_status === "paid";
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await supabaseAdmin
          .from("consultation_bookings")
          .update({
            status: paid ? "paid" : "awaiting_payment",
            stripe_payment_status: session.payment_status ?? null,
          })
          .eq("stripe_session_id", session.id);

        return json({ status: paid ? "paid" : "unpaid" });
      },
    },
  },
});
