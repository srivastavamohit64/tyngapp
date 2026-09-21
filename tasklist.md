# TYNG — Today’s Work and Progress

## Completed: Coach role navigation and dashboard

- Added role-aware routing so a signed-in Coach is kept inside `/app/coach/*` routes.
- Redirected Coach access to `/app/home` back to `/app/coach/dashboard`, including deep links and browser navigation.
- Updated Coach tabs, side-menu links, back buttons, chat and schedule links to avoid Player destinations.
- Fixed the Coach dashboard profile refresh issue: the dashboard API now includes `role: coach`, preventing the Coach layout from falling back to Player UI.
- Replaced dashboard emoji/missing-icon rendering with Ionic icons aligned with the supplied Figma-generated reference.

## Completed: Player-to-Coach student-request workflow

- Made Player **Find Coaches** (`/app/coaches`) load live Coach data from the API instead of demo cards.
- Made Player Coach detail (`/app/coaches/:id`) load live Coach profile data.
- Added the Player action **Request to Join as Student** on Coach detail.
- Added production Laravel migration/table: `coach_student_requests`.
- Added Player request, Coach pending-request list, and Coach accept/decline APIs.
- Accepting a request creates or reactivates the unique `coach_students` relationship and sends notifications to both users.
- Rebuilt Coach **My Students** (`/app/coach/students`) around live data: pending requests, accept/decline controls, active students, search, refresh, and student profile links.
- Updated Coach student detail to load its relationship, sessions, and evaluation data from the API instead of the static demo dataset.

## Completed: Media URLs and placeholders

- Fixed Coach Student and request API responses to return absolute live-server profile-image URLs.
- Prevented relative `profile-images/...` values from resolving against Ionic `localhost:8100`.
- Added the shared media URL resolver and profile placeholder fallback for the Coach Students experience.

## Completed: Coach notifications and typography

- Updated Coach Notifications to use the Player mobile typography scale, spacing, compact cards, circular controls, safe-area spacing, and responsive padding.
- Made Student Request notification **View** open the Coach Students workspace.
- Standardized the shared Lato font stack, body line-height, form/control font inheritance, and app typography tokens across roles.

## Completed: Live Laravel Admin panel

- Added Admin → **Coaches** navigation and routes: `/admin/coaches` and `/admin/coaches/{coach}`.
- Added Coach directory metrics: contact, location, sports, rating, active students, and coaching sessions.
- Added Coach admin profile drill-down with Coach details, Coach–Student relationships, and recent sessions.
- Deployed the Coach request APIs, media URL fix, and Admin Coach pages to `/var/www/tyng` over SSH.
- Ran production migrations and Laravel cache clearing; PHP syntax and route checks passed.

## Follow-up / recommended next work

- Add stored latitude/longitude to Coach and Player profiles before displaying calculated “distance away”; current `location` is text only.
- Expand the admin Coach profile with request/review/earnings tables and filters, using the data already loaded by the controller.
- Replace remaining static demo content on Coach profile/detail pages where business data is not yet available.
- Verify the Ionic dev server after a clean restart; the TypeScript config was restored after an overly broad include briefly compiled legacy test files.
