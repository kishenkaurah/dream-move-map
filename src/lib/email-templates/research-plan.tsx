import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

export interface ResearchPlanEmailProps {
  name: string
  topDestination: string
  topCountry: string
  projectedSpend?: number | null
  matches: Array<{
    name: string
    country: string
    emoji: string
    overall: number
    headline: string
    budgetLow: number
    budgetHigh: number
    projectedSpend: number | null
    visaLabel: string
    visaNote: string
    strengths: string[]
  }>
  siteUrl: string
}

const TEAL = '#2c7676'
const INK = '#151e32'
const PAPER = '#f8f6f2'
const MUTED = '#6b7280'
const BORDER = '#e6e1d9'

export const ResearchPlanEmail = ({
  name,
  topDestination,
  topCountry,
  projectedSpend,
  matches,
  siteUrl,
}: ResearchPlanEmailProps) => {
  const topMatch = matches[0]
  const projectedSpendText =
    typeof projectedSpend === 'number' && projectedSpend > 0 ? (
      <Text style={text}>
        Based on your answers, we project your monthly spend in {topDestination} at about{' '}
        <strong>${projectedSpend.toLocaleString('en-US')}</strong>.
      </Text>
    ) : topMatch ? (
      <Text style={text}>
        Typical monthly budgets in {topDestination} range from{' '}
        <strong>${topMatch.budgetLow.toLocaleString('en-US')}</strong> to{' '}
        <strong>${topMatch.budgetHigh.toLocaleString('en-US')}</strong>.
      </Text>
    ) : null


  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        Your Retire Abroad research plan — {topDestination}, {topCountry} and {String(matches.length)} more matches
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Your research plan is ready</Heading>
          <Text style={lead}>
            Hi {name},
          </Text>
          <Text style={text}>
            Thanks for using the Retire Abroad Navigator. Here are your top destination matches, the budget picture, and the visa route to investigate first.
          </Text>

          <Section style={heroBox}>
            <Text style={eyebrow}>Top match</Text>
            <Heading as="h2" style={h2}>
              {topMatch?.emoji} {topDestination}, {topCountry}
            </Heading>
            {topMatch && (
              <Text style={text}>
                {topMatch.headline}
              </Text>
            )}
            {spendText && (
              <Text style={text} dangerouslySetInnerHTML={{ __html: spendText }} />
            )}
            <Button style={button} href={siteUrl}>
              Review full results on the site
            </Button>
          </Section>

          <Heading as="h2" style={h2}>
            Your full shortlist
          </Heading>
          {matches.map((match, index) => (
            <Section key={match.name} style={matchRow}>
              <Text style={matchTitle}>
                {index + 1}. {match.emoji} {match.name}, {match.country}
                <span style={scoreBadge}>Fit score {match.overall}%</span>
              </Text>
              <Text style={smallText}>
                Typical budget: ${match.budgetLow.toLocaleString('en-US')} — ${match.budgetHigh.toLocaleString('en-US')}/mo
                {match.projectedSpend !== null && (
                  <> · Projected: ${match.projectedSpend.toLocaleString('en-US')}/mo</>
                )}
              </Text>
              <Text style={smallText}>{match.visaLabel} — {match.visaNote}</Text>
              {match.strengths.length > 0 && (
                <Text style={smallText}>
                  Strengths: {match.strengths.join(' · ')}
                </Text>
              )}
            </Section>
          ))}

          <Section style={tipBox}>
            <Text style={tipTitle}>What to do next</Text>
            <Text style={smallText}>
              1. <strong>Verify the visa income threshold</strong> for your age and household size on the official immigration portal.
            </Text>
            <Text style={smallText}>
              2. <strong>Plan a scouting trip</strong> outside peak season to test daily costs, healthcare access, and neighbourhood feel.
            </Text>
            <Text style={smallText}>
              3. <strong>Speak with a local tax advisor</strong> before moving tax residency or pensions overseas.
            </Text>
          </Section>

          <Text style={footer}>
            You're receiving this because you requested your research plan from{' '}
            <Link href={siteUrl} style={link}>Retire Abroad Navigator</Link>.
            If you didn't request this, you can safely ignore it.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default ResearchPlanEmail

export const template = {
  component: ResearchPlanEmail,
  displayName: 'Research Plan',
  subject: (data: Record<string, any>) =>
    `Your Retire Abroad research plan — ${data['topDestination'] ?? 'your top matches'}`,
  previewData: {
    name: 'Alex',
    topDestination: 'Lisbon',
    topCountry: 'Portugal',
    projectedSpend: 2900,
    siteUrl: 'https://retireabroad.me',
    matches: [
      {
        name: 'Lisbon',
        country: 'Portugal',
        emoji: '🇵🇹',
        overall: 88,
        headline:
          'A sunny, walkable capital with strong healthcare, affordable western-Europe living and a well-trodden retiree visa path.',
        budgetLow: 2200,
        budgetHigh: 3600,
        projectedSpend: 2900,
        visaLabel: 'D7 Passive Income Visa',
        visaNote:
          'Requires roughly €870/mo stable passive income; popular with pensioners and remote-income retirees.',
        strengths: [
          'Strong private and public healthcare options',
          'Large English-speaking retiree community',
          'Mild winters and coastal lifestyle',
        ],
      },
      {
        name: 'Chiang Mai',
        country: 'Thailand',
        emoji: '🇹🇭',
        overall: 82,
        headline:
          'Low cost of living, modern healthcare and a huge expat scene, with visa options opening up for long-stay retirees.',
        budgetLow: 1200,
        budgetHigh: 2200,
        projectedSpend: 1700,
        visaLabel: 'Thailand Long-Term Resident / Retirement',
        visaNote:
          'Retirement visa from age 50 with bank deposit or income; LTR offers 10-year path for higher earners.',
        strengths: [
          'Very low cost of living',
          'Excellent private hospitals',
          'Established expat infrastructure',
        ],
      },
      {
        name: 'Kuala Lumpur',
        country: 'Malaysia',
        emoji: '🇲🇾',
        overall: 78,
        headline:
          'A cosmopolitan, English-friendly hub with top-tier healthcare and straightforward MM2H long-stay options.',
        budgetLow: 1500,
        budgetHigh: 2600,
        projectedSpend: 2000,
        visaLabel: 'MM2H (Malaysia My Second Home)',
        visaNote:
          'Long-term social visit pass requiring liquid assets and monthly offshore income; rules vary by age bracket.',
        strengths: [
          'English widely used',
          'World-class private healthcare',
          'Central travel hub for Asia',
        ],
      },
    ],
  },
}

const main = {
  backgroundColor: PAPER,
  fontFamily: '"Public Sans", ui-sans-serif, system-ui, sans-serif',
  color: INK,
  padding: '24px 0',
}

const container = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '32px',
  maxWidth: '600px',
  border: `1px solid ${BORDER}`,
}

