import { createFileRoute, Link } from "@tanstack/react-router";
import { VISA_ROUTES } from "@/data/visa-routes";
import {
  AssessmentCta,
  Bullets,
  city,
  CompareTable,
  ContentBody,
  ContentDisclaimer,
  ContentHero,
  ContentShell,
  coupleRange,
  Faq,
  RelatedReading,
  Section,
  soloRange,
  Sources,
  SubHeading,
} from "@/components/content-page";
import { contentHead, contentJsonLd, type FaqItem } from "@/lib/content-pages";

const TITLE = "Retiring in Thailand: Costs, Visas, Cities and Healthcare (2026)";
const DESCRIPTION =
  "A practical guide to retiring in Thailand: realistic monthly budgets by city, the retirement visa routes, healthcare, and the honest trade-offs before you commit.";

const FAQS: FaqItem[] = [
  {
    q: "How much money do you need to retire in Thailand?",
    a: "Our destination data puts a comfortable-but-modest solo retirement at roughly $1,000–$1,900 a month in Chiang Mai, $1,100–$2,100 in Hua Hin, $1,300–$2,600 in Bangkok and $1,400–$2,700 in Phuket. Couples typically need around 35–40% more, not double. These are estimates that exclude international health insurance premiums, visa costs and travel home.",
  },
  {
    q: "What age can you retire in Thailand?",
    a: "Thailand's retirement-purpose Non-Immigrant O/O-A route is generally for applicants aged 50 and over, with financial evidence such as a Thai bank deposit or a monthly pension (a 65,000 THB monthly income figure is commonly referenced). Younger movers usually look at the Destination Thailand Visa or the Long-Term Resident visa instead. Requirements change — check Thai Immigration and your nearest Thai embassy.",
  },
  {
    q: "Is healthcare good in Thailand for retirees?",
    a: "Private hospitals in Bangkok, Chiang Mai and Phuket are well regarded and inexpensive relative to the US, and waiting times are short. The catch is insurance: premiums rise sharply with age and pre-existing conditions are often excluded, so price cover for your age before you plan a move.",
  },
  {
    q: "Can foreigners buy property in Thailand?",
    a: "Foreigners generally cannot own land outright. Condominium units can be foreign-owned within a building quota, and long leases are common. Most retirees rent, at least for the first year.",
  },
  {
    q: "Which Thai city is best for retirement?",
    a: "Chiang Mai for the lowest costs and a large expat community, Hua Hin for a calm beach town within reach of Bangkok's hospitals, Bangkok for specialist medical care and transport, Phuket for beaches and international flights at a higher price. Our free assessment ranks them against your own budget and priorities.",
  },
];

export const Route = createFileRoute("/retire/thailand/")({
  head: () => ({
    ...contentHead({ path: "/retire/thailand", title: TITLE, description: DESCRIPTION }),
    scripts: contentJsonLd({
      path: "/retire/thailand",
      title: TITLE,
      description: DESCRIPTION,
      faqs: FAQS,
    }),
  }),
  component: RetireThailand,
});

const CITY_IDS = ["chiang_mai", "hua_hin", "bangkok", "phuket"];

