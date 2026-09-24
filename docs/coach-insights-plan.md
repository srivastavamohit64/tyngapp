# Coach Insights implementation plan

## Product direction

Use the same mobile principles visible in Playo's public app screens: a compact sticky header, horizontally scrollable filters, one clear primary summary, short card labels, restrained colour, and large tap targets. TYNG keeps its own lime/orange visual identity.

## Data contract

`GET /api/coach/insights?date=YYYY-MM-DD&period=last_7_days|last_30_days|this_month|this_year`

The selected date is the anchor for the requested period. The response contains one consistent payload for the entire page:

- Growth index: weighted score from session activity, booking acceptance, completion, satisfaction, and repeat-student rate. No fixed baseline is added.
- Profile views: unique signed-in viewers tracked per coach per day, with repeat opens counted safely.
- Booking requests and acceptance: coaching booking requests created or requested within the period.
- Sessions and earnings: legacy and scheduling sessions combined, without frontend double counting.
- Student growth: active students, students with evaluations, students whose latest rating improved from their first rating, and average rating improvement.
- Retention: repeat-student rate, accepted-request rate, satisfaction, evaluation coverage, returning students, and average coaching relationship duration.
- Review highlights: published review count, rating, and keyword tags derived from actual review comments.
- Booking journey: profile views, enquiries, confirmed sessions, and returning students with safe conversion percentages.
- Sparklines: server-generated period buckets rather than sample arrays in the app.

Unavailable concepts are replaced with measurable data. Tournament wins and referrals are not shown until the app records those events.

## Mobile UI rules

- Content width: full mobile width with 16px gutters; 680px maximum on larger screens.
- Type: 11–18px card hierarchy, two-line truncation for long labels, no fixed-width text that can overlap.
- Cards: 18–24px radii, subtle borders, shallow shadows, minimum 44px interactive controls.
- Three-column metrics collapse cleanly below 360px; values use tabular numerals.
- Empty data uses honest `0`, `—`, and concise empty-state copy.
- Calendar and period changes reload the same API and keep the selected state visible.

## Verification

- Laravel migration and route tests.
- API feature tests for period validation, empty data, and coach-only access.
- Angular TypeScript and production build.
- Mobile visual QA at 360–430px when an app browser is available.
