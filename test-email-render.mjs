import { render } from '@react-email/render'
import { ResearchPlanEmail } from './src/lib/email-templates/research-plan'

const html = await render(
  ResearchPlanEmail({
    name: 'Test',
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
        headline: 'A sunny, walkable capital with strong healthcare.',
        budgetLow: 2200,
        budgetHigh: 3600,
        projectedSpend: 2900,
        visaLabel: 'D7 Passive Income Visa',
        visaNote: 'Requires roughly €870/mo stable passive income.',
        strengths: ['Strong healthcare', 'English-speaking community', 'Mild winters'],
      },
    ],
  }),
)

console.log('Rendered length:', html.length)
console.log('Contains Lisbon:', html.includes('Lisbon'))
console.log('Preview text:', html.slice(0, 200))