function RetireThailand() {
  const routes = VISA_ROUTES["Thailand"] ?? [];

  return (
    <ContentShell>
      <ContentHero
        eyebrow="Country guide · Thailand"
        title="Retiring in Thailand: what it actually costs and what you give up"
        intro={
          <>
            <p>
              Thailand has been the default answer to "where can I retire cheaply?" for thirty
              years, and for good reason: low living costs, strong private hospitals, warm weather
              and an expat community deep enough that you can find a bridge club, a cardiologist and
              a decent loaf of bread in the same afternoon.
            </p>
            <p>
              It is also a country of annual visa renewals, 90-day reporting, a genuinely bad air
              quality season in the north, and property rules that keep most foreigners renting.
              This guide covers both sides using the same city data our free assessment scores.
            </p>
          </>
        }
      />

      <ContentBody>
        <Section id="budget" title="Realistic monthly budgets by city">
          <p>
            The ranges below come from the destination dataset behind our assessment. They cover
            housing, food, utilities, local transport and routine care for a comfortable-but-modest
            lifestyle. They are estimates, not quotes, and they exclude international health
            insurance, visa fees and flights home.
          </p>
          <CompareTable
            caption="Indicative monthly living costs for four Thai retirement cities"
            columns={["Solo (USD/month)", "Couple (USD/month)", "Cost index (US = 100)"]}
            rows={CITY_IDS.map((id) => {
              const c = city(id);
              return {
                label: c.name,
                values: [soloRange(id), coupleRange(id), String(c.costIndex)],
              };
            })}
          />
          <p>
            The practical read: a single retiree on around $2,000 a month lives comfortably almost
            anywhere in Thailand outside central Bangkok and beachfront Phuket. Below roughly $1,000
            solo, the numbers get tight fast — see{" "}
            <Link
              to="/retire/thailand/2000-a-month"
              className="text-primary underline underline-offset-4"
            >
              our breakdown of a $2,000 monthly budget
            </Link>
            .
          </p>
        </Section>

        <AssessmentCta
          label="See if Thailand fits your retirement plan"
          note="Nine questions on income, health, climate and lifestyle. You get ranked city matches with a factor-by-factor breakdown — including places that beat Thailand for your situation."
          placement="retire_thailand_mid"
        />

        <Section id="cities" title="Best cities for retirement in Thailand">
          {CITY_IDS.map((id) => {
            const c = city(id);
            return (
              <div key={id}>
                <SubHeading>
                  <span aria-hidden="true">{c.emoji}</span> {c.name} — {c.tagline}
                </SubHeading>
                <p className="mt-2">{c.summary}</p>
                <p className="mt-2 text-sm">
                  <strong className="text-foreground">Works well for:</strong>{" "}
                  {c.advantages.slice(0, 2).join("; ").toLowerCase()}.{" "}
                  <strong className="text-foreground">Watch out for:</strong>{" "}
                  {c.compromises.slice(0, 2).join("; ").toLowerCase()}.
                </p>
              </div>
            );
          })}
          <p className="mt-4">
            Torn between the north and the coast? Use the{" "}
            <Link
              to="/planner"
              search={{ city: "chiang_mai" }}
              className="text-primary underline underline-offset-4"
            >
              affordability planner to compare city budgets
            </Link>
            .
          </p>
        </Section>

        <Section id="healthcare" title="Healthcare for retirees in Thailand">
          <p>
            Thailand's private hospital sector is the main reason retirees stay as they age. Bangkok
            has internationally accredited hospitals with English-speaking specialists; Chiang Mai
            and Phuket have strong regional private hospitals; Hua Hin has good day-to-day private
            care with Bangkok about three hours away by road.
          </p>
          <Bullets
            items={[
              "Out-of-pocket consultations and diagnostics are typically a fraction of US prices, which is why some retirees self-insure for routine care.",
              "Serious risk sits in the catastrophic events. International insurance premiums climb steeply from your late sixties, and pre-existing conditions are commonly excluded or loaded.",
              "Some visa routes require proof of health insurance. Get a real quote at your actual age before you commit to a budget.",
              "Public hospitals are cheaper but busier, with less English support outside major cities.",
            ]}
          />
        </Section>

        <Section id="visas" title="Thailand retirement visa pathways">
          <p>
            These are general summaries of the routes retirees most often use. Thai Immigration
            requirements, financial thresholds and insurance conditions change, and individual
            offices apply them differently — verify with Thai Immigration or your nearest Thai
            embassy before making plans.
          </p>
          <div className="space-y-4">
            {routes.map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                <h3 className="text-base font-semibold text-foreground">{r.name}</h3>
                <p className="mt-1 text-sm">{r.note}</p>
                <p className="mt-2 text-xs">
                  Indicative income guide ${r.incomeGuide.toLocaleString("en-US")}/month
                  {r.minAge ? ` · typically age ${r.minAge}+` : ""}
                  {r.requiresWork ? " · requires active remote work income" : ""}
                </p>
              </div>
            ))}
          </div>
          <p>
            Thai Immigration's own retirement-purpose documentation sets out the age-50 threshold
            and the financial evidence options, including the frequently cited 65,000 THB monthly
            income route and the alternative bank-deposit route. Expect annual extensions and 90-day
            address reporting on the retirement extension.
          </p>
        </Section>

        <Section id="pros-cons" title="Pros and cons, honestly">
          <SubHeading>What Thailand does well</SubHeading>
          <Bullets
            items={[
              "Cost-to-comfort ratio that few countries match: a modest Western pension buys a genuinely comfortable life.",
              "Fast, affordable private healthcare with English-speaking specialists in the major cities.",
              "A deep, long-established expat community — practical help exists for almost every problem.",
              "Outstanding food, easy regional travel and a warm climate year round.",
            ]}
          />
          <SubHeading>What people underestimate</SubHeading>
          <Bullets
            items={[
              "Annual renewals and 90-day reporting never stop. You are a long-term guest, not a future citizen.",
              "Northern burning season (roughly February to April) produces air quality that is a real health problem, not an inconvenience.",
              "Land ownership is effectively closed to foreigners; condo ownership is quota-limited.",
              "Tax treatment of foreign income remitted to Thailand has been under active revision — get current advice.",
              "Heat and humidity are relentless if you have not lived in the tropics before.",
            ]}
          />
        </Section>

        <Section id="who-it-suits" title="Who Thailand suits — and who should look elsewhere">
          <p>
            <strong className="text-foreground">Thailand suits you if</strong> your budget is
            modest, you value healthcare access and food culture over legal permanence, you can
            handle heat, and you are comfortable renting and renewing paperwork every year.
          </p>
          <p>
            <strong className="text-foreground">Look elsewhere if</strong> you want a path to
            permanent residency or citizenship, you need to own land, you have respiratory
            conditions that burning season would aggravate, or you want to be a short flight from
            family in Europe or North America. Portugal, Spain, Mexico and Panama score better on
            several of those for many people —{" "}
            <Link to="/assessment" className="text-primary underline underline-offset-4">
              take the quiz to explore your alternatives
            </Link>
            .
          </p>
        </Section>

        <Faq items={FAQS} />

        <AssessmentCta
          label="See if Thailand fits your retirement plan"
          note="Compare Thai cities against 45 destinations worldwide, scored on your income, healthcare needs, climate preference and priorities."
          placement="retire_thailand_end"
        />

        <Sources
          items={[
            {
              label: "Thailand Immigration Bureau — retirement purposes (50 years old, Non-O)",
              href: "https://www.immigration.go.th/wp-content/uploads/2022/02/9.FOR-RETIREMENT-PURPOSES-50-YEARS-OLD-NON-O.pdf",
            },
            {
              label: "Thailand Immigration Bureau — official site",
              href: "https://www.immigration.go.th/",
            },
          ]}
        />

        <RelatedReading current="/retire/thailand" />
        <ContentDisclaimer />
      </ContentBody>
    </ContentShell>
  );
}
