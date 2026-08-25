/**
 * Paid offer catalogue.
 *
 * Deliberately data-driven so additional country mentors/offers can be added
 * later (new entry + a route that reads it) without rewriting the booking or
 * payment flow. `provider` and `revenueSharePct` exist so a mentor marketplace
 * can be layered on top later — nothing here assumes a single provider.
 */

export interface OfferProvider {
  slug: string;
  /** Public-facing name. Keep factual; never invent credentials. */
  name: string;
  /** One line describing the basis of their guidance (lived experience, etc). */
  basis: string;
  /** Share of revenue paid to the provider, 0–100. Internal config only. */
  revenueSharePct: number;
}

export interface Offer {
  slug: string;
  /** Route the offer is sold on. */
  path: string;
  country: string;
  name: string;
  tagline: string;
  priceCents: number;
  currency: "usd";
  durationMinutes: number;
  provider: OfferProvider;
  /** Short benefit summary used on cards. */
  summary: string;
  /** Who the call is genuinely useful for. */
  forWho: string[];
  /** What the session covers. */
  covers: { title: string; body: string }[];
  /** Explicit exclusions — regulated advice we do not provide. */
  excludes: string[];
  /** Everything included in the price. */
  includes: string[];
  faq: { q: string; a: string }[];
}

export function formatOfferPrice(offer: Offer): string {
  const amount = offer.priceCents / 100;
  const formatted = Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);
  return `US$${formatted}`;
}

export const THAILAND_CALL: Offer = {
  slug: "thailand-planning-call",
  path: "/thailand-call",
  country: "Thailand",
  name: "Thailand Retirement Planning Call",
  tagline: "A practical 60 minutes on what living in Thailand would actually cost and feel like.",
  priceCents: 14900,
  currency: "usd",
  durationMinutes: 60,
  provider: {
    slug: "founder",
    name: "the founder of Retire Abroad Navigator",
    basis: "Lived experience and hands-on relocation research — not regulated professional advice.",
    revenueSharePct: 0,
  },
  summary:
    "One-to-one video call covering locations, budgets, housing, healthcare questions, visa pathways to investigate and the trade-offs nobody mentions — plus a personalised next-step checklist afterwards.",
  forWho: [
    "Thailand is on your shortlist and you want a candid reality check before committing time or money",
    "You want a realistic monthly budget and housing expectation, not a highlight reel",
    "You'd rather know the downsides now than discover them after arriving",
    "You want a clear list of what to verify, and with whom, before you move",
  ],
  covers: [
    {
      title: "Which Thailand locations may fit you",
      body: "Bangkok, Chiang Mai, coastal and quieter options weighed against your priorities — pace, climate, healthcare proximity and community.",
    },
    {
      title: "Realistic monthly budget & housing",
      body: "What rent, utilities, food, transport and discretionary spending actually look like at different lifestyle levels, and where budgets usually slip.",
    },
    {
      title: "Healthcare options & questions to investigate",
      body: "How people typically approach hospitals and insurance locally, and the specific questions to put to insurers and clinicians yourself.",
    },
    {
      title: "Visa pathways to investigate",
      body: "General information on the routes long-stay residents commonly look at, clearly framed as a starting point requiring independent verification with official sources or a licensed professional.",
    },
    {
      title: "Banking, transport & day-to-day setup",
      body: "Accounts and money transfers, SIMs and connectivity, getting around, and the practical admin of your first few months.",
    },
    {
      title: "Major trade-offs and downsides",
      body: "Heat and air quality, language, bureaucracy, distance from family, and the things people most often underestimate.",
    },
    {
      title: "Concrete next steps before moving",
      body: "What to do first, what can wait, and how to structure a scouting trip so it answers your real questions.",
    },
  ],
  excludes: [
    "Legal or immigration advice, visa applications, or representation",
    "Tax advice or residency/tax structuring for your situation",
    "Financial, investment, pension or insurance advice or product recommendations",
    "Medical advice or treatment recommendations",
    "Any guarantee of a visa outcome, cost, or approval",
  ],
  includes: [
    "60-minute one-to-one video call",
    "Time reserved to work through your specific questions",
    "A short personalised next-step checklist sent after the call",
    "Plain-English pointers on what to verify independently, and with whom",
  ],
  faq: [
    {
      q: "Who delivers the call?",
      a: "Calls are delivered personally by the founder of Retire Abroad Navigator, based on lived experience and hands-on relocation research. This is practical planning guidance, not regulated professional advice.",
    },
    {
      q: "Do I need to do the free assessment first?",
      a: "No, but it helps. The free assessment is unaffected by this offer and your results are never hidden behind payment.",
    },
    {
      q: "How is the call scheduled?",
      a: "You share your timezone and preferred windows, and we confirm a time with you by email. There is no automated calendar booking yet.",
    },
    {
      q: "Will you tell me which visa to apply for?",
      a: "No. We can talk through the routes people commonly investigate and what to ask about, but every application must be verified with official sources or a licensed professional.",
    },
  ],
};

/* ------------------------------------------------------------------ *
 * Country expert requests
 *
 * A lightweight marketplace precursor: users can register interest in a
 * one-to-one call with an experienced resident of a given country. Where we
 * have not yet confirmed an expert we say so plainly and match one before any
 * booking or payment is taken.
 * ------------------------------------------------------------------ */

