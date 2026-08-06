/**
 * VISA ROUTE CONFIGURATION
 * ------------------------
 * Indicative residency routes per country, including digital nomad / remote
 * worker visas for people moving before traditional retirement age.
 *
 * Everything here is educational and changes often — always verify with the
 * relevant consulate before acting.
 */

export type VisaRouteType = "retirement" | "passive_income" | "digital_nomad" | "investment";

export interface VisaRoute {
  id: string;
  name: string;
  type: VisaRouteType;
  /** Indicative monthly income commonly referenced, in USD */
  incomeGuide: number;
  minAge?: number;
  /** Digital nomad routes usually require active remote work income */
  requiresWork?: boolean;
  note: string;
}

export const VISA_ROUTE_TYPE_LABEL: Record<VisaRouteType, string> = {
  retirement: "Retirement route",
  passive_income: "Passive income route",
  digital_nomad: "Digital nomad / remote work",
  investment: "Investment or property route",
};

/** Keyed by the `country` field used in src/data/destinations.ts */
export const VISA_ROUTES: Record<string, VisaRoute[]> = {
  Thailand: [
    {
      id: "th_retirement",
      name: "Non-Immigrant O-A / O retirement extension",
      type: "retirement",
      incomeGuide: 2000,
      minAge: 50,
      note: "Age 50+, with either a Thai bank deposit or monthly income evidence; renewed annually with 90-day reporting.",
    },
    {
      id: "th_dtv",
      name: "Destination Thailand Visa (DTV)",
      type: "digital_nomad",
      incomeGuide: 1500,
      requiresWork: true,
      note: "Five-year multi-entry visa for remote workers and soft-power activities, with roughly 500,000 THB of savings evidence and 180-day stays.",
    },
    {
      id: "th_ltr",
      name: "Long-Term Resident (LTR) visa",
      type: "investment",
      incomeGuide: 6600,
      note: "Ten-year route for wealthy pensioners and high-earning remote professionals, with income and insurance thresholds.",
    },
  ],
  Portugal: [
    {
      id: "pt_d7",
      name: "D7 passive income visa",
      type: "passive_income",
      incomeGuide: 1000,
      note: "Built for pensions, rental and dividend income; needs accommodation, health cover and in-country renewals.",
    },
    {
      id: "pt_d8",
      name: "D8 digital nomad visa",
      type: "digital_nomad",
      incomeGuide: 3500,
      requiresWork: true,
      note: "For remote employees and freelancers earning roughly four times the Portuguese minimum wage from outside Portugal.",
    },
    {
      id: "pt_golden",
      name: "Golden visa (fund investment)",
      type: "investment",
      incomeGuide: 0,
      note: "Investment-led residency with very low stay requirements; property purchase no longer qualifies.",
    },
  ],
  Malaysia: [
    {
      id: "my_mm2h",
      name: "Malaysia My Second Home (MM2H)",
      type: "retirement",
      incomeGuide: 2500,
      note: "Tiered programme with fixed-deposit, income and property conditions that have changed several times.",
    },
    {
      id: "my_dep",
      name: "DE Rantau nomad pass",
      type: "digital_nomad",
      incomeGuide: 2000,
      requiresWork: true,
      note: "Twelve-month renewable pass for remote tech and digital professionals earning about $24,000 a year.",
    },
  ],
  "Costa Rica": [
    {
      id: "cr_pensionado",
      name: "Pensionado residency",
      type: "retirement",
      incomeGuide: 1000,
      note: "Requires a verifiable lifetime pension of $1,000 a month, exchanged locally, with regular renewals.",
    },
    {
      id: "cr_rentista",
      name: "Rentista residency",
      type: "passive_income",
      incomeGuide: 2500,
      note: "For non-pension income: typically $60,000 deposited or guaranteed income over two years.",
    },
    {
      id: "cr_nomad",
      name: "Remote worker (nomad) visa",
      type: "digital_nomad",
      incomeGuide: 3000,
      requiresWork: true,
      note: "One year, extendable, for foreign-earned income of about $3,000 a month ($4,000 with dependants).",
    },
  ],
  Spain: [
    {
      id: "es_nlv",
      name: "Non-lucrative visa",
      type: "passive_income",
      incomeGuide: 2400,
      note: "Substantial proven passive income plus private health cover; working is generally not permitted.",
    },
    {
      id: "es_dnv",
      name: "Digital nomad visa",
      type: "digital_nomad",
      incomeGuide: 2800,
      requiresWork: true,
      note: "For remote workers with mostly foreign clients or employers; can include a reduced tax regime.",
    },
  ],
  Mexico: [
    {
      id: "mx_temporary",
      name: "Temporary residency (income or savings)",
      type: "passive_income",
      incomeGuide: 4400,
      note: "Granted at a consulate abroad on income or savings thresholds tied to Mexican minimum wage; leads to permanent status.",
    },
    {
      id: "mx_permanent",
      name: "Permanent residency (pension route)",
      type: "retirement",
      incomeGuide: 7000,
      note: "Higher thresholds, but permanent from day one; pensioners can sometimes qualify directly.",
    },
  ],
  Panama: [
    {
      id: "pa_pensionado",
      name: "Pensionado programme",
      type: "retirement",
      incomeGuide: 1000,
      note: "Lifetime pension of about $1,000 a month grants permanent status plus a well-known discount package.",
    },
    {
      id: "pa_friendly",
      name: "Friendly Nations visa",
      type: "investment",
      incomeGuide: 0,
      note: "For nationals of listed countries with a Panamanian job offer, company or $200,000 property purchase.",
    },
    {
      id: "pa_nomad",
      name: "Short-stay remote worker visa",
      type: "digital_nomad",
      incomeGuide: 3000,
      requiresWork: true,
      note: "Nine months, renewable once, for foreign-earned income of roughly $36,000 a year.",
    },
  ],
  Greece: [
    {
      id: "gr_fip",
      name: "Financially Independent Person visa",
      type: "passive_income",
      incomeGuide: 2200,
      note: "Proven passive income plus health cover; a 7% flat-tax regime may apply to foreign pensions.",
    },
    {
      id: "gr_nomad",
      name: "Digital nomad visa",
      type: "digital_nomad",
      incomeGuide: 3900,
      requiresWork: true,
      note: "For remote workers earning about €3,500 net a month from outside Greece, with a 50% tax break available.",
    },
    {
      id: "gr_golden",
      name: "Golden visa (property)",
      type: "investment",
      incomeGuide: 0,
      note: "Property investment from €250,000–€800,000 depending on the area, with no minimum stay.",
    },
  ],
  Vietnam: [
    {
      id: "vn_temporary",
      name: "Repeated temporary / sponsored visas",
      type: "passive_income",
      incomeGuide: 1500,
      note: "There is no retirement visa; most long-stayers rely on sponsored business visas or repeated three-month entries.",
    },
    {
      id: "vn_marriage",
      name: "Spouse-sponsored temporary residence card",
      type: "passive_income",
      incomeGuide: 0,
      note: "Marriage to a Vietnamese citizen is the most stable long-term route currently available.",
    },
  ],
  Colombia: [
    {
      id: "co_pension",
      name: "M-11 pensioner visa",
      type: "retirement",
      incomeGuide: 900,
      note: "Verified pension of roughly three times the Colombian minimum wage; renewable and counts toward residency.",
    },
    {
      id: "co_nomad",
      name: "V-11 digital nomad visa",
      type: "digital_nomad",
      incomeGuide: 1000,
      requiresWork: true,
      note: "Up to two years for remote workers or freelancers earning about three times the minimum wage from abroad.",
    },
    {
      id: "co_rentista",
      name: "M-10 rentista visa",
      type: "passive_income",
      incomeGuide: 2500,
      note: "For stable passive income of roughly ten times the minimum wage from investments or rentals.",
    },
  ],
  Italy: [
    {
      id: "it_elective",
      name: "Elective residency visa",
      type: "passive_income",
      incomeGuide: 3000,
      note: "Requires substantial passive income (around €31,000+ a year for one person), Italian accommodation and health cover; work is not allowed.",
    },
    {
      id: "it_nomad",
      name: "Digital nomad visa",
      type: "digital_nomad",
      incomeGuide: 2800,
      requiresWork: true,
      note: "For highly qualified remote workers earning roughly three times the minimum exemption level, with health cover and accommodation.",
    },
  ],
  Croatia: [
    {
      id: "hr_own_funds",
      name: "Temporary stay for own funds",
      type: "passive_income",
      incomeGuide: 1400,
      note: "The main non-EU route for retirees: proof of sufficient means, housing and health cover, renewed regularly.",
    },
    {
      id: "hr_nomad",
      name: "Digital nomad residence permit",
      type: "digital_nomad",
      incomeGuide: 2900,
      requiresWork: true,
      note: "Up to 18 months for remote workers with foreign employers or clients, with an income test and no local work allowed.",
    },
  ],
  Cyprus: [
    {
      id: "cy_cat_f",
      name: "Category F permanent residence",
      type: "passive_income",
      incomeGuide: 2200,
      note: "Built on secured annual income from abroad with no local employment; slow processing but a well-worn retiree route.",
    },
    {
      id: "cy_nomad",
      name: "Digital nomad visa",
      type: "digital_nomad",
      incomeGuide: 3900,
      requiresWork: true,
      note: "For remote workers earning about €3,500 net a month from outside Cyprus, renewable up to three years.",
    },
    {
      id: "cy_investment",
      name: "Fast-track permanent residence (investment)",
      type: "investment",
      incomeGuide: 0,
      note: "Property or fund investment from €300,000 plus proven foreign income grants permanent residence quickly.",
    },
  ],
  Philippines: [
    {
      id: "ph_srrv",
      name: "Special Resident Retiree's Visa (SRRV)",
      type: "retirement",
      incomeGuide: 800,
      minAge: 50,
      note: "Indefinite residency from age 50 with a bank deposit — as low as $10,000 when paired with a qualifying pension.",
    },
    {
      id: "ph_ltv",
      name: "Long-stay visitor extensions",
      type: "passive_income",
      incomeGuide: 0,
      note: "Tourist stays can be extended up to three years in-country, a common fallback while deciding on SRRV.",
    },
  ],
  Indonesia: [
    {
      id: "id_retirement",
      name: "Retirement KITAS",
      type: "retirement",
      incomeGuide: 1500,
      minAge: 55,
      note: "Age 55+, with proof of pension, local sponsorship, accommodation and insurance; renewed annually.",
    },
    {
      id: "id_second_home",
      name: "Second Home visa",
      type: "investment",
      incomeGuide: 0,
      note: "Five to ten years for applicants holding around $130,000 in an Indonesian account or qualifying property.",
    },
    {
      id: "id_e33g",
      name: "E33G remote worker KITAS",
      type: "digital_nomad",
      incomeGuide: 5000,
      requiresWork: true,
      note: "One year for remote workers earning about $60,000 a year from foreign employers.",
    },
  ],
  Japan: [
    {
      id: "jp_nomad",
      name: "Digital nomad visa (6 months)",
      type: "digital_nomad",
      incomeGuide: 5700,
      requiresWork: true,
      note: "Six months, non-renewable back-to-back, for remote workers earning about ¥10 million a year — a trial, not a settlement route.",
    },
    {
      id: "jp_spouse",
      name: "Spouse or family-based residence",
      type: "passive_income",
      incomeGuide: 0,
      note: "Family ties are the most common long-term route; Japan has no retirement visa.",
    },
  ],
  Taiwan: [
    {
      id: "tw_gold_card",
      name: "Employment Gold Card",
      type: "digital_nomad",
      incomeGuide: 5300,
      requiresWork: true,
      note: "Three-year open work and residence permit for qualifying professionals, typically evidenced by high past salary or recognised expertise.",
    },
    {
      id: "tw_investment",
      name: "Investment residency",
      type: "investment",
      incomeGuide: 0,
      note: "Investing roughly NT$6 million in an approved Taiwanese business can support residency.",
    },
  ],
};
