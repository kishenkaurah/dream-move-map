import { createFileRoute, Link } from "@tanstack/react-router";
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

const TITLE = "Retire in Thailand on $2,000 a Month: What It Really Covers";
const DESCRIPTION =
  "What a US$2,000 monthly retirement budget realistically buys in Thailand — housing, healthcare, food and transport ranges by city, plus when $2,000 gets tight.";

const FAQS: FaqItem[] = [
  {
    q: "Is $2,000 a month enough to retire in Thailand?",
    a: "For one person, yes, in most of the country. Our city data puts a comfortable-but-modest solo budget at roughly $1,000–$1,900 in Chiang Mai and $1,100–$2,100 in Hua Hin, so $2,000 sits at or above the comfortable end. In central Bangkok or beachfront Phuket it is closer to the middle of the range, and for a couple $2,000 is a lean budget almost everywhere.",
  },
  {
    q: "Can a couple retire in Thailand on $2,000 a month?",
    a: "It is possible in Chiang Mai (couple range roughly $1,400–$2,600) but you would be at the modest end: a mid-range condo outside the centre, mostly local food, one motorbike or public transport, and no allowance for international insurance premiums or annual flights home.",
  },
  {
    q: "Does $2,000 a month include health insurance?",
    a: "No. Treat insurance as a separate line. Premiums for international cover rise steeply with age and pre-existing conditions are commonly excluded, so get a real quote at your own age before setting a budget.",
  },
  {
    q: "What does rent cost in Thailand for retirees?",
    a: "Rent is the single biggest swing factor and varies widely by city and standard. Rather than quote a false-precision figure, we model housing inside the total city ranges in our destination data and recommend budgeting the upper half of the range for your first year while you learn the market.",
  },
];

export const Route = createFileRoute("/retire/thailand/2000-a-month")({
  head: () => ({
    ...contentHead({
      path: "/retire/thailand/2000-a-month",
      title: TITLE,
      description: DESCRIPTION,
    }),
    scripts: contentJsonLd({
      path: "/retire/thailand/2000-a-month",
      title: TITLE,
      description: DESCRIPTION,
      faqs: FAQS,
    }),
  }),
  component: ThailandOn2000,
});

const CITY_IDS = ["chiang_mai", "hua_hin", "bangkok", "phuket"];

function verdict(id: string): string {
  const c = city(id);
  const [lo, hi] = c.budget.solo;
  if (2000 >= hi) return "Comfortable — $2,000 sits above the typical solo range";
  if (2000 >= (lo + hi) / 2) return "Workable — around the middle to upper end of the range";
  return "Tight — $2,000 is below the midpoint for this city";
}