export interface ExpertCountry {
  /** URL slug used at /experts/<slug>. */
  slug: string;
  country: string;
  emoji: string;
  /** True only when a named, confirmed expert already delivers this call. */
  expertConfirmed: boolean;
  /** Existing offer page to use instead of the generic request flow. */
  offerPath?: string;
  /** Short line about what a resident of this country can help with. */
  blurb: string;
  priceCents?: number;
  durationMinutes?: number;
  /** Share of revenue earmarked for the matched expert. */
  revenueSharePct?: number;
}

/** Defaults for every expert call; override per country above. */
export const EXPERT_OFFER_DEFAULTS = {
  priceCents: 14900,
  currency: "usd" as const,
  durationMinutes: 60,
  revenueSharePct: 50,
};

export const EXPERT_COUNTRIES: ExpertCountry[] = [
  {
    slug: "thailand",
    country: "Thailand",
    emoji: "🇹🇭",
    expertConfirmed: true,
    offerPath: THAILAND_CALL.path,
    revenueSharePct: 0,
    blurb: "Costs, locations, healthcare questions and the visa routes to investigate.",
  },
  {
    slug: "portugal",
    country: "Portugal",
    emoji: "🇵🇹",
    expertConfirmed: false,
    blurb: "Coastal vs inland living, rental reality, and the paperwork rhythm of residency.",
  },
  {
    slug: "spain",
    country: "Spain",
    emoji: "🇪🇸",
    expertConfirmed: false,
    blurb: "Regional differences, consulate-stage requirements and true monthly costs.",
  },
  {
    slug: "malaysia",
    country: "Malaysia",
    emoji: "🇲🇾",
    expertConfirmed: false,
    blurb: "Kuala Lumpur vs Penang, English-speaking daily life and healthcare access.",
  },
  {
    slug: "mexico",
    country: "Mexico",
    emoji: "🇲🇽",
    expertConfirmed: false,
    blurb: "Highland towns vs coast, safety in practice and cost of a comfortable month.",
  },
  {
    slug: "costa-rica",
    country: "Costa Rica",
    emoji: "🇨🇷",
    expertConfirmed: false,
    blurb: "Central Valley vs beach towns, import costs and healthcare in the regions.",
  },
  {
    slug: "panama",
    country: "Panama",
    emoji: "🇵🇦",
    expertConfirmed: false,
    blurb: "City vs highlands, banking, and what daily life actually costs.",
  },
  {
    slug: "vietnam",
    country: "Vietnam",
    emoji: "🇻🇳",
    expertConfirmed: false,
    blurb: "Long-stay practicalities, healthcare choices and the language reality.",
  },
  {
    slug: "greece",
    country: "Greece",
    emoji: "🇬🇷",
    expertConfirmed: false,
    blurb: "Island vs mainland trade-offs, winter realities and admin patience required.",
  },
  {
    slug: "italy",
    country: "Italy",
    emoji: "🇮🇹",
    expertConfirmed: false,
    blurb: "North vs south costs, healthcare registration and the bureaucracy learning curve.",
  },
];

export function expertCountryBySlug(slug: string): ExpertCountry | undefined {
  return EXPERT_COUNTRIES.find((c) => c.slug === slug);
}

export function expertCountryForCountry(country: string): ExpertCountry | undefined {
  return EXPERT_COUNTRIES.find((c) => c.country.toLowerCase() === country.toLowerCase());
}

/** Slug used to store an expert request in the bookings table. */
export function expertOfferSlug(config: ExpertCountry): string {
  return `expert-call-${config.slug}`;
}

/** Builds a generic Offer shape for a country expert call. */
export function expertOffer(config: ExpertCountry): Offer {
  const priceCents = config.priceCents ?? EXPERT_OFFER_DEFAULTS.priceCents;
  const durationMinutes = config.durationMinutes ?? EXPERT_OFFER_DEFAULTS.durationMinutes;
  const revenueSharePct = config.revenueSharePct ?? EXPERT_OFFER_DEFAULTS.revenueSharePct;
  return {
    slug: expertOfferSlug(config),
    path: `/experts/${config.slug}`,
    country: config.country,
    name: `${config.country} Local Expert Call`,
    tagline: `A practical ${durationMinutes} minutes with someone who actually lives there.`,
    priceCents,
    currency: EXPERT_OFFER_DEFAULTS.currency,
    durationMinutes,
    provider: {
      slug: config.expertConfirmed ? config.slug : "unassigned",
      name: config.expertConfirmed ? `${config.country} resident expert` : "To be confirmed",
      basis: "Lived experience as a long-term resident — not regulated professional advice.",
      revenueSharePct,
    },
    summary: config.blurb,
    forWho: [],
    covers: [],
    excludes: THAILAND_CALL.excludes,
    includes: [],
    faq: [],
  };
}

export const OFFERS: Offer[] = [THAILAND_CALL, ...EXPERT_COUNTRIES.filter((c) => !c.offerPath).map(expertOffer)];

export function offerBySlug(slug: string): Offer | undefined {
  return OFFERS.find((offer) => offer.slug === slug);
}

/** Offer relevant to a destination country, if one exists. */
export function offerForCountry(country: string): Offer | undefined {
  return OFFERS.find((offer) => offer.country.toLowerCase() === country.toLowerCase());
}

