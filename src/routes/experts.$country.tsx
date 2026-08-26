import { useEffect } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { BookingRequestForm } from "@/components/booking-request-form";
import { expertCountryBySlug, expertOffer, formatOfferPrice } from "@/data/offers";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/experts/$country")({
  loader: ({ params }) => {
    const config = expertCountryBySlug(params.country);
    if (!config) throw notFound();
    return { config };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Country not found | Retire Abroad Navigator" }, { name: "robots", content: "noindex" }],
      };
    }
    const { country } = loaderData.config;
    const title = `Talk to an Experienced ${country} Resident | Retire Abroad Navigator`;
    const description = `Request a one-to-one call with an experienced resident of ${country}. We source and confirm a suitable expert before any payment or booking.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: CountryNotFound,
  errorComponent: CountryNotFound,
  component: ExpertRequestPage,
});

function CountryNotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-20 sm:px-6">
        <h1 className="display text-2xl">We don't cover that country yet</h1>
        <p className="mt-3 text-muted-foreground">
          Pick one of the countries we currently source experts for.
        </p>
        <Button asChild className="mt-6">
          <Link to="/experts">See the country list</Link>
        </Button>
      </main>
      <SiteFooter />
    </div>
  );
}

function ExpertRequestPage() {
  const { config } = Route.useLoaderData();
  const offer = expertOffer(config);

  useEffect(() => {
    track("expert_request_viewed", { country: config.country, offerSlug: offer.slug });
  }, [config.country, offer.slug]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader
        action={
          <Button asChild variant="ghost" size="sm" className="shrink-0">
            <Link to="/experts">
              <ArrowLeft aria-hidden="true" />
              <span className="hidden sm:inline">All countries</span>
            </Link>
          </Button>
        }
      />

      <main className="flex-1">
        <section className="paper-panel border-b border-border/70">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
            <p className="eyebrow">
              <span aria-hidden="true">{config.emoji}</span> {config.country} · expert match request
            </p>
            <h1 className="display mt-3 text-3xl text-balance sm:text-4xl">
              Talk to someone who actually lives in {config.country}
            </h1>
            <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">{config.blurb}</p>
            <p className="mt-6 text-base font-medium">
              Indicative price {formatOfferPrice(offer)} · {offer.durationMinutes} minutes ·
              one-to-one video call
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <h2 className="display text-lg">
                    We haven't confirmed a {config.country} expert yet
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    We're being straight with you: there is no {config.country} expert on our books
                    today. Tell us what you need and Retire Abroad Navigator will source and
                    confirm a suitable experienced resident or retiree. You pay nothing now, and we
                    only ask for payment once someone is matched, you've seen their background, and
                    you've agreed a time. If we can't find the right person, we'll tell you.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              "Real monthly costs and where budgets slip",
              "Which areas suit your pace and climate preferences",
              "How residents actually handle healthcare locally",
              "The admin and bureaucracy to expect",
            ].map((line) => (
              <p key={line} className="flex gap-2.5 text-sm leading-relaxed">
                <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                <span>{line}</span>
              </p>
            ))}
          </div>

          <div className="mt-10">
            <BookingRequestForm
              offer={offer}
              mode="expert"
              title={`Request a ${config.country} expert match`}
              description="Share your timezone, when you're usually free, and what you'd most like to ask. Nothing is charged or booked by sending this."
              startedEvent="expert_request_started"
              submittedEvent="expert_request_submitted"
            />
          </div>

          <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
            These calls are practical, lived-experience planning conversations. They are not legal,
            immigration, tax, financial, insurance or medical advice, and anything in those areas
            must be verified with official sources or a licensed professional.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