const h1 = {
  fontFamily: '"Source Serif 4", ui-serif, Georgia, serif',
  fontSize: '28px',
  fontWeight: 600,
  color: INK,
  margin: '0 0 20px',
  lineHeight: '1.25',
}

const h2 = {
  fontFamily: '"Source Serif 4", ui-serif, Georgia, serif',
  fontSize: '20px',
  fontWeight: 600,
  color: INK,
  margin: '28px 0 12px',
}

const lead = {
  fontSize: '16px',
  color: INK,
  margin: '0 0 16px',
  lineHeight: '1.5',
}

const text = {
  fontSize: '15px',
  color: INK,
  lineHeight: '1.6',
  margin: '0 0 18px',
}

const smallText = {
  fontSize: '14px',
  color: INK,
  lineHeight: '1.55',
  margin: '0 0 10px',
}

const eyebrow = {
  fontSize: '12px',
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  color: TEAL,
  margin: '0 0 8px',
}

const heroBox = {
  backgroundColor: PAPER,
  borderRadius: '10px',
  padding: '24px',
  margin: '24px 0',
  border: `1px solid ${BORDER}`,
}

const button = {
  backgroundColor: TEAL,
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 600,
  borderRadius: '8px',
  padding: '14px 24px',
  textDecoration: 'none',
  display: 'inline-block',
  marginTop: '8px',
}

const matchRow = {
  borderTop: `1px solid ${BORDER}`,
  padding: '18px 0',
}

const matchTitle = {
  fontSize: '15px',
  fontWeight: 600,
  color: INK,
  margin: '0 0 6px',
}

const scoreBadge = {
  backgroundColor: '#eef4f4',
  color: TEAL,
  fontSize: '12px',
  fontWeight: 600,
  padding: '3px 8px',
  borderRadius: '999px',
  marginLeft: '10px',
}

const tipBox = {
  backgroundColor: '#eef4f4',
  borderRadius: '10px',
  padding: '20px',
  margin: '28px 0 0',
}

const tipTitle = {
  fontSize: '15px',
  fontWeight: 600,
  color: TEAL,
  margin: '0 0 12px',
}

const link = {
  color: TEAL,
  textDecoration: 'underline',
}

const footer = {
  fontSize: '12px',
  color: MUTED,
  margin: '32px 0 0',
  lineHeight: '1.5',
}
