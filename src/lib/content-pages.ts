/**
 * SEO CONTENT PAGE REGISTRY
 * -------------------------
 * Single source of truth for the long-form guide/comparison pages so that
 * internal linking, the footer resources area and the sitemap all stay in
 * sync. Add a page here when you add a new route under /retire, /compare
 * or /guides.
 */

export interface ContentPage {
  /** Route path, also used verbatim in the sitemap and canonical tags */
  path:
    | "/retire/thailand"
    | "/retire/thailand/2000-a-month"
    | "/compare/chiang-mai-vs-hua-hin"
    | "/compare/thailand-vs-malaysia"
    | "/guides/retire-abroad-on-2000-a-month";
  /** Short label used in navigation and related-reading cards */
  label: string;
  /** One-line description used in related-reading cards */
  blurb: string;
}

export const SITE_ORIGIN = "https://retireabroad.me";

export const CONTENT_PAGES: ContentPage[] = [
  {
    path: "/retire/thailand",
    label: "Retiring in Thailand",
    blurb:
      "Budgets, best cities, healthcare and the retirement visa routes, with the honest compromises.",
  },
  {
    path: "/retire/thailand/2000-a-month",
    label: "Thailand on $2,000 a month",
    blurb:
      "What a $2,000 monthly budget realistically covers in Chiang Mai, Hua Hin, Bangkok and Phuket.",
  },
  {
    path: "/compare/chiang-mai-vs-hua-hin",
    label: "Chiang Mai vs Hua Hin",
    blurb: "Mountains or beach: cost, air quality, healthcare access and who each town suits.",
  },
  {
    path: "/compare/thailand-vs-malaysia",
    label: "Thailand vs Malaysia",
    blurb: "Cost, long-stay pathways, healthcare, language and infrastructure side by side.",
  },
  {
    path: "/guides/retire-abroad-on-2000-a-month",
    label: "Retire abroad on $2,000 a month",
    blurb: "A shortlist of destinations where a $2,000 budget is genuinely workable — and where it isn't.",
  },
];

export function relatedPages(currentPath: ContentPage["path"], limit = 3): ContentPage[] {
  return CONTENT_PAGES.filter((p) => p.path !== currentPath).slice(0, limit);
}

/** Builds the standard head() meta block for a content page. */
export function contentHead(opts: {
  path: ContentPage["path"];
  title: string;
  description: string;
}) {
  const url = `${SITE_ORIGIN}${opts.path}`;
  return {
    meta: [
      { title: opts.title },
      { name: "description", content: opts.description },
      { property: "og:title", content: opts.title },
      { property: "og:description", content: opts.description },
      { property: "og:type", content: "article" },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

export interface FaqItem {
  q: string;
  a: string;
}

/** Article + optional FAQPage JSON-LD for a content page. */
export function contentJsonLd(opts: {
  path: ContentPage["path"];
  title: string;
  description: string;
  faqs?: FaqItem[];
}) {
  const url = `${SITE_ORIGIN}${opts.path}`;
  const scripts = [
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: opts.title,
        description: opts.description,
        mainEntityOfPage: url,
        publisher: { "@type": "Organization", name: "Retire Abroad Navigator", url: SITE_ORIGIN },
      }),
    },
  ];
  if (opts.faqs?.length) {
    scripts.push({
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: opts.faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }),
    });
  }
  return scripts;
}
