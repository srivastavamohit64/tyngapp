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

## Completed: GPS profile coordinates

- Added nullable `latitude` and `longitude` columns to Laravel users and deployed the production migration.
- Added coordinate model casting, API response fields, and live request validation.
- Updated Ionic profile saves to submit the selected GPS coordinates with the location address.
- Coordinates are now available for accurate Coach distance calculations once Coaches save their location.

## Completed: Workspace delivery rules

- Added permanent `AGENTS.md` rules requiring every live Laravel SSH change to be verified, committed with task-scoped files only, and pushed to the configured Git remote.
- Added permanent `AGENTS.md` rules requiring updates to both task-list files whenever a requested scope is completed.

## Completed: Dynamic Coach student profile

- Reworked the Coach student detail page badges and state presentation to use Ionic icons and live backend data.
- Persisted training-focus selections on `coach_students`; focus changes save immediately.
- Persisted per-skill evaluation ratings and autosave them after slider changes.
- Added private Coach student notes with a dedicated Laravel table and instant API save.
- Added backend-derived progress timeline and achievement badges from enrollment, sessions, and evaluations.
- Deployed migration/API changes to `/var/www/tyng`, ran migration, route, syntax, and cache checks, and pushed commit `31a660a` to the `developer` branch.
- Angular production build passed; existing Sass deprecation and bundle-size warnings remain.

## Completed: Coach note presentation — 23 September 2026

- Updated the Coach Student private-notes form and saved-note card spacing, borders, focus state, add action, and visual hierarchy.
- Replaced raw ISO timestamps with local, readable date/time labels and a time icon.
- Angular production build passed; existing Sass deprecation and bundle-size warnings remain.

## Completed: Coach Community chat — 23 September 2026

- Replaced the former static Coach Community examples with a live shared Coach-only realtime chat.
- Added a Coach Community section/filter and direct access button in the Coach chat inbox, plus a Coach side-menu entry and `/app/coach/community` route.
- Active Coaches are provisioned into the shared thread server-side; Players, Venues, blocked users, and inactive users cannot open it.
- Community messages use the existing Laravel persistence, push notifications, unread counts, and Firebase realtime delivery.
- Deployed and verified the production route, cleared caches, and pushed commit `44d1f25` to `developer`.
- Angular production build passed; existing Sass deprecation and bundle-size warnings remain.

## Completed: Relationship-authorized Coach chat

- Replaced the static Coach chat route with the live shared chat inbox and Coach-area conversation URLs.
- A Coach acceptance now provisions a shared private thread for that Coach and Student.
- Added direct-message authorization: Coach/Player requires an active `coach_students` relationship; Venue/Player requires a related booking; Venue/Coach requires a related coaching session.
- Moved private-thread creation, message persistence, and initial message loading through Laravel; Laravel publishes approved messages to the existing realtime inbox/message feed.
- Added Chat with Coach for accepted Players and direct Message action from Coach Student profiles.
- Deployed and verified the Laravel chat authorization update on `srv1789528`, cleared caches, and pushed commit `a6f6fad` to `developer`.
- Angular production build passed; existing Sass deprecation and bundle-size warnings remain.

## Completed: Live Coach dashboard metrics — 23 September 2026

- Removed the literal question-mark placeholders and broken currency display from the Coach dashboard.
- Student requests, coaching progress, insight copy, earnings snapshot, and the recent-activity empty state now use the live Laravel Coach dashboard response.
- Added Laravel metrics for pending student requests, today’s evaluations, and today’s completed sessions.
- Deployed and syntax/route-verified on `srv1789528`; pushed backend commit `d02b808` to `developer`.
- Frontend build was started for validation; follow-up is to complete the production bundle check if the local Angular builder remains slow.

## Completed: Dynamic Coach session planning — 23 September 2026

- Connected the Coach session wizard to live active students and approved Laravel venues, replacing its fixed player and venue cards.
- Publishing now creates a real Coach session through Laravel; selected players are validated as active and stored as a group when applicable.
- Corrected time parsing/end-time calculation so hour-only selections no longer display `NaN:NaN AM`.
- Converted the Coach Book Venue catalogue to load approved venues from Laravel rather than demo cards.
- Deployed migration/API/model updates to `srv1789528`, ran the migration and PHP checks, and pushed `962da7c` and `807df37` to `developer`.

## Completed: Dynamic previous Coach batches — 23 September 2026

- Replaced the static Previous Batch examples with real multi-student Coach sessions from Laravel.
- Selecting a previous batch restores its real student IDs in the session wizard.
- Added and verified the live Coach batch route; pushed `cd00d44` to `developer`.

## Completed: Coach venue catalogue and profile-card polish — 23 September 2026

- Fixed live venue cards to avoid demo-only rating, capacity, amenities, slot, and zero-price placeholders.
- Removed static upcoming-reservation cards from the live catalogue and clarified the booking action.
- Replaced corrupted question-mark glyphs in the dynamic Coach profile completion card with Ionic icons.

## Delivery sync — 23 September 2026

- Synced all Coach workflow, chat, dashboard, profile, venue, and task-list changes made today to the application and Laravel Git branches.

## Completed: Admin Coach operational history — 23 September 2026

- Expanded the Laravel Admin Coach profile to show student status, session and group-member history, coaching requests, evaluations, private notes, booking requests, reviews, and summary metrics.
- Deployed to `srv1789528`, cleared and rebuilt Blade views, and pushed backend commit `3725a60` to `developer`.
