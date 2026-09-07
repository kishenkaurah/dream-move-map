# Retirement Compass

Build a polished responsive MVP web app called “Retire Abroad Navigator” that gives users a free basic overseas retirement destination assessment.

Core experience:
1. Landing page with a clear promise: “Discover the overseas retirement destinations that fit your finances, lifestyle and priorities—in under 10 minutes.” Include trust-focused copy and a prominent “Start free assessment” CTA.
2. Multi-step questionnaire with a visible progress indicator, back/next navigation, validation, and mobile-first design. Ask approximately 16 questions covering: citizenship/current country, age range, moving solo or with partner, monthly retirement income range, savings range, preferred climate, city/beach/countryside preference, healthcare importance, English-language preference, desired proximity to family, housing preference, pace of life, tolerance for bureaucracy/cultural adjustment, tax sensitivity, intended relocation timeframe, and top retirement priorities.
3. Use a transparent rules-based scoring engine. Include five initial destinations: Thailand, Portugal, Malaysia, Costa Rica, and Spain. Score affordability, visa compatibility, healthcare, lifestyle, climate, language/integration, distance/proximity preference, and bureaucracy tolerance. Treat severe affordability mismatches as constraints, not merely small score deductions.
4. Results page showing the top 3 destinations with overall percentage match, short explanation of why each scored well, estimated monthly budget range, relative visa complexity, healthcare quality indicator, key advantages, key compromises, and “questions to investigate next.” Include a side-by-side comparison view.
5. Explainability: show a “Why this matched” breakdown by factor with simple horizontal bars or labeled scores. Do not present legal, tax, immigration, or medical conclusions as definitive.
6. Lead capture after results: allow users to enter name and email to receive a detailed report. Make this optional so users can see useful results without surrendering contact details. Include CTA buttons for “Email my report” and “Book a planning call,” with the booking CTA using a placeholder flow/modal.
7. Add a simple admin/data configuration file or clearly structured data module so destination weights, copy, budgets, and constraints can be edited easily later.
8. Persist questionnaire answers and results locally so refreshing does not lose progress. Include a restart assessment action.
9. Add an accessible disclaimer stating that results are educational and general; visa, tax, financial, legal, insurance, and healthcare information must be independently verified with qualified professionals.
10. Add basic analytics event hooks/logging for assessment_started, step_completed, assessment_completed, lead_submitted, and consultation_clicked.

Design direction:
- Premium, calm, trustworthy travel-and-financial-planning aesthetic.
- Warm neutral background, deep navy text, muted teal accent, restrained use of destination imagery or tasteful abstract travel visuals.
- Avoid looking like a generic quiz or cheap lead-generation funnel.
- Use clear typography, generous spacing, accessible contrast, cards, icons, and subtle transitions.
- Strong mobile usability.

Technical expectations:
- Full-stack TypeScript app using the default Lovable stack, Tailwind and shadcn/ui.
- No authentication required for MVP.
- Lead submission may use a simple local/mock persistence layer initially, but structure it so Supabase can be connected later.
- Include realistic seed data and ensure the scoring logic works end-to-end.
- Add a short README or code comments explaining the scoring model and where to update destination data.

Build the complete working MVP, not just a landing-page mockup.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://dream-move-map.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/67f0d913-00d1-4f28-8e31-374371a1380f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
