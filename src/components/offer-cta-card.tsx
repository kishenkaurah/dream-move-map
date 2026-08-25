import { Link } from "@tanstack/react-router";
import { ArrowRight, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatOfferPrice, type Offer } from "@/data/offers";
import { track, type AnalyticsEvent } from "@/lib/analytics";

/**
 * Compact promotion for a paid planning call. Used on the results page (only
 * when the offer's country is genuinely in the shortlist) and on the homepage.
 */
export function OfferCtaCard({
  offer,
  placement,
  note,
  event = "thailand_call_cta_clicked",
  ctaLabel = "See what the call covers",
}: {
  offer: Offer;
  placement: string;
  note?: string;
  event?: AnalyticsEvent;
  ctaLabel?: string;
}) {
  return (
    <Card className="border-primary/30 bg-primary/5 shadow-[var(--shadow-card)]">
      <CardContent className="pt-6">
        <p className="eyebrow">Optional paid session</p>
        <h2 className="display mt-2 text-xl">{offer.name}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{offer.summary}</p>
        {note && <p className="mt-2 text-sm text-muted-foreground">{note}</p>}
        <p className="mt-4 text-sm font-medium">
          {formatOfferPrice(offer)} · {offer.durationMinutes} minutes · one-to-one video call
        </p>
        <div className="mt-5">
          <Button asChild>
            <Link
              to={offer.path}
              onClick={() =>
                track(event, { placement, offerSlug: offer.slug, country: offer.country })
              }
            >
              <PhoneCall aria-hidden="true" />
              {ctaLabel}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Your free assessment stays free — this is entirely optional, and the call is practical
          planning guidance, not legal, tax, financial or medical advice.
        </p>
      </CardContent>
    </Card>
  );
}
