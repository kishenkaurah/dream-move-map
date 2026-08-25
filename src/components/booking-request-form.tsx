import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { bookingRequestSchema } from "@/lib/booking-schema";
import { createBooking, startCheckout } from "@/lib/bookings";
import { formatOfferPrice, type Offer } from "@/data/offers";
import { track, type AnalyticsEvent } from "@/lib/analytics";

function guessTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  } catch {
    return "";
  }
}

/**
 * Collects the details needed to arrange a call. Payment is only attempted for
 * offers with a confirmed provider AND a configured payment processor — we
 * never imply a payment was taken or an appointment confirmed.
 */
export function BookingRequestForm({
  offer,
  mode,
  title,
  description,
  startedEvent,
  submittedEvent,
}: {
  offer: Offer;
  /** "call" attempts checkout; "expert" only registers a matching request. */
  mode: "call" | "expert";
  title: string;
  description: string;
  startedEvent: AnalyticsEvent;
  submittedEvent: AnalyticsEvent;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState(guessTimezone);
  const [preferredTimes, setPreferredTimes] = useState("");
  const [helpWith, setHelpWith] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");
  const [started, setStarted] = useState(false);

  function begin() {
    if (started) return;
    setStarted(true);
    track(startedEvent, { offerSlug: offer.slug, country: offer.country });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = bookingRequestSchema.safeParse({
      offerSlug: offer.slug,
      name,
      email,
      timezone,
      preferredTimes,
      ...(helpWith.trim() ? { helpWith } : {}),
    });
    if (!parsed.success) {
      const fields = parsed.error.flatten().fieldErrors;
      setError(
        fields.name?.[0] ??
          fields.email?.[0] ??
          fields.timezone?.[0] ??
          fields.preferredTimes?.[0] ??
          "Please check the details you entered.",
      );
      return;
    }

    setError(undefined);
    setStatus("saving");
    try {
      const { id } = await createBooking(parsed.data);
      track(submittedEvent, { offerSlug: offer.slug, country: offer.country });

      if (mode === "call") {
        const checkout = await startCheckout(id);
        if (checkout.stripeConfigured && checkout.url) {
          window.location.href = checkout.url;
          return;
        }
      }
      setStatus("done");
    } catch (err) {
      setStatus("idle");
      toast.error("Something went wrong", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  }

  if (status === "done") {
    return (
      <Card className="border-success/30 shadow-[var(--shadow-card)]">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
            <div>
              <h2 className="display text-lg">Request received</h2>
              {mode === "call" ? (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  No payment has been taken and no appointment is confirmed yet. We'll email you
                  to agree a time and confirm the {formatOfferPrice(offer)} fee before anything is
                  scheduled.
                </p>
              ) : (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  No payment has been taken. We'll now look for an experienced {offer.country}{" "}
                  resident who fits what you asked about. Once we've confirmed someone suitable,
                  we'll email you their background and a proposed time — you decide from there.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-[var(--shadow-card)]">
      <CardHeader>
        <CardTitle className="display text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="grid gap-4" onChange={begin}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="booking-name">Your name</Label>
              <Input
                id="booking-name"
                value={name}
                maxLength={100}
                autoComplete="name"
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="booking-email">Email</Label>
              <Input
                id="booking-email"
                type="email"
                value={email}
                maxLength={255}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-1.5 sm:max-w-md">
            <Label htmlFor="booking-timezone">Your timezone</Label>
            <Input
              id="booking-timezone"
              value={timezone}
              maxLength={80}
              placeholder="e.g. Europe/London"
              onChange={(e) => setTimezone(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="booking-times">Preferred availability</Label>
            <Textarea
              id="booking-times"
              value={preferredTimes}
              maxLength={500}
              rows={2}
              placeholder="e.g. weekday mornings, or Tue/Thu after 6pm"
              onChange={(e) => setPreferredTimes(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="booking-help">What would you like help with? (optional)</Label>
            <Textarea
              id="booking-help"
              value={helpWith}
              maxLength={1000}
              rows={4}
              placeholder="The questions you most want answered about living there."
              onChange={(e) => setHelpWith(e.target.value)}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <div>
            <Button type="submit" size="lg" disabled={status === "saving"}>
              <Send aria-hidden="true" />
              {status === "saving" ? "Sending…" : "Send my request"}
            </Button>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Sending this doesn't book or pay for anything. We only use your details to arrange the
            call and will confirm everything by email first.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
