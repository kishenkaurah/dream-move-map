import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { EXPERT_COUNTRIES } from "@/data/offers";

export const Route = createFileRoute("/experts/")({
  head: () => ({
    meta: [
      { title: "Talk to Someone Who Lives There | Retire Abroad Navigator" },
      {
        name: "description",
        content:
          "Request a one-to-one call with an experienced resident in ten popular retirement countries. We source and confirm a suitable expert before anything is paid or booked.",
      },
      { property: "og:title", content: "Talk to Someone Who Actually Lives There" },
      {
        property: "og:description",
        content:
          "Request a call with an experienced resident in ten popular retirement countries — no payment until an expert is matched.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExpertsIndex,
});

function ExpertsIndex() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="paper-panel border-b border-border/70">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
            <p className="eyebrow">Optional paid session</p>
            <h1 className="display mt-3 text-3xl text-balance sm:text-4xl">
              Talk to someone who actually lives there
            </h1>
            <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
              Your free assessment narrows the map. A conversation with an experienced resident
              tells you what daily life is really like. Choose a country and tell us what you want
              help with — for most countries we source and confirm a suitable person first, and you
              pay nothing until they're matched and you've agreed a time.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {EXPERT_COUNTRIES.map((c) => (
              <Card key={c.slug} className="h-full shadow-[var(--shadow-card)]">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2.5">
                    <span aria-hidden="true" className="text-xl">
                      {c.emoji}
                    </span>
                    <h2 className="text-base font-semibold">{c.country}</h2>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.blurb}</p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {c.expertConfirmed
                      ? "Available now"
                      : "No expert confirmed yet — request a match"}
                  </p>
                  <Link
                    to={c.offerPath ?? "/experts/$country"}
                    {...(c.offerPath ? {} : { params: { country: c.slug } })}
                    className="focus-ring mt-4 inline-flex items-center gap-1.5 rounded-md text-sm font-medium underline underline-offset-4"
                  >
                    {c.expertConfirmed ? "See the call" : "Request an expert"}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
