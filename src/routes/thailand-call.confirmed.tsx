import { useEffect, useState } from "react";
import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { confirmCheckout } from "@/lib/bookings";
import { THAILAND_CALL, formatOfferPrice } from "@/data/offers";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/thailand-call/confirmed")({
  validateSearch: (search: Record<string, unknown>) => ({
    session_id: typeof search["session_id"] === "string" ? search["session_id"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Your Thailand Planning Call | Retire Abroad Navigator" },
      {
        name: "description",
        content: "Confirmation and next steps for your Thailand retirement planning call.",
      },
      { property: "og:title", content: "Your Thailand Planning Call" },
      {
        property: "og:description",
        content: "Confirmation and next steps for your Thailand retirement planning call.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConfirmedPage,
});

function ConfirmedPage() {
  const { session_id: sessionId } = useSearch({ from: "/thailand-call/confirmed" });
  const [status, setStatus] = useState<"checking" | "paid" | "unpaid">(
    sessionId ? "checking" : "unpaid",
  );

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    void confirmCheckout(sessionId).then((result) => {
      if (cancelled) return;
      const paid = result.status === "paid";
      setStatus(paid ? "paid" : "unpaid");
      if (paid) track("booking_confirmed", { offerSlug: THAILAND_CALL.slug, country: "Thailand" });
    });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16 sm:px-6">
        <Card className="shadow-[var(--shadow-card)]">
          <CardContent className="pt-6">
            {status === "checking" ? (
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div>
                  <h1 className="display text-2xl">Checking your payment…</h1>
                  <p className="mt-2 text-muted-foreground">This only takes a moment.</p>
                </div>
              </div>
            ) : status === "paid" ? (
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
                <div>
                  <h1 className="display text-2xl">Payment received</h1>
                  <p className="mt-3 leading-relaxed text-muted-foreground">
                    Thank you — your {formatOfferPrice(THAILAND_CALL)}{" "}
                    {THAILAND_CALL.durationMinutes}-minute Thailand planning call is paid for.
                    We'll email you within one working day to agree a time from the availability
                    you gave us.
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="display text-2xl">Request received</h1>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  No payment has been taken and no appointment is confirmed yet. We'll email you to
                  agree a time and confirm the {formatOfferPrice(THAILAND_CALL)} fee before
                  anything is scheduled.
                </p>
              </div>
            )}

            <div className="mt-8 rounded-xl border border-border bg-secondary/40 p-5">
              <h2 className="display text-lg">What happens next</h2>
              <ol className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
                <li>1. We email you to agree a time that works in your timezone.</li>
                <li>
                  2. Before the call, jot down your must-answer questions — budget, location,
                  healthcare and timing are the usual four.
                </li>
                <li>
                  3. On the call we work through your situation for{" "}
                  {THAILAND_CALL.durationMinutes} minutes.
                </li>
                <li>
                  4. Afterwards you get a personalised next-step checklist: what to verify, in what
                  order, and with which official source or licensed professional.
                </li>
              </ol>
            </div>

            <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
              This call is practical planning guidance based on lived experience. It is not legal,
              immigration, tax, financial, insurance or medical advice.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="outline">
                <Link to="/">Back home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