function ThailandOn2000() {
  return (
    <ContentShell>
      <ContentHero
        eyebrow="Budget guide · Thailand"
        title="Retiring in Thailand on $2,000 a month"
        intro={
          <>
            <p>
              US$2,000 a month is the number most people arrive with, usually because it is roughly
              what an average pension delivers. In Thailand it is a genuinely good budget for one
              person and a lean one for two — but where you live changes the answer more than how
              you live.
            </p>
            <p>
              Below we use the same city ranges that power our free assessment, show what $2,000
              covers, and name the points where it stops stretching.
            </p>
          </>
        }
      />

      <ContentBody>
        <Section id="by-city" title="Where $2,000 a month goes furthest">
          <CompareTable
            caption="How a $2,000 monthly budget compares to typical costs in four Thai cities"
            columns={["Typical solo range", "Typical couple range", "$2,000 solo verdict"]}
            rows={CITY_IDS.map((id) => ({
              label: city(id).name,
              values: [soloRange(id), coupleRange(id), verdict(id)],
            }))}
          />
          <p>
            Estimates from our destination dataset, covering housing, food, utilities, local
            transport and routine care. They exclude international health insurance, visa costs and
            flights home.
          </p>
        </Section>

        <Section id="what-it-covers" title="What $2,000 a month realistically covers">
          <SubHeading>Housing</SubHeading>
          <p>
            The biggest lever. A modern one-bedroom condo with a pool and gym outside the centre of
            Chiang Mai or Hua Hin is comfortably inside this budget; the same standard on a Phuket
            beachfront or in central Bangkok can absorb most of it. Rent before you buy anything —
            foreigners cannot own land outright, and condo ownership is quota-limited.
          </p>
          <SubHeading>Food</SubHeading>
          <p>
            Eating mostly Thai food at local restaurants and markets is the cheapest way to live
            well anywhere in the country. Imported groceries, Western restaurants and wine are where
            budgets quietly break — a heavily Western diet can add several hundred dollars a month.
          </p>
          <SubHeading>Healthcare</SubHeading>
          <p>
            Routine private consultations and diagnostics are affordable out of pocket, which is why
            $2,000 works day to day. Insurance is the exception: budget it separately and get quoted
            at your real age.
          </p>
          <SubHeading>Transport</SubHeading>
          <p>
            A motorbike or ride-hailing apps cost little. Bangkok's rail network makes a car
            unnecessary. Owning and running a car is the point where a $2,000 budget starts to feel
            constrained outside the cheapest cities.
          </p>
          <SubHeading>Everything else</SubHeading>
          <Bullets
            items={[
              "Visa costs, annual extensions and the deposit or income evidence your route requires.",
              "Flights home — one long-haul trip a year is a meaningful share of an annual budget.",
              "Currency risk: your pension is in dollars, pounds or euros and your costs are in baht.",
              "A contingency fund. Medical events and emergency travel do not wait for a good month.",
            ]}
          />
        </Section>

        <AssessmentCta
          label="See what your budget actually buys"
          note="Enter your real monthly income and we'll project your spending in each city and flag where the numbers don't work."
          placement="thailand_2000_mid"
        />

        <Section id="tradeoffs" title="Trade-offs by city and lifestyle">
          <Bullets
            items={[
              <>
                <strong className="text-foreground">Chiang Mai</strong> buys the most lifestyle per
                dollar, at the cost of a serious burning-season air quality problem and no coast.
              </>,
              <>
                <strong className="text-foreground">Hua Hin</strong> gives you the beach and a calm
                pace for slightly more, with fewer specialist medical services on the doorstep.
              </>,
              <>
                <strong className="text-foreground">Bangkok</strong> gives you the best hospitals
                and transport in the country; $2,000 works but with less housing space.
              </>,
              <>
                <strong className="text-foreground">Phuket</strong> is the most expensive of the
                four and the one where $2,000 solo requires real discipline.
              </>,
            ]}
          />
        </Section>

        <Section id="when-tight" title="When $2,000 a month gets tight">
          <Bullets
            items={[
              "You are a couple and want two bedrooms, a car and Western groceries.",
              "You need comprehensive international health insurance in your seventies.",
              "You want beachfront or central-city housing in Phuket or Bangkok.",
              "You fly home more than once a year, or support family back home.",
              "Your income is fixed in a currency that weakens against the baht.",
            ]}
          />
          <p>
            If any of those apply, explore other destinations too. Our{" "}
            <Link to="/assessment" className="text-primary underline underline-offset-4">
              retirement destination quiz
            </Link>{" "}
            helps you find destinations that match your budget and preferences. For the wider
            picture on Thailand, see the{" "}
            <Link to="/retire/thailand" className="text-primary underline underline-offset-4">
              full Thailand retirement guide
            </Link>
            .
          </p>
        </Section>

        <Faq items={FAQS} />

        <AssessmentCta
          label="See if Thailand fits your retirement plan"
          note="A free, transparent nine-question assessment that ranks cities against your actual income and priorities."
          placement="thailand_2000_end"
        />

        <Sources
          items={[
            {
              label: "Thailand Immigration Bureau — retirement purposes (50 years old, Non-O)",
              href: "https://www.immigration.go.th/wp-content/uploads/2022/02/9.FOR-RETIREMENT-PURPOSES-50-YEARS-OLD-NON-O.pdf",
            },
          ]}
        />

        <RelatedReading current="/retire/thailand/2000-a-month" />
        <ContentDisclaimer />
      </ContentBody>
    </ContentShell>
  );
}
