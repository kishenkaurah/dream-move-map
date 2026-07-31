# Retire Abroad Navigator

A free, transparent assessment that matches a person's finances, lifestyle and
priorities to overseas retirement destinations.

## Where to edit things

| What                                                   | File                          |
| ------------------------------------------------------ | ----------------------------- |
| Destination data: budgets, visas, ratings, copy, floors | `src/data/destinations.ts`    |
| Global factor weights (`BASE_WEIGHTS`)                  | `src/data/destinations.ts`    |
| Questions, options, order, copy                         | `src/data/questions.ts`       |
| Scoring rules                                           | `src/lib/scoring.ts`          |
| Lead persistence (swap for Lovable Cloud later)         | `src/lib/leads.ts`            |
| Assessment persistence                                  | `src/lib/assessment-storage.ts` |
| Analytics event sink                                    | `src/lib/analytics.ts`        |
| Design tokens (colours, fonts, shadows)                 | `src/styles.css`              |

## The scoring model

Each destination is scored 0–100 on eight factors:

1. **Affordability** — expected monthly income (plus a 2%/yr draw on savings)
   compared to a personalised cost estimate. That estimate blends the
   destination's indicative solo/couple budget midpoint (40%) with a projection
   of the user's *current* home spending (60%), scaled by the destination's
   `costIndex` versus their home region's cost level and by whether they want to
   trim, keep or upgrade their lifestyle. If they skip the spending question,
   only the indicative budget is used.
2. **Visa compatibility** — route complexity, income guidance vs. the user's
   income, minimum-age rules, and the user's paperwork tolerance.
3. **Healthcare** — destination rating, amplified when the user flags high or
   critical healthcare needs.
4. **Lifestyle fit** — setting, pace, housing intent and selected priorities.
5. **Climate** — direct fit table per climate preference.
6. **Language & integration** — English usability and cultural adjustment ease
   weighted against how much English the user needs.
7. **Proximity** — travel hours from the user's home region.
8. **Bureaucracy tolerance** — admin load and tax friendliness against the
   user's stated tolerance and tax sensitivity.

**Overall match** is the weighted average of the eight factor scores. Weights
start at `BASE_WEIGHTS` and shift with the user's answers (e.g. "healthcare is
critical" adds 12 points of weight to healthcare). Weights are normalised, so
the percentage shown on each factor bar is its real share of the result.

### Constraints, not deductions

Severe mismatches are treated as blocking issues and cap the overall score:

- income below the destination's `affordabilityFloor` → capped at 45%
- income below ~70% of the visa income guidance with low savings → capped at 55%
- critical healthcare need against a weak healthcare rating → capped at 55%
- "English essential" against a very low English rating → capped at 60%

Each triggered constraint is shown verbatim on the results card.

## Adding a destination

Append an object to `DESTINATIONS` in `src/data/destinations.ts`. Every field is
required and documented inline. No other file needs changing — the engine,
comparison table and results page all read from that array.

## Analytics

`track()` in `src/lib/analytics.ts` logs to the console and buffers the last 200
events in `localStorage`. Events emitted: `assessment_started`,
`step_completed`, `assessment_completed`, `lead_submitted`,
`consultation_clicked`. Replace the body of `track()` with a real provider call
when one is chosen.

## Connecting a backend later

`src/lib/leads.ts` exposes `submitLead()` / `listLeads()` as an async repository
over `localStorage`. Replacing those two bodies with Lovable Cloud queries is
the only change needed to persist leads server-side.

## Disclaimer

All content is educational and general. It is not legal, tax, immigration,
financial, insurance or medical advice.
