import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { BookingRequestForm } from "@/components/booking-request-form";
import { formatOfferPrice, THAILAND_CALL } from "@/data/offers";
import { track } from "@/lib/analytics";

const offer = THAILAND_CALL;

export const Route = createFileRoute("/thailand-call/")({
  head: () => ({
    meta: [
      { title: "Thailand Retirement Planning Call | Retire Abroad Navigator" },
      {
        name: "description",
        content:
          "A practical 60-minute one-to-one call on retiring in Thailand: realistic budgets, locations, healthcare questions, visa routes to investigate and a personalised next-step checklist.",
      },
      { property: "og:title", content: "Thailand Retirement Planning Call" },
      {
        property: "og:description",
        content:
          "60 minutes of candid, lived-experience planning guidance on retiring in Thailand — plus a personalised next-step checklist.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ThailandCallPage,
});

function ThailandCallPage() {
  useEffect(() => {
    track("thailand_call_viewed", { offerSlug: offer.slug });
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader
        action={
          <Button asChild variant="ghost" size="sm" className="shrink-0">
            <Link to="/">
              <ArrowLeft aria-hidden="true" />
              <span className="hidden sm:inline">Back home</span>
            </Link>
          </Button>
        }
      />

      <main className="flex-1">
        <section className="paper-panel border-b border-border/70">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
            <p className="eyebrow">Optional paid session · 🇹🇭 Thailand</p>
            <h1 className="display mt-3 text-3xl text-balance sm:text-4xl">{offer.name}</h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {offer.tagline}
            </p>
            <p className="mt-6 text-base font-medium">
              {formatOfferPrice(offer)} · {offer.durationMinutes} minutes · one-to-one video call
            </p>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Delivered personally by {offer.provider.name}. {offer.provider.basis}
            </p>
            <div className="mt-6">
              <Button asChild size="lg">
                <a
                  href="#request"
                  onClick={() =>
                    track("thailand_call_cta_clicked", {
                      placement: "sales_hero",
                      offerSlug: offer.slug,
                      country: offer.country,
                    })
                  }
                >
                  Request this call
                </a>
              </Button>
            </div>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
              Your free assessment stays free. This is entirely optional.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <div className="space-y-10">
              <section>
                <h2 className="display text-2xl">What the hour covers</h2>
                <div className="mt-6 grid gap-4">
                  {offer.covers.map((item) => (
                    <Card key={item.title} className="shadow-[var(--shadow-card)]">
                      <CardContent className="pt-6">
                        <h3 className="text-base font-semibold">{item.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {item.body}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="display text-2xl">Who it's for</h2>
                <ul className="mt-4 space-y-2.5">
                  {offer.forWho.map((line) => (
                    <li key={line} className="flex gap-2.5 text-sm leading-relaxed">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="display text-2xl">Common questions</h2>
                <Accordion type="single" collapsible className="mt-4">
                  {offer.faq.map((item, i) => (
                    <AccordionItem key={item.q} value={`faq-${i}`}>
                      <AccordionTrigger className="text-left text-sm">{item.q}</AccordionTrigger>
                      <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            </div>

            <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              <Card className="border-primary/30 bg-primary/5 shadow-[var(--shadow-card)]">
                <CardContent className="pt-6">
                  <h2 className="display text-lg">What's included</h2>
                  <ul className="mt-3 space-y-2">
                    {offer.includes.map((line) => (
                      <li key={line} className="flex gap-2.5 text-sm leading-relaxed">
                        <Check
                          className="mt-0.5 size-4 shrink-0 text-success"
                          aria-hidden="true"
                        />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-destructive/25">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert className="size-4 text-destructive" aria-hidden="true" />
                    <h2 className="display text-lg">What this is not</h2>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    This call is practical, lived-experience planning guidance. It is not:
                  </p>
                  <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                    {offer.excludes.map((line) => (
                      <li key={line}>• {line}</li>
                    ))}
                  </ul>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    Anything that touches visas, tax, money, insurance or health must be verified
                    with official sources or a licensed professional in that field.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <section id="request" className="mt-14 max-w-3xl scroll-mt-24">
            <BookingRequestForm
              offer={offer}
              mode="call"
              title="Request your Thailand planning call"
              description={`Tell us when suits you and what you'd most like covered. Nothing is charged or scheduled until we've agreed a time with you by email.`}
              startedEvent="checkout_started"
              submittedEvent="booking_interest_submitted"
            />
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
