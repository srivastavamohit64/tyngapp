# TYNG — Today’s Work and Progress

## Completed: Onboarding profile return path (25 September 2026)

- When Preview My Profile is opened from Coach onboarding, the Profile back button now returns directly to the Coach dashboard.
- Profile entries from other screens retain their normal history-based back behavior.
- Verified the TypeScript application check passes.

## Completed: Coach profile preview action (25 September 2026)

- Fixed **Preview My Profile** on Coach profile completion so it opens `/app/coach/profile` instead of incorrectly calling the dashboard back action.
- Added a loading spinner and disabled state while the profile screen opens.
- Verified with the Angular development build; existing Sass and unrelated template warnings remain only.

## Completed: Profile and Edit Profile back-loop fix (24 September 2026)

- Updated both Coach Profile and Edit Profile back buttons to return through navigation history.
- Removed the hard-coded Edit Profile → Coach Profile redirect that caused the two pages to loop.
- Verified the TypeScript application check passes.

## Completed: Coach Profile back navigation (24 September 2026)

- Coach Profile’s back button now returns to the page that opened it using app navigation history.
- Verified the TypeScript application check and diff validation.

## Completed: Coach cards and gallery layout (24 September 2026)

- Reduced Coach Profile gallery image size and spacing for a lighter mobile layout.
- Fixed Coach listing cards so long locations wrap inside the card and no longer overlap the profile action.
- Kept avatar, rating, and action areas at stable sizes.
- Verified the TypeScript application check and diff validation.

## Completed: Coach location suffix removal (24 September 2026)

- Removed the “away” text entirely from the Coach Profile location value.
- Verified the TypeScript application check passes.

## Completed: Coach location label cleanup (24 September 2026)

- Coach Profile now shows “Location not set” without incorrectly appending “away.”
- The “away” suffix appears only when a real Coach location is available.
- Verified the TypeScript application check and diff validation.

## Completed: Coach listing image layout (24 September 2026)

- Fixed Coach listing avatars so every profile image stays in a consistent 64×64 rounded square instead of shrinking beside long text.
- Added a matching person icon fallback when a Coach has no uploaded image.
- Verified the TypeScript check and diff validation pass.

## Completed: Coach profile image display (24 September 2026)

- Coach listings and Coach detail now render the API profile image instead of always showing the placeholder emoji.
- Added the shared media URL conversion and retained a fallback avatar when no image exists.
- Verified with the Angular development build; existing Sass and unrelated template warnings remain only.

## Completed: Coach Settings dark mode cleanup (24 September 2026)

- Removed the Dark Mode preference from Coach Settings and kept the remaining app permissions available.
- Verified the TypeScript application check passes.

## Completed: Coach Settings preferences cleanup (24 September 2026)

- Removed the App Language and Calendar Sync controls from Coach Settings as requested.
- Verified the TypeScript application check passes.

## Completed: Coach Settings cleanup (24 September 2026)

- Removed the unused **Connected Accounts** card from Coach Settings, including its Google, Apple, and WhatsApp controls.
- Verified the TypeScript application check passes.

## Completed: Coach student profile preview (24 September 2026)

- Tapping a student or pending-request profile photo now opens a student profile preview instead of leaving the page.
- The preview opens immediately with a loading spinner, then securely fetches the latest profile, request message, and coaching progress from the API.
- Coaches can still tap an active student card to open the complete student workspace.
- Verified with Laravel syntax and route checks plus the Angular development build.
- Deployed the preview API to `tyngpeople.com` and pushed the scoped Laravel change on the production `developer` branch.

## Completed: Coach students refresh on entry (24 September 2026)

- Coach **My Students** now refreshes active students and pending requests every time the page is opened, including from a notification, tab, direct link, or back navigation.

## Completed: Dynamic Coach Today’s Focus earnings (24 September 2026)

- Updated Coach Today’s Focus to include sessions created through the current Coach planning flow, not only older session records.
- Expected earnings now total the Coach fee from today’s confirmed sessions; completed sessions and session counts also include both session systems.
- The session planner now uses the Individual rate set in Coach Edit Profile as the starting fee for a new session. Existing session prices remain unchanged.
- Removed placeholder focus amounts, so the card never briefly shows mock values while live dashboard data loads.

## Completed: Coach notification routing (24 September 2026)

- Fixed Coach notification actions so a coaching booking request opens **Session requests**, while a student request opens **My Students**.
- Removed the incorrect automatic redirect from booking-request notifications to Chat.
- New backend notifications now retain their intended in-app destination.

## Completed: Coach time-based greeting refresh (24 September 2026)

- The Coach dashboard now refreshes its greeting whenever the dashboard opens, showing Good Morning, Good Afternoon, Good Evening, or Good Night based on the current time.

## Completed: Dashboard header restoration (24 September 2026)

- Restored the TYNG navigation header (menu, logo, and notifications) on both Player and Coach dashboards.
- The dashboard greeting and role-specific content remain below the shared header.

## Completed: Player and Coach dashboard header alignment (24 September 2026)

- Rebuilt the Player dashboard greeting to use the reference layout: profile photo, online status, welcome text, points shortcut, and compact location control.
- Removed the unrelated brand header from both dashboard role views so Player and Coach screens begin with their dashboard information.
- Kept each role’s relevant information while making the two openings feel like one product family.

## Completed: Coach dashboard screenshot alignment (24 September 2026)

- Matched the Coach dashboard opening viewport to the supplied screenshot by removing the brand header from the Coach view only.
- Tuned the greeting and Today’s Focus card spacing, border, shadow, and sizing for the reference layout.
- Player home keeps its existing brand header.

## Completed: Coach student search fix (24 September 2026)

- Fixed the Coach **My Students** search so the list updates while typing.
- Search now matches student names and sports and shows a clear message when there are no matches.
- Verified with the Angular development build; build completed successfully with existing Sass deprecation warnings only.

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

## Completed: Admin Coach page layout fix — 23 September 2026

- Fixed the production Admin Coach profile 500 error caused by extending a non-existent Blade layout.
- Rebuilt production Blade views and pushed Laravel commit `a222795` to `developer`.

## Completed: Laravel merge conflict resolution — 23 September 2026

- Resolved the active `git pull origin developer` conflicts in the coach API controller, chat service, and API routes while preserving local and remote functionality.
- Verified no unmerged entries or conflict markers remain; PHP syntax checks and the coach route listing pass.
- Changes remain uncommitted and unpushed as requested.

## Planned: Coach schedule end-to-end workflow — 23 September 2026

- Audited the schedule UI, coach planning flow, venue booking flow, Laravel APIs, and the available Figma reference.
- Identified that the schedule currently uses mock data; production implementation requires API-backed coach sessions, player visibility/notifications, and a real venue reservation linkage.
- Figma Make design context could not be inspected because the connected account lacks edit access; implementation awaits approval and/or access.

## Planned: Coach multi-venue scheduling architecture — 23 September 2026

- Defined the approved planning direction: coaches may hold permanent partnerships with multiple venues, each with recurring availability and commercial rules, while retaining one-off venue booking.
- Prepared the implementation scope covering partnerships, venue-controlled reservations, player invitations and RSVP, schedule views, notifications, attendance, completion, and evaluation flows.

## Completed: Exported Figma code review — 23 September 2026

- Reviewed `E:\TYNG APP` as the available design source, including coach schedule, session creation/detail, venue coach-management, availability, and calendar screens.
- Confirmed the intended workflow includes venue-aware time slots, participant invitations, automatic session chat/reminders/attendance, per-student payment allocation, and venue-wide facility conflict management.

## Planned: Final coach scheduling implementation — 23 September 2026

- Finalized the implementation plan against the exported Figma code and existing Ionic/Laravel architecture, separating venue employment from multi-venue coach partnerships.
- Scope is ready for approval: database/API foundation, live schedule, venue reservations, player RSVP, financial allocation, notifications, attendance, completion, and verification.

## Completed: Senior architecture review for Coach Scheduling & Venue Partnerships — 23 September 2026

- Produced `E:\xampp\htdocs\tyng\docs\coach-scheduling-venue-partnership-architecture.md`, a production-readiness redesign based on the Figma export, Ionic application, Laravel Coach module, and existing booking domain.
- Documented target workflows, ERD, normalized schema, API contracts, lifecycle and sequence diagrams, authorization, conflict locking, commerce/settlement, edge cases, notifications, reporting, scalability, migration strategy, and phased delivery.
- No application code, database schema, live-server configuration, Google Cloud configuration, commits, or deployments were changed.

## Completed: Coach scheduling foundation — 24 September 2026

- Added a dedicated scheduling domain: coach/venue partnerships, court-backed coaching sessions, normalized participants, reservation records, and database-enforced 15-minute court allocation locks.
- Added protected Coach and Venue APIs for bookable facilities, session creation, partnership requests, session approval, and schedule retrieval; legacy sessions remain visible during the transition.
- Updated the Coach Planner to select a real venue facility and submit it to the reservation API. Updated My Schedule to load real schedule data rather than the prototype data set.
- Integrated the existing venue-booking availability check with coaching reservations, preventing a standard booking from overlapping an active coaching session.
- TypeScript compilation, PHP syntax validation, route registration, and diff whitespace checks pass locally. Local migration execution is unavailable because local MySQL is stopped; live migration and route verification are required during deployment.
- Corrected scheduling venue images to use the Laravel media URL resolver and the Ionic media URL resolver, with a local fallback image when a venue has not uploaded a cover photo.

## Completed: Coach session setup navigation — 24 September 2026

- Made each of the eight progress indicators clickable, with accessible labels and current-step state, so coaches can jump directly between setup steps.
- Kept the publish action protected by final server-side validation.
- Prevented incompatible venues/courts from being selected for the chosen sport, and reset the court selection when the coach changes to an unsupported sport. This addresses the validation message visible on the Review step.
- TypeScript check passes.

## Completed: Sport-specific venue facilities — 24 September 2026

- The venue list and the selected venue's facility list now both show only facilities that support the sport chosen in step 1.
- This prevents unrelated facilities (for example, tennis courts in a cricket session) from appearing in venue selection.

## Completed: Coach response to player session requests — 24 September 2026

- Added Accept and Decline actions to pending player booking requests.
- Added a coach-owned response endpoint with pending-state locking, duplicate-response protection, and player notification.
- Accepting adds the player to the coach's active student list; the player is told to message the coach to confirm a date and time because the original request does not reserve a time slot.

## Completed: Application-wide mobile UI quality refinement â€” 24 September 2026

- Completed a source-based audit of every routed Player, Coach, Venue, Admin, authentication, onboarding, profile, booking, finance, map and chat screen. Findings and priorities are recorded in `UI_UX_AUDIT.md`.
- Added a semantic visual foundation for consistent surfaces, borders, elevation, responsive control heights, readable brand text, focus rings and reduced-motion support.
- Polished shared headers, tab chrome, cards, primary/secondary actions, form controls, search, filters, segments, badges, skeletons, empty states, notification banners, map controls, booking cards and venue cards.
- Added graceful image fallbacks for reusable venue cards, avatars and image carousels so absent media does not render as a broken browser image.
- Preserved all routes, navigation, page layouts, data bindings, service calls and business workflows; this pass changes presentation and interaction feedback only.
- `npx ngc -p tsconfig.app.json` and `npm run build` pass. The build retains pre-existing Sass import deprecation, optional-chain advisory and style-budget warnings. A connected-browser/device visual regression pass remains the recommended release check because no in-app browser was available in this workspace.

## Completed: Coach Schedule create button refinement - 24 September 2026

- Corrected the empty-state Create Session button sizing, typography, shape, contrast and tap/focus feedback.
- Kept its existing destination and session creation flow unchanged.

## Completed: Coach schedule participant image and identity - 24 September 2026

- Fixed coach schedule profile photos by converting backend-relative image paths into public backend media URLs.
- Added an initials fallback when a player's photo is missing or cannot load.
- Made the requesting player's name and request status visible in the session participant row; the confirmed count remains visible.
- No navigation, booking workflow, or backend/cloud configuration was changed.

## Completed: Live Coach session details and Admin operations overview - 24 September 2026

- Replaced the session-detail demo fallback with a Coach-owned API lookup for current and older scheduled sessions; an unknown ID now shows a clear error instead of the first demo session.
- Connected participant names/photos, venue/court, date/time, status, session description and listed price breakdown to persisted session data.
- Made Coach session notes save to the correct session and attendance changes persist per player for both current and legacy sessions.
- Removed fabricated venue amenities, payment-completed claims, assistant tips and unrelated activity from the visible session detail.
- Added an admin-only overview API and dashboard section for Coach/Venue/Player counts, partnerships needing review, venue approval queue, player names, recent current/legacy sessions and listed session value.
- PHP syntax/route checks and the Angular production build pass; the build reports only existing Sass deprecation, optional-chain, and style-budget warnings.
- The local Laravel database is unavailable on 127.0.0.1:3306, so local database checks remain pending. The migration, route registration, syntax checks and cache refresh were completed on the live server.

## Completed: Coach session navigation and attendance actions - 24 September 2026

- Connected both Navigate buttons on the Coach session detail screen to Google Maps directions using the session's venue and address.
- Made the Attendance button scroll to the player roster using Ionic's scrolling API, so it works within the page's scroll container.
- When a venue has not approved a session yet, the attendance action explains that attendance becomes available after approval; recording remains tied to the existing attendance API.
- Directions show a clear message if the session does not yet have a confirmed venue location.
- `git diff --check` passed. No build or tests were run for this focused interaction fix.

## Completed: Coach gallery, profile information and verification documents - 24 September 2026

- Deployed the Coach gallery to the live API. Coaches can upload, preview and remove profile photos, training photos, videos and certificates from profile completion or Edit Profile.
- Replaced the verification placeholders with private Government ID, Coaching Certificate and Professional Profile Photo uploads. Each document can be previewed, replaced or removed by its owner; the app only treats verification as submitted after all three documents are present.
- Made the Coach profile-completion choices persistent: languages, locations, travel radius, formats, equipment, trial preference, travel mode, weekly availability, pricing, bio and achievements now load again after reopening the app.
- Expanded Laravel Admin Coach Management with the complete saved profile details, gallery and secure verification-document download links. The admin Coach list now shows gallery and verification submission counts.
- Applied the `coach_media`, `coach_profile_details` and `coach_verification_documents` migrations on the live server, cleared relevant caches, and verified the live routes and Blade templates. Angular compilation and PHP syntax checks pass with only existing Angular warnings.
- Deployed and pushed the backend on `developer` as `e2e6732` and the Ionic frontend on `master` as `f9e2946`.

## Completed: Coach profile prefill and completion-sync correction - 24 September 2026

- Fixed the Coach dashboard percentage so it uses the same 12 sections as the Coach completion screen, including saved gallery media and all three verification documents.
- Added automatic draft saving while a Coach updates profile information. Saved values now reload when returning to Complete Profile, even if the Coach leaves without pressing a section button.
- Refreshes the signed-in profile after saving so the dashboard percentage updates without requiring the Coach to log in again.
- Angular compilation and PHP syntax checks pass with only existing Angular warnings. The live Laravel change was pushed as `eb62dba`.

## Completed: Venue approval now updates Coach schedules - 24 September 2026

- Added the Venue Bookings view for coaching sessions, alongside normal venue bookings, so venue staff can review and accept the real coaching-session request.
- Connected Accept to the dedicated approval process. Approval now confirms the session, confirms its court reservation and sends the player invitation together.
- Corrected the already accepted Mohit Session through the same approval process. It now shows as Confirmed to the Coach and the player invitation shows as sent.
- Verified the live API route, PHP syntax and Ionic Angular compilation. The backend is live and the frontend changes are ready to publish.

## Completed: Coach session approvals on the Venue Dashboard - 24 September 2026

- Added a clear Coach Session Requests panel near the top of the Venue Dashboard. Venue staff can approve a request directly from this panel or review it in Bookings.
- The approval button confirms the selected session, keeps its court reserved and sends player invitations; only the venue can perform this action.
- The dashboard now counts coaching-session requests with normal venue booking requests.
- Removed a duplicate initial dashboard refresh, reducing the number of profile, dashboard and location calls when a venue first opens the app.
- The live dashboard API and Ionic Angular compilation were verified successfully.

## Completed: Google Maps API key environment alignment - 24 September 2026

- Set the requested Google Maps API key in the Angular `.env` and regenerated `environment.generated.ts` through `scripts/sync-env.js`.
- Set `GOOGLE_MAPS_API_KEY` in the local Laravel `.env` and live Laravel `/var/www/tyng/.env`.
- Confirmed the live hostname is `srv1789528`, cleared Laravel configuration cache, and verified the live environment entry with the key masked.
- No tracked Laravel files belonged to this environment-only change; pre-existing unrelated live working-tree changes were left untouched.

## Completed: Coach session notes design - 24 September 2026

- Refined the Coach Session Details notes card with a clearer private-notes header, helper copy, icon treatment and character counter.
- Improved the editor surface with a stronger focus state and responsive vertical sizing.
- Added visible saving/saved states, spinner feedback and a consistent save button treatment.
- `git diff --check` passed and the Angular production build completed successfully with only existing project warnings.
- Browser visual verification was unavailable because no browser session was connected.

## Completed: Coach weekly availability persistence and design - 24 September 2026

- Fixed weekly availability updates to replace the availability map immutably, so the autosave draft detector reliably sees every slot change.
- Added availability save-state feedback, loading feedback on Save & Next, retry/error messaging and a clear-all action.
- Redesigned the availability section into day cards with selected-slot counts, time-window buttons and a clearer weekly overview.
- Confirmed the live `weekly_availability` migration is applied on `srv1789528`; Angular production build and `git diff --check` passed with existing project warnings only.
- Browser visual verification was unavailable because no browser session was connected.

## Completed: Coach profile completion prompts and edit profile coverage - 24 September 2026

- Removed the Coach dashboard and side-menu completion prompts once the profile reaches 100%.
- Added all Complete Profile information to Coach Edit Profile: languages, coaching locations, travel radius, training formats, equipment, trial settings, session arrangement, weekly availability, pricing, achievements and bio.
- Added Coach verification document replacement and removal from Edit Profile, alongside the existing gallery management.
- Edit Profile now loads and saves these Coach details using the same account information as Complete Profile.
- Angular production build and `git diff --check` passed with existing project warnings only.

## Completed: Live Coach Schedule message and session counts - 24 September 2026

- Replaced the fixed “3 Unread” message value in the Coach Schedule summary with the live unread Chat count.
- Made the New Messages summary open Coach Chat when selected.
- Replaced the fixed side-menu Schedule badge with the real count of active today/upcoming Coach sessions; completed, cancelled, rejected and expired sessions are excluded.
- Replaced the fixed pending-reschedule display with the actual pending session-request count.
- Angular production build and `git diff --check` passed with existing project warnings only.

## Completed: Coach Insights design refresh - 24 September 2026

- Refined the Coach Insights page with a clearer page header, explanatory section labels, calmer card borders and shadows, and more consistent spacing on mobile and larger screens.
- Made the calendar icon open the Coach Schedule and added accessible labels for the header actions.
- Replaced the outdated Complete Profile prompt with an Edit Profile prompt, so a fully completed Coach is not asked to complete the profile again.
- `git diff --check` passed and the local Angular application shell responds successfully. The production build runner did not return its final status summary; browser visual verification remains unavailable because no browser session is connected.

## Completed: Wallet Ionic Segment navigation - 24 September 2026

- Reorganised the Wallet page into native Ionic segments: Wallet, TP Points and Gift Cards.
- Each segment displays only its related content while retaining the existing top-up, points conversion, gift-card creation, redemption and history actions.
- Added mobile-friendly Ionic segment styling and a short transition between panels.
- Corrected the Ionic segment value type so the Wallet page compiles with the current Ionic component definition.
- `git diff --check` passed, the production build process completed, and the local Angular application shell responds successfully. Browser visual verification remains unavailable because no browser session is connected.

## Completed: Coach Profile back navigation - 24 September 2026

- Added a clear Back button to the Coach Profile header.
- It returns to the preceding screen when available, with Coach Dashboard as the safe direct-link fallback.

## Completed: Live Admin Bookings pagination repair - 24 September 2026

- Corrected the broken pagination layout on the live Admin Bookings page by using the Bootstrap pagination template that matches the Admin dashboard.
- This prevents the duplicate responsive pagination controls and oversized arrow graphics caused by Tailwind pagination markup on the Bootstrap page.
- Verified SSH host `srv1789528`, cleared the live compiled-view cache, and pushed the live Laravel fix on `developer` as `e67aaa9`.

## Completed: Client task-list role correction - 24 September 2026

- Reorganised the client-facing feature summary so Wallet is shown under Player and Booking controls are shown under Admin.
- Removed internal server and repository notes from the client-facing document.

## Completed: Client task-list delivery summary - 24 September 2026

- Rebuilt `tasklistnew.txt` from completed task-list items 20–47 only, excluding planning and review work that did not create a user-facing change.
- Grouped the delivered changes into Coach, Player, Venue Staff, Admin and All App Users using client-friendly language.

## Completed: Repository update status - 24 September 2026

- Pushed the outstanding Angular Wallet, Coach Profile and task-list updates to `master` as `93ac795`.
- The live Laravel Admin Bookings repair remains pushed on `developer` as `e67aaa9`.
- Left the local Laravel checkout unchanged: it has existing modified/untracked files, one local-only commit and 25 remote commits to receive, so automatic synchronization could risk mixing unrelated work.

## Completed: Laravel local and live synchronization - 24 September 2026

- Confirmed the live Laravel server is on `developer` commit `e67aaa9`, matching its remote branch, and preserved its unrelated working files in named Git stashes before cleaning the checkout.
- Preserved the local Laravel checkout's prior working files in a named stash and its local-only commit on `backup/local-developer-presync-2026-09-24`.
- Aligned the local Laravel `developer` branch with `origin/developer`; local, live server and remote now point to `e67aaa9` with no ahead/behind commits.
# Completed: Coach Insights date-driven dashboard - 25 September 2026

- Refined the Coach Insights page with consistent chips, metric cards, action states and responsive styling.
- Added a header calendar popup so coaches can select a date and refresh the insight metrics for that day.
- Connected the page to the existing dashboard, sessions, schedule and booking-request APIs, including loading, retry and error states.
- Verified the Angular TypeScript compilation and Git diff checks successfully.
# Completed: Coach Insights filter chip design - 25 September 2026

- Restyled the insight period chips with consistent sizing, spacing, active-state emphasis, focus styling and mobile horizontal scrolling.
- Preserved the existing period selection behavior and added accessible tab semantics.
# Completed: Fully dynamic Coach Insights data - 25 September 2026

- Removed the artificial `50` growth-index baseline; coaches with no measurable activity now see `0`.
- Added and deployed `GET /api/coach/insights`, supporting selected date and period filters with real sessions, booking requests, students, evaluations, reviews, earnings, completion, acceptance and retention metrics.
- Connected the full Insights page sections to the API, including growth, performance cards, business metrics, student growth, retention, review highlights, funnel and sparklines.
- Verified live host `srv1789528`, cleared Laravel caches, committed and pushed Laravel changes on `developer` as `7c368b7`.
- Verified PHP syntax, route registration, Angular TypeScript compilation and production Angular build. Existing Sass deprecation and unrelated optional-chain warnings remain.
# Completed: Coach Insights analytics and mobile polish - 25 September 2026

- Rebuilt Coach Insights as a typed, API-driven mobile screen with compact Playo-inspired hierarchy, responsive cards, readable labels, sticky filters, honest empty states and a calendar bottom sheet.
- Made all period chips reload real data and removed the unused hardcoded fallback metrics.
- Added explainable analytics for profile views, bookings, acceptance, completion, earnings, student evaluations, improvement, retention, reviews, funnel conversion and server-generated sparklines.
- Added daily coach-profile view tracking with a new migration and replaced unavailable tournament/referral claims with measurable active-student and evaluation coverage metrics.
- Added `docs/coach-insights-plan.md` documenting metric formulas, API contract, mobile rules and verification.
- Local Laravel feature tests passed (3 tests, 8 assertions); Angular TypeScript and development production-style build passed with existing unrelated warnings.
- Deployed migration and API changes to `srv1789528`, verified a real service payload, cleared caches, and pushed live Laravel commit `fa923cf` on `developer`. The server test runner lacks the SQLite PDO extension, so the same passing feature suite could not execute on the server.

# Completed: Coach player evaluation redesign - 25 September 2026

- Rebuilt the Coach Player Evaluation screen to match the supplied mobile reference and the `E:\\TYNG APP` implementation: compact header, visible player cards, four 1-5 rating rows, feedback fields and a lime save action.
- Kept the screen dynamic with accepted students from the coach API, real profile images and sport fallbacks, evaluation saving, validation, loading, empty, retry, success and error states.
- Added responsive sizing, selected/rating feedback, accessible controls and safe back navigation.
- Verified Angular TypeScript compilation, the development Angular build and Git diff checks successfully.

# Completed: Dynamic coach student enrolment flow - 25 September 2026

- Rebuilt `/app/coach/enroll-student` as a fully API-driven mobile wizard for existing TYNG players, shareable player invitations and coach-managed student profiles.
- Added real debounced player search, live reusable batch loading, native/web profile-photo selection, server validation, loading/error states and dynamic success summaries.
- Existing-user enrolment now lists every eligible TYNG player by default; typing filters the list and clearing search restores all available players.
- Persisted managed student, guardian, medical, coaching, membership and training data; selected batches now link the student to matching upcoming sessions.
- Added secure invitation records, matching-player validation, player accept/decline screen, deep-link return after login or first-time onboarding, and pending invitation sharing from My Students.
- Updated My Students and student profile pages to show pending invitations and saved managed-profile details.
- Local Laravel feature tests passed (3 tests, 25 assertions); Angular TypeScript and development builds passed. Local MySQL migration was unavailable because the local MySQL service was stopped, while the isolated test database ran the migration successfully.
- Deployed the Laravel API and migration to live host `srv1789528`, verified protected HTTP routes, cleared caches, and committed/pushed live backend commits `22394c5`, `0e69a0e` and `7aba941` on `developer`.

# Completed: Player evaluation history archive - 25 September 2026

- Restored the clipboard action in the Player Evaluation header and connected it to the persisted coach-evaluation API.
- Added a mobile history sheet showing each saved date, overall score, four skill ratings, strengths, improvement areas and coach notes for the selected player.
- Added retry, empty, loading and paginated “load older” states so every past evaluation remains accessible rather than showing only recent records.
- Verified Angular TypeScript compilation, the Angular development build and Git diff checks successfully.

# Completed: Shareable off-platform student invitations - 25 September 2026

- Updated Invite to TYNG so saving a new-player invitation immediately opens sharing choices for WhatsApp, Messages, email, native social apps and copy.
- Added a mobile joining guide for coaches and recipients: use the invited phone/email, create or sign in to a Player account, complete onboarding, accept, and appear automatically in My Students.
- Added an admin-editable invitation message under Laravel Admin Settings with `{student_name}`, `{coach_name}` and `{invite_url}` placeholders; the secure URL is always included.
- Added the absolute share URL, customized message, recipient status and joining steps to the invitation API, while retaining secure phone/email matching before acceptance.
- Verified Angular TypeScript and development builds, PHP syntax, Blade compilation, protected live routes and 4 local Laravel tests (36 assertions). The live CLI test runner lacks SQLite support, so its feature suite could not start there.
- Deployed migration batch 29 to `srv1789528`, cleared Laravel caches, and committed/pushed backend commit `9ab1a7a` on `developer`.

# Completed: Evaluation history icon visibility - 25 September 2026

- Restored the Player Evaluation top-right history action as an always-visible green clipboard button with a reliable inline SVG.
- Removed the selection-dependent disabled appearance; the action now uses the selected player or the first available player and keeps the existing evaluation-history sheet functionality.
- Verified Angular TypeScript compilation and Git diff checks successfully.

# Completed: Dynamic coach venue booking flow - 25 September 2026

- Rebuilt `/app/coach/book-venue` with real approved venues, courts, pricing, hours, images, sports, amenities, search, filters, retry/empty states and upcoming reservations.
- Rebuilt `/app/coach/venue-booking` as a six-step mobile flow for court, date, duration and available time, active students, session details, rental equipment, live pricing, review and confirmation.
- Added `GET /api/coach/scheduling/availability`; available times now respect venue operating days/hours, slot intervals, elapsed times, existing games, legacy sessions, confirmed reservations and active approval holds.
- Connected confirmation to the real scheduling API so it persists the coach session, court reservation, student invitations, equipment selections and price snapshot, with duplicate-slot protection and validation against closed/unapproved venues.
- Local Laravel tests passed (2 tests, 19 assertions); Angular TypeScript and production builds passed with existing unrelated Sass and template warnings.
- Deployed the Laravel API to live host `srv1789528`, verified syntax, route registration, cache clearing and protected HTTP behavior, then committed/pushed backend commit `e404381` on `developer`.

# Completed: Dynamic coach dashboard discovery sections - 25 September 2026

- Replaced the Coach Dashboard's sample venue cards with approved venues, real media/location data and live one-hour availability counts across each venue's active courts for today.
- Connected each venue card directly to its selected booking flow and corrected See All to open the coach venue catalogue.
- Replaced sample community cards with upcoming published public venue events, including real dates, times, venues, registrations and cover images; empty data now has an honest coach-community action.
- Kept recent reviews driven by published coach reviews, changed View All to Coach Insights, and added a real empty state.
- Made the milestone card derive from completed session totals and added cached coordinate-based current weather with honest missing-location/provider fallbacks.
- Corrected Need Help to open Coach Chat instead of Settings and added polished loading, retry and empty states.
- Local Laravel tests passed (4 tests, 43 assertions); Angular TypeScript and production builds passed with existing unrelated warnings.
- Deployed and verified the API on `srv1789528`, including live weather-provider connectivity, then committed/pushed backend commit `9607d6d` on `developer`.

# Completed: Coach menu analytics deduplication - 25 September 2026

- Removed the duplicate Coach Insights entry from the coach side menu.
- Retained the Analytics menu entry and the `/app/coach/insights` route so dashboard analytics links continue to work.
- Verified Angular TypeScript compilation successfully.

# Completed: Coach menu header logout - 25 September 2026

- Moved the coach logout action from the bottom of the side menu into a compact top-right header icon.
- Preserved the existing logout confirmation dialog and added accessible label, focus and pressed states.
- Removed the duplicate bottom logout row from the coach menu only; venue and player menus remain unchanged.

# Completed: Reliable venue profile current location - 25 September 2026

- Corrected the shared location service so simultaneous callers reuse one GPS request instead of launching competing native reads and permission prompts.
- Removed the redundant GPS availability probe, allowed a recent two-minute OS location fix, and retained clear permission, disabled-GPS, unavailable and timeout errors.
- Made Choose from map display its picker in about 0.7 seconds using a saved/default fallback, then automatically recenter and resolve the address when the current GPS fix arrives.
- Moved existing-address geocoding into the background so a slow Google response no longer blocks the map, while protecting a location the user has already moved manually.
- Confirmed Android coarse/fine location permissions, Angular TypeScript compilation, the Angular development build and Git diff checks.

# Completed: Venue pricing numeric keyboard stability - 25 September 2026

- Fixed the Edit Venue Profile pricing inputs dismissing the mobile numeric keyboard after each digit.
- Added stable facility-ID tracking to the Step 5 pricing-card loop so hourly, peak, weekend and cancellation price updates no longer destroy and recreate the focused input.
- Verified Angular TypeScript compilation, the Angular development build and Git diff checks successfully.

# Completed: Coach venue-booking dev-server compilation recovery - 25 September 2026

- Confirmed `coach-venue-booking.page.ts` exists, remains tracked, and is reachable from the lazy route; no source or `tsconfig` restoration was required.
- Removed the stale/overlapping webpack development processes and restarted one clean Angular server on port 8100.
- Verified the app root returns HTTP 200 and the generated coach venue-booking lazy bundle returns HTTP 200 with the current component code.

# Completed: Player and venue drawer header logout - 25 September 2026

- Added the same top-right logout icon used by the coach drawer to the player and venue drawer headers.
- Removed the bottom logout controls from the player and venue drawers while retaining the shared logout confirmation flow.
- Reused accessible label, title, styling, and focus/tap states for all three roles.

# Completed: Client-facing summary updated after 24 September 2026, 10:21 PM

- Restored the existing plain-language feature summary in `tasklistnew.txt` and preserved its writing rule.
- Added the completed post-cutoff Coach, Player, Venue Staff and app-wide changes, including insights, evaluations, enrolment/invitations, venue booking/dashboard, logout icons, current-location selection and stable price entry.
- Kept the summary focused on what app users can do and left out internal implementation and server details.
- Checked the three task-list files for whitespace errors.

# Completed: App and Laravel Git/production synchronization - 25 September 2026

- Pushed the Angular app updates and task documentation to `master` as `ffdaf1f`.
- Fast-forwarded local Laravel `developer` to the existing remote feature commits, then committed and pushed the notification destination fix as `c24f4f0`.
- Updated live host `srv1789528` at `/var/www/tyng` to `c24f4f0`; the server and GitHub branch are aligned and the live worktree is clean.
- Cleared Laravel caches, confirmed notification resource PHP syntax, and verified all three September migrations are already applied.
- Preserved the pre-existing local Laravel safety stash `codex-presync-local-2026-09-24`.

# Completed: Player home redesign reference audit and implementation plan - 26 September 2026

- Reviewed all eight client screenshots and all 22 supplied SVG sport icons for the redesigned Player Home and expanded sports selector.
- Traced `/app/home` to the active standalone `pages/home/home.page.*` implementation, identified the legacy `pages/player/player-home.page.*` files that must not be edited, and mapped the existing location, nearby-game, ad, venue, coach, routing and bottom-tab foundations.
- Defined the implementation scope for the reference header/search, sport rail, promotional carousel, Play/Book/Train actions, nearby games and venues, tournaments, top coaches, floating Create Game action, reference-style tab bar and categorized More Sports view.
- Added the sport-rail interaction requirement: tapping a sport icon will open a mobile bottom drawer filtered to that sport's ongoing/nearby games, using horizontally scrollable host/game cards with host identity, game title, schedule, venue/distance, participant stack, remaining spots and Join price/action as shown in the client reference.
- The drawer will preserve the clicked sport as its active context, use real nearby-game data, and provide appropriate loading, empty, error, dismissal and card-navigation behavior.
- Confirmed that green UI accents should reuse the existing TYNG neon token `--app-primary: #8cf000` consistently instead of introducing additional page-specific green values.
- No application code, backend code, database state or deployment was changed during this planning-only audit; the connected browser had no available session, so live visual comparison remains part of implementation verification.

# Completed: Client-reference Player Home redesign - 27 September 2026

- Rebuilt the active `/app/home` Player experience to match the supplied mobile references while leaving the Coach and Venue dashboards unchanged.
- Added the location/notification/profile header, search and filter bar, supplied sport-icon rail, three-card promotional carousel, Play/Book/Train actions, horizontally scrolling nearby games and venues, tournament card, dynamic top-coach cards and floating Create Game action.
- Added a full-screen searchable sports catalogue with the requested categories, BOX badges, selected state and all supplied SVG sport icons plus the reference Suggest a sport action.
- Added the requested sport interaction: tapping a home or catalogue sport opens a dismissible bottom drawer containing real nearby ongoing games filtered to that sport, presented as horizontally scrolling host cards with schedule, venue, players, open spots, price and Join navigation.
- Preserved the existing shared app header and bottom navigation unchanged; all visual work is scoped to the Player Home content and its Home-only overlays.
- Retained live location, nearby-game/realtime, coach and route integrations with loading, retry and empty states; the final Home-only emerald palette is documented in the visual-finish correction below.
- Angular TypeScript compilation and the optimized production build passed. The running development server returned HTTP 200 for the app root and new SVG assets; the existing server configuration still returns HTTP 404 for direct `/app/home` HTTP requests, while client-side navigation remains available.
- No Laravel/backend change, database migration or production deployment was required for this frontend-only task.

# Completed: Player Home scope and profile sizing correction - 27 September 2026

- Restored the existing shared app header on `/app/home` and fully reverted the shared tab-shell, bottom-navigation and Angular budget changes so no other page inherits this redesign.
- Kept the redesign scoped to the Player Home content and Home-only modal/drawer classes.
- Constrained the Home profile photo to an explicit 34-by-34-pixel circle inside its 46-pixel action button and removed duplicate safe-area top spacing beneath the restored app header.
- Reverified the final scoped implementation with Angular compilation, production build and Git diff checks.

# Completed: Player Home reference palette and finish correction - 27 September 2026

- Rechecked all eight client screenshots and sampled their main surface and accent colors instead of inheriting the app-wide yellow-neon theme.
- Scoped the reference emerald (`#0cbb60`), charcoal (`#0f1e17`), muted sage-gray, soft-green and `#f4f6f5` canvas palette to Player Home and its two Home-only overlays, leaving all shared and non-Home styling unchanged.
- Added the clean white rounded location/search surface and refined borders, shadows, promotional/action gradients, card text contrast and green button treatments to match the supplied finish.
- Corrected the visual proportions of the sport rail, host identity pill, action subtitles and coach identity panels while retaining the previously corrected 34-pixel profile photo.
- Verified the correction with the optimized Angular production build and Git diff checks; the browser integration had no connected local session, so verification used the complete supplied screenshot set plus compilation.

# Completed: More Sports search and drawer handoff - 27 September 2026

- Fixed the More Sports search to filter immediately using normalized partial terms, spaces, hyphens and useful aliases such as soccer, futsal, ping pong and bike.
- Replaced the unreliable timed overlay transition with Ionic's completed modal-dismiss event so selecting a sport consistently closes the catalogue and opens the same ongoing-games bottom drawer used by the Home sport rail.
- Added related-sport family matching for Box cricket, Box football, Lawn tennis and Marathon so their drawer can include applicable nearby games rather than incorrectly appearing unrelated or empty.
- Kept the change inside Player Home and verified it with the optimized Angular production build and Git diff checks.

# Completed: Discover player-card image and layout correction - 27 September 2026

- Fixed the Discover Players card photo being flex-shrunk into a thin strip by the viewport-constrained card deck.
- Added a protected responsive photo height so the complete player image plus availability, badge and distance overlays remain visible.
- Compacted and stabilized the detail layout so player summary, sport badges, four metrics, mutual-friend count and rating fit cleanly without distorting the card.
- Scoped the correction to `/app/discover` and verified it with the optimized Angular production build and Git diff checks.

# Completed: Player Home neon promotion contrast update - 27 September 2026

- Updated the green Player Home promotion to the app's lighter neon gradient ending at `#8cf000`.
- Explicitly kept the NEW badge, promotion heading and supporting copy white, with a subtle text shadow for readability over the light neon finish.
- Kept the change scoped to the Home promotion component and verified it with the optimized Angular production build and Git diff checks.

# Completed: Player Home tournament-card contrast correction - 27 September 2026

- Restyled the Tournament card with the app's dark navy surface and neon green accent treatment shown in the supplied points-card reference.
- Forced the tournament title to white, details to readable light gray, and the sport label, trophy and Register action to neon green so global typography colors cannot make the content disappear.
- Kept the change scoped to the Player Home tournament card and verified it with the optimized Angular production build and Git diff checks.

# Completed: Dynamic Player Home tournament section and public events API - 27 September 2026

- Replaced the hard-coded Home tournament with the next real published public tournament returned by the Laravel API, including its sport, format, name, date, prize/entry information and event-detail navigation.
- Added an honest loading state and hide the section when no eligible tournament exists; undated published tournaments display “Date to be announced” instead of fabricated dates.
- Added authenticated `GET /api/events/upcoming` with future/undated, published and public filtering, chronological ordering and a bounded result limit.
- Added two Laravel feature tests covering visibility/status/date filtering, ordering and result limits; both tests passed, and the optimized Angular production build passed.
- Deployed the endpoint directly to live host `srv1789528` in `/var/www/tyng`, cleared Laravel caches, verified the live route and PHP syntax, then committed and pushed backend branch `developer` as `9aa49a7` with a clean live worktree.

# Completed: Player Home promotion screenshot matching correction - 27 September 2026

- Matched the Home promotion card to the supplied reference with a compact `1.74:1` shape, 22-pixel corners and an emerald `#08a956` to `#13c96e` gradient.
- Refined the white heading, supporting copy, NEW badge and white Create game button to reproduce the screenshot's spacing, scale and contrast.
- Rebuilt the subtle right-side football-pitch artwork using Home-scoped CSS and verified the result with the optimized Angular production build and Git diff checks.

# Completed: Dynamic Player Home top-coaches section - 27 September 2026

- Removed the Arjun Rao and Meera Shah demo cards and fixed the Home loader to read the real paginated `/api/coaches` response.
- Added rating-based top-coach ordering, real individual hourly fees from each coach profile, and honest loading, retry and empty states while preserving the supplied card design.
- Added a Laravel feature test that passed locally with five assertions; the optimized Angular production build also passed.
- Deployed directly to live host `srv1789528` in `/var/www/tyng`, verified PHP syntax and a real production response containing current coaches and fees, then committed and pushed backend branch `developer` as `beb618f` with clean live and local backend worktrees.

# Completed: Player Home tournament text visibility correction - 27 September 2026

- Added dedicated high-specificity tournament typography classes so the global light-theme heading color cannot make the dynamic tournament name disappear.
- Matched the supplied second screenshot with a white tournament title, mint sport/format label, readable sage metadata, dark emerald card, mint trophy treatment and white-on-emerald Register button.
- Kept the correction scoped to the Player Home tournament card and verified it with the optimized Angular production build and Git diff checks.

# Completed: Player Home location drawer layout restoration - 27 September 2026

- Added a dedicated location-modal class so Ionic's global overlay receives the intended Home drawer styling instead of losing component-scoped layout rules.
- Restored the full-width centered sheet, safe horizontal padding, rounded address cards, location icons, selected checkmark, readable headings and aligned Manage saved addresses action.
- Constrained every sheet element to the viewport to prevent the left-side clipping and horizontal overflow shown in the regression screenshot.
- Kept the correction scoped to the Player Home location drawer and verified it with the optimized Angular production build and Git diff checks; no connected browser session was available for direct screenshot capture.

# Completed: Coach profile history-aware Back navigation - 27 September 2026

- Changed the Back button on `/app/coaches/:id` to return through Angular browser history instead of always forcing the coach directory.
- Profiles opened from Player Home now return to Home, while profiles opened from the coach directory return to that directory; direct visits safely fall back to `/app/coaches`.
- Verified the navigation change with the optimized Angular production build and Git diff checks.

# Completed: Player Home sport-games drawer clipping correction - 27 September 2026

- Constrained the sport-games Ionic modal, content part and sheet to the full viewport width with explicit border-box sizing and horizontal overflow protection.
- Restored the complete `ONGOING GAMES` label, selected-sport heading, supporting description and close action with safe 18-pixel side padding.
- Stabilized the empty-state card width so centered content and left-aligned drawer content use the same viewport bounds.
- Kept the correction scoped to the Player Home sports drawer and verified it with the optimized Angular production build and Git diff checks.

# Completed: Local Player Home stylesheet refresh and drawer verification - 27 September 2026

- Traced the repeatedly clipped drawer text to the long-running Angular dev server serving a stale `styles.css`, rather than to the updated modal rules.
- Safely restarted only the TYNG Angular process bound to port 8100 and allowed it to rebuild from the current workspace.
- Verified `localhost:8100/styles.css` now contains the sport-drawer width rules, location-drawer restoration and tournament typography correction; the current stylesheet size changed from 173,405 to 179,541 bytes.

# Completed: Consistent priced coaches on Player Home - 27 September 2026

- Confirmed production currently has four active coaches with configured individual fees and three active coaches without pricing.
- Updated Player Home to load the complete active coach directory, retain only coaches with a valid real hourly fee, and display the first four consistently as a rupee amount with `per hour`.
- Kept unpriced coach profiles accessible from `View all` instead of inventing fees or mixing `View profile` actions into the priced Home cards.
- Verified the optimized Angular production build and confirmed the running port-8100 development bundle contains the new priced-coach filter.

# Completed: Player Home neon accent replacement - 27 September 2026

- Replaced the bright emerald fill represented by the supplied color swatch with the exact requested neon `#8CF000` across Player Home accent fills and its Home-only overlays.
- Updated the promotion gradient endpoint and tournament Register action to the same neon, and changed button/badge text on neon surfaces to dark ink for readable contrast.
- Verified the optimized Angular production build, restarted the TYNG development server because imported theme changes were not hot-reloading, and confirmed the stylesheet served on port 8100 contains the `#8CF000` token.

# Completed: Player TP points history and passbook - 27 September 2026

- Added a dedicated `/app/tp/history` player page with an emerald balance hero, exact `#8CF000` neon accents, earned/redeemed/expiring summaries, grouped activity, All/Earned/Redeemed filters, pull-to-refresh, pagination and polished loading, empty, retry and end states.
- Connected the player drawer TP card and the Profile TP chip to the new history page, with history-aware Back navigation and a direct wallet conversion shortcut.
- Added the authenticated paginated Laravel `GET /api/wallet/tp-history` endpoint backed by the real TP ledger and current wallet summary; no mock history or fabricated balances are used.
- Passed the Angular production build and two Laravel feature tests with 11 assertions. Browser control was unavailable for a live visual click-through, so visual verification was limited to successful compilation and code-level route/state checks.
- Deployed directly to live host `srv1789528` in `/var/www/tyng`, cleared caches, verified the live route and a real HTTP 200 controller response, then committed and pushed backend branch `developer` as `76d132d` with clean live and local backend worktrees.

# Completed: Sport-games drawer close-before-navigation fix - 27 September 2026

- Fixed the empty sport drawer's Create game action so it first dismisses the Ionic bottom sheet and navigates only after the `didDismiss` lifecycle event fires.
- Applied the same close-before-navigation flow to ongoing game cards opened from the drawer, preventing a stale overlay from remaining above the destination page.
- Preserved normal close and swipe-dismiss behavior by clearing queued navigation when the player closes the drawer without choosing an action.
- Verified the change with the optimized Angular production build, served development bundle inspection and Git diff checks.

# Completed: Player Home adaptive location chip - 27 September 2026

- Moved the `Your location` caption outside and above the clickable location pill, matching the requested header hierarchy.
- Reduced the chip height, pin, chevron and address typography for a cleaner compact treatment while preserving the full click target.
- Added length-aware address sizing from 14px down to 11px plus safe ellipsis containment, so long location names fit without colliding with header actions.
- Passed the optimized Angular production build, refreshed the global Home stylesheet dependency and verified the updated markup, adaptive-font handler and chip styles are served on port 8100.

# Completed: Paginated sport-specific Home games drawer - 27 September 2026

- Replaced the drawer's client-side filtering of the general Home feed with a dedicated request whenever a player opens a sport category.
- Added the authenticated compact `GET /api/home/sport-games` endpoint with exact sport-family matching, optional nearby-location filtering, future/joinable game constraints and a fixed four-card page size.
- Limited each API item to the 11 fields the drawer renders: identity, sport/title, date/time, per-player cost, player/slot counts, host, venue and player names, plus pagination metadata.
- Added automatic next-page loading as horizontal scrolling reaches the third card, duplicate protection, loading-more feedback and initial/load-more retry states.
- Passed the Angular production build and a Laravel feature test with 15 assertions across three pages, sport filtering and compact response fields.
- Deployed to live host `srv1789528` in `/var/www/tyng`, verified an HTTP 200 production response with `perPage: 4`, cleared caches, then committed and pushed backend branch `developer` as `e25a2b0` with clean live and local backend worktrees.

# Completed: Ongoing-game drawer height and card containment - 27 September 2026

- Increased the sport-games drawer to an 82% initial viewport snap with 62% and 95% alternatives, replacing content-sized height with a true full-height sheet surface.
- Constrained each horizontal game card to the usable viewport width with explicit min/max/flex sizing, border-box calculation and overflow protection.
- Rebuilt the card footer as a stable three-column layout so player avatars, remaining spots and the Join action stay fully visible on narrow phones.
- Refined drawer padding, card radius, shadow and internal spacing, then passed the optimized Angular production build and verified the updated breakpoint and CSS rules on port 8100.

# Completed: Hide Join action from the game host - 27 September 2026

- Added viewer-specific `isHost` ownership to the compact sport-games API response instead of inferring ownership from display names.
- Removed the Join action for games created by the signed-in player and replaced the remaining-spots copy with `Hosted by you`; other players still receive the normal Join action.
- Passed the Angular production build and the compact API regression test with 18 assertions, including both host and non-host response cases.
- Deployed to live host `srv1789528`, verified production booking `28` returns `isHost: true` to its actual creator, cleared caches, then committed and pushed backend branch `developer` as `4668f89` with clean live and local backend worktrees.

# Completed: Opaque game-detail action footer - 27 September 2026

- Moved the game price, Chat and booking action row out of the scrolling `ion-content` and into a proper Ionic footer.
- Gave the footer a fully opaque white surface, top divider and shadow so scrolled cards no longer show through or sit behind the actions.
- Added a fixed flex page structure, responsive footer width and safe-area spacing while preserving every existing action state and click handler.
- Passed the optimized Angular production build and verified port 8101 serves the updated lazy chunk with the new footer and without the previous sticky positioning rule; visual browser automation was unavailable because no browser session was connected.

# Completed: 40% player location drawer - 27 September 2026

- Reduced the active Player Home location sheet from 55% to exactly 40% of the current viewport height.
- Limited the sheet to its 40% breakpoint so it cannot expand beyond the requested height, while preserving swipe-down dismissal.
- Made the address list vertically scrollable inside the fixed-height sheet so saved addresses and the management action remain accessible.
- Passed the optimized Angular production build and verified ports 8100 and 8101 serve the new `0.4` breakpoint plus the updated full-height, internally scrolling sheet styles.

# Completed: Player Home greeting and responsive UI audit - 27 September 2026

- Recovered the missing `Hey, {{ helloName }} 👋` and `Ready to play?` greeting from Git history and restored it to the active Player Home v2 header.
- Increased the `Your location` caption from 10px to 12px while retaining the adaptive address sizing and compact location chip.
- Added viewport-safe sizing, overflow containment and responsive typography across promotion, action, game, venue, tournament and coach cards.
- Converted game footers, tournament cards and coach cards to stable grid layouts so long dynamic values cannot push buttons or prices outside the current screen.
- Added narrow-phone spacing rules up to 370px, a centered 720px tablet cap and viewport-safe positioning for the floating Create game action.
- Passed the optimized Angular production build, Git whitespace checks, and confirmed both ports 8100 and 8101 serve the restored greeting and refreshed responsive Home stylesheet.

# Completed: Fresh GPS positioning for Choose location map - 27 September 2026

- Changed the shared location picker to request a fresh high-accuracy device position every time the Choose location modal opens, using `maximumAge: 0` instead of accepting the normal two-minute cached fix.
- Cleared stale address state before locating, centered and zoomed the map to the new GPS coordinate, and reverse-geocoded that point immediately so the marker and displayed address stay synchronized.
- Applied the same fresh-GPS behavior to the locate control inside the map while keeping manual map movement and explicit `Use this location` confirmation intact.
- Preserved permission-denied, GPS-disabled and timeout fallbacks so users can still choose a point manually.
- Passed the optimized Angular production build and verified the shared location-field bundle served on port 8101 contains the fresh-GPS path.

# Completed: 50% Player Home location drawer - 27 September 2026

- Increased the active Select location sheet from 40% to exactly 50% of the current viewport height.
- Kept the fixed breakpoint, internal address-list scrolling and swipe-down dismissal behavior unchanged.
- Verified both running development servers serve the new `0.5` initial and maximum breakpoint.

# Completed: Reference-matched Player Home location header - 27 September 2026

- Reworked the active Player Home header to match the supplied compact reference: caption and location are directly on the white surface with no surrounding pill border or shadow.
- Increased the adaptive address typography to 16px for short labels, scaling gradually to 13px for long locations, and kept the chevron immediately beside the address.
- Reduced notification and profile actions to compact 40px circles while preserving the orange notification indicator and bounded profile image.
- Placed the previously requested player greeting directly below the reference-matched location row so both requirements remain visible.
- Added matching narrow-screen sizing and confirmed ports 8100 and 8101 serve the refreshed template and global Home styles.

# Completed: Responsive glassmorphism polish for Player Home - 27 September 2026

- Applied a restrained glassmorphism system only to Player Home, with translucent surfaces, device-supported background blur, thin highlight borders and layered shadows.
- Unified the intro, search, notification/profile controls, sport icons, game/venue/coach states and floating Create game action while preserving readable text and the `#8CF000` neon accent.
- Kept the promotional and tournament cards high-contrast, adding subtle glass highlights without weakening white typography or CTA visibility.
- Added graceful opaque fallbacks for devices without backdrop-filter support, reduced-motion handling, and an icon-only Create game action on short phone screens to prevent content obstruction.
- Passed the optimized Angular build and confirmed both local dev servers expose the new Home-only glass styling; existing Sass deprecation and style-budget warnings remain non-blocking.

# Completed: Player Home promotion structure and compact typography - 27 September 2026

- Rebuilt the promotion card’s internal structure to match the supplied reference, using a responsive 190–220px height, constrained copy width and stable two-line title treatment.
- Anchored the promotion CTA to the bottom of the card so dynamic subtitle wrapping cannot distort or overlap the button.
- Reduced Player Home text typography by approximately 5%, including the adaptive location label, while preserving icon sizes and interactive touch targets.
- Kept the update isolated to Player Home and preserved the glass treatment, white promotional text and `#8CF000` accent.
- Confirmed port 8101 serves the updated card/type rules and passed the optimized Angular build; existing project warnings remain non-blocking.

# Completed: Admin-managed dynamic Player Home promotions - 27 September 2026

- Replaced the hardcoded Player Home promotion carousel with Laravel-backed promotion records loaded from the authenticated `/api/home/promotions` endpoint.
- Added a dedicated Laravel admin module for creating, editing, ordering, scheduling, activating and deleting multiple Home promotion cards.
- Added admin fields for badge text, heading, description, button text, internal navigation route and green/blue/orange card theme, including a live form preview.
- Restricted promotion routes to internal `/app` paths in both backend validation and frontend navigation handling.
- Added automatic five-second rotation, manual navigation dots, loading skeleton and empty-state hiding on Player Home.
- Added and passed the promotion API feature test (10 assertions), Laravel Pint, PHP syntax checks, Blade compilation and the optimized Angular build.
- Applied migration `2026_09_27_220000_create_home_promotions_table` locally and on production, seeded the three current cards, and verified the compact live payload.
- Deployed directly to `/var/www/tyng` on `srv1789528`, committed only task files as `2f6b822`, pushed branch `developer`, and confirmed the live worktree is clean.
- Follow-up: the local XAMPP MariaDB privilege table `mysql.roles_mapping` is corrupt; the application migration was applied through a temporary localhost-only grant-table bypass without modifying the damaged system table.

# Completed: Reference-sized Player Home location and search header - 27 September 2026

- Matched the supplied compact header structure with the location block and 40px notification/profile actions on the first row and the search field immediately below.
- Applied an 11px phone inset, 62px top row, 44px search height, 14px search radius and reference-sized search/filter icons.
- Reduced excess shadows and spacing while preserving the adaptive location text, notification indicator, profile image bounds and glass surface treatment.
- Preserved the requested player greeting and moved it below the search field so it no longer interrupts the reference header structure.
- Confirmed port 8101 serves the new measurements and passed the optimized Angular build with only the existing project warnings.

# Completed: Swipe navigation for dynamic Home promotions - 27 September 2026

- Added horizontal pointer-swipe navigation to the admin-managed Player Home promotion carousel.
- Left swipe advances to the next card, right swipe returns to the previous card, and both directions wrap across the full dynamic card list.
- Added a 44px horizontal gesture threshold with direction detection so vertical Home scrolling remains unaffected.
- Suppressed promotion CTA navigation after a completed swipe and restarted automatic rotation after every manual gesture.
- Confirmed port 8101 serves the gesture handlers and touch-action rules, and passed the optimized Angular build with only existing project warnings.

# Completed: Exact reference structure for Player Home header and sports - 27 September 2026

- Matched the latest supplied header structure while retaining the application color system: location/actions first, compact search second, and sports immediately below.
- Applied 16px header/search insets, a 69px header row, 40px circular actions, a 44px search field and a 22px lower panel radius.
- Removed the greeting from this visual block so no extra content interrupts the reference sequence.
- Resized the five sport controls to evenly distributed 62px items with 56px circles, 29px image icons and 12px labels.
- Reduced decorative borders and shadows to match the flatter reference while preserving existing icon assets and click behavior.
- Confirmed port 8101 serves all reference measurements and passed the optimized Angular build with only existing project warnings.

# Completed: Profile photos in Player Home Top coaches - 27 September 2026

- Connected the Top coaches cards to the profile image returned by the coach API.
- Preserved coach initials as the fallback when no profile image exists or an image cannot be loaded.
- Kept the existing card structure, responsive sizing, pricing and navigation behavior unchanged.

# Completed: Restored bottom ad banner on Player Home - 27 September 2026

- Restored the existing API-backed Home ad slider at the bottom of the active redesigned Player Home.
- Preserved the existing image, click-through, automatic rotation, manual dots and loading-skeleton behavior.
- Matched the banner margins to the responsive Home cards without changing today's other Home sections.

# Completed: Added horizontal spacing to Player Home search - 27 September 2026

- Increased the left and right spacing around the Player Home search bar so it no longer sits too close to the screen edges.
- Kept the search behavior, icons and responsive layout unchanged.
- Verified the change in the Angular source; a production build was not run for this spacing-only update.

# Completed: Fixed venue event detail routing - 27 September 2026

- Added the authenticated public `GET /api/events/{id}` endpoint for published public venue events.
- Replaced the event-detail route's booking-detail component with a dedicated event-detail page, preventing event ID 9 from being looked up as expired booking ID 9.
- Verified the Angular production build and deployed the Laravel endpoint to `srv1789528` (`/var/www/tyng`); live change committed and pushed as `3c2ce32`.
- Follow-up: publish the rebuilt Angular bundle through the frontend hosting pipeline if the production web bundle is separate from the local Ionic app.

# Completed: Improved coach session venue selection layout - 27 September 2026

- Gave facility choices a consistent minimum height, internal spacing, line height and wrapping so facility names and sport details remain readable on narrow screens.
- Clarified spacing and typography in the facility selection rows.
- Verified with the Angular development build.

# Completed: Refined coach student selection tabs - 27 September 2026

- Restyled the My Students, Previous Batch and Add New selector as a balanced three-column segmented control with larger touch targets, readable labels and a clear selected state.
- Added tab semantics and selected-state accessibility attributes.
- Build verification not run for this visual-only adjustment.

# Completed: Show live venue times in coach session planner - 27 September 2026

- Replaced generated clock times with the coach scheduling availability API for the selected venue, court, date and session duration.
- The choices now reflect venue hours, operating days, existing reservations and sessions, current time, and the venue's configured gap between booking slots.
- Added loading, unavailable, and API error states; changing date or duration clears stale selections and reloads availability.
- Verified with the Angular development build. Distinct recurring break windows are not represented in current venue profile data; the configured booking gap is applied.

# Completed: Refined coach session time selection - 27 September 2026

- Grouped open session times by morning, afternoon and evening, and showed each time with its end time.
- Added a clear venue-hours and booking-gap strip, plus styled loading, empty and retry states for availability.
- Confirmed the running Angular dev server serves the updated coach plan chunk and the development build compiles.

# Completed: Fixed coupon row on coach pricing step - 27 September 2026

- Replaced the shrink-prone coupon flex row with a responsive two-column layout and a fixed-width Apply button.
- Increased control height and contrast, and added a visible focus state for the coupon input.
- Confirmed the updated coach plan chunk is served on localhost:8100; no build was run for this styling adjustment.

# Completed: Restore auto-generated coach session title - 27 September 2026

- Removed the one-shot reactive effect that read non-reactive wizard fields and ran before the coach selected a sport.
- Generate and refresh the default title as sport, venue and student selections change, and when entering Review & Publish; preserve a title the coach edits manually.
- Added an accessible label and fallback placeholder to the title field. Angular development build passed and localhost:8100 serves the updated chunk.

# Completed: Improved coach session success screen - 27 September 2026

- Reworked the success page into a top-aligned, scroll-safe mobile layout with tighter confirmation rows and consistent two-column next-step cards.
- Made the first checklist item accurately distinguish a confirmed venue booking from a request awaiting venue approval.
- Verified with the Angular development build.

# Completed: Fixed Home nearby games feed - 27 September 2026

- Included venue-approval-pending social games in discovery instead of filtering them out on Home; their card action now says “View game” rather than implying they can join immediately.
- When the selected location has coordinates, request discovery without a hard text location match and sort venue-coordinate games nearest-first using distance; venues without coordinates follow by session date/time. Text-only locations retain the existing locality-filter fallback.
- `git diff --check` and `npm run build` passed. Build emitted existing Sass deprecation and Angular optional-chain warnings unrelated to this change.

# Completed: Personalized looping Home sport rail - 27 September 2026

- Expanded the Home sport rail from four fixed shortcuts to the full sport catalog, placing sports from the user's profile preferences first.
- Made the horizontally swipeable rail wrap between duplicated cycles at either end; each cycle includes the More shortcut, and duplicate copies are skipped by keyboard navigation and assistive technology.
- Applied scroll snapping and contained horizontal overscroll. `npm run build` passed; the build reports existing style-budget and Sass deprecation warnings.

# Completed: Improved nearby game card layout - 27 September 2026

- Changed the Home feed host avatar from a stretched oval to a 42px circle and tightened title spacing.
- Let the venue/address row wrap up to two lines with a fixed icon alignment, and ensured the card action has a stable minimum width.
- `npm run build` passed; the build reports existing Sass deprecation, optional-chain and style-budget warnings.

# Completed: Limit Home sport shortcuts to four - 27 September 2026

- Limited the looping Home rail to four sports plus More; profile-preferred sports retain priority, with the standard featured sports filling any remaining places.
- More continues to open the full sport catalog.
- `npm run build` passed; the build reports existing Sass deprecation, optional-chain and style-budget warnings.

# Completed: Add category filter to Home search - 27 September 2026

- Replaced the Home search filter icon's direct navigation with an anchored popover offering Venues, Players and Coaches.
- Selecting a category opens `/app/search?type=...`; Search reads the type parameter and activates its matching result tab while loading results.
- `git diff --check` and `npm run build` passed. Browser preview was unavailable in this session, so visual interaction was not browser-verified.

# Completed: Add elevation to player side menu items - 27 September 2026

- Added a subtle card shadow to player side-menu rows and matched their rounded corners, padding and minimum height to the venue menu row treatment.
- `git diff --check` passed; this was a CSS-only adjustment and no build was run.

# Completed: Make TP history route show XP history - 28 September 2026

- Reworked the existing passbook design to show XP lifetime/season summary, level progress, XP activity details and paginated XP transactions from `/xp/me` and `/xp/history`.
- Redirected the legacy `/app/tp/history` route to `/app/xp/history`; TP balance shortcuts now open Wallet rather than XP history.
- `npm run build` and `git diff --check` passed. Existing Sass and style-budget warnings remain.

# Completed: Link XP progression card to XP history - 28 September 2026

- Changed the drawer XP/progression card click, Enter and Space actions to open `/app/xp/history`; updated its accessible role and label.
- Preserved the card's display and visual styling. `git diff --check` passed.

# Completed: Restyle Home promotion card to dark navy design - 1 October 2026

- Changed the Home promotion slider card in `src/theme/player-home-v2.scss` to the reference design: dark navy gradient background, faint field lines, a lime-tinted badge, a white uppercase headline, a gray subtitle and a glowing lime button with dark text.
- Every promotion now uses this look, whatever its theme setting (green, blue or orange).
- The dev server recompiled successfully. The page wasn't checked in a browser because the preview browser wasn't logged in.

# Completed: Player Home greeting header matches reference - 1 October 2026

- Rebuilt the player Home header: the profile photo is now on the left as a 52px rounded square with a green online dot. To its right are two lines: "HEY, NAME 👋" in bold uppercase, then the location (green pin, gray text, chevron) that opens the location picker.
- Removed the "Your location" caption and the unused `locationChipFontSize` getter. Long names and locations are cut off with "..." so both lines always fit beside the photo.
- The dev server recompiled successfully. Not checked in a browser because the preview browser wasn't logged in.
- Refined it to match the full reference: the photo is now 48px with a 2.5px lime border and a smaller online dot. The greeting is 18px, there's more space between the two lines, and the location is smaller, bolder dark-gray text. Checked against the reference in a standalone test page that used the same styles.
- Simplified it again at the user's request: a plain 52px round photo (no border or online dot), "Hey Name!" in 20px regular-weight dark text, and the location in 16px gray text with just a dropdown arrow (no pin icon, emoji or capitals). Checked in the standalone test page.
- Fixed it on the live dev page (checked while logged in): the dev server had kept an old copy of the global stylesheet, and once it rebuilt, a generic `.home-location-trigger` pill style from `home.page.scss` was still winning. Made the header's location selectors more specific so it shows as plain gray text with a dropdown arrow.
- Changed the greeting to "HEY, NAME 👋" in heavy uppercase (19px, weight 900), keeping the plain round photo and gray location. Checked on the logged-in Home page.
- Restyled the Home location line to match the reference: green pin, 12.5px bold dark-gray text and a small gray chevron, with a little more space below the greeting. Checked on the logged-in Home page.
- Changed the Home profile photo to the reference style: a 50px rounded square with a 2.5px lime border and a green online dot at the bottom-right. Checked on the logged-in Home page.
- Matched the Home background and search bar to the reference: removed the white glass card behind the header so it sits on the flat light page background (#fafbfc). The search bar is now white with a soft shadow and 16px corners, with a dark navy (#111827) rounded filter button holding a lime funnel icon. Compiled; not yet checked on screen because the preview browser session was logged out.
- Replaced the three coloured Play / Book / Train cards on player Home with a "QUICK ACTIONS" 2x2 grid of white cards, each with its own colour: Create game (orange, /app/game/create), Join game (lime, /app/ongoing), Book venue (blue, /app/venues) and Hire a coach (purple, /app/coaches). Each card has a tinted icon tile, an uppercase title, a gray subtitle and a soft border and shadow in its colour. Compiled; checked in a test page using the compiled app styles, as the preview browser was logged out.
- Redesigned the header of the Home "Games near you" cards to match the reference. It now has a dark navy band with faint pitch lines, a lime uppercase "{SPORT} GAME" label, an orange "STARTS IN 2H 14M" countdown pill ("Live now" once started, days if over 24 hours), the game title in white, and the court (or venue) with distance from the player in gray. This replaces the host avatar, host name and sport chip. The time, address and footer are unchanged, and the matching card in the sport drawer is untouched. Moved the venue distance maths into a shared `bookingDistanceKm` helper used by both sorting and the label. Compiled with no lint errors; checked in a test page using the compiled app styles, as the preview browser was logged out.
- Changed the "Venues near you" placeholder images on player Home from alternating green and blue to the reference dark navy (#161e2d to #18212f), with faint pitch lines and a translucent white rating pill. Checked in a test page using the compiled app styles.
- Restyled the "Book" button on the Home "Venues near you" cards to the reference: a fully rounded navy (#111827) pill with bold lime uppercase text and a soft shadow. The label still says "Book". Checked in a test page using the compiled app styles.
- Centred the "Games near you" card when there is only one game (`:only-child` with auto side margins). With two or more games, the row still scrolls sideways from the left as before. Checked in a test page using the compiled app styles.
- Replaced the vertical "Top coaches" list on player Home with a swipeable "COACHES FOR YOU" row matching the reference. Each white card has a rounded photo (or initials), the name in uppercase with a green verified tick (only when the coach record has a verified flag), "{Sport} Coach" in green, up to two specialties (or extra sports) in gray, rating plus experience (years when known, otherwise the level), "From ₹X/hr" and a lime "VIEW COACH →" link. The heading is uppercase with a gray "VIEW ALL >". Removed the unused `priceCaption` field and old `.coach-home-card` styles. Also added matching scroll padding to every swipeable Home row so snapping no longer pushes the first card against the screen edge. Compiled with no lint errors; checked in a test page using the compiled app styles.

# Completed: Player Home performance, race, badges and suggestion sections - 1 October 2026

- Added four sections below "Coaches for you" on player Home, built from the Figma Make export (`TYNG APP (Copy)/src/app/components/player/HomeScreen.tsx`) using its colours: navy #111827 to #1F2937, lime #8CF000, orange #FF7A00, and the light card tints.
- **Your performance:** dark card with level, level title, lifetime XP, a progress bar and "X XP to Level N", Reliability / Rating / Rank tiles, season XP, games played and "VIEW STATS" (opens `/app/stats`). Data comes from `/xp/me`; the section is hidden if it fails to load.
- **Your race:** this month's XP leaderboard (`/xp/leaderboard?period=month`), showing the top 3, or the top 2 plus you when you're outside the top 3. Your row is highlighted, and an orange note shows the XP needed to pass the player above you. "VIEW LEADERBOARD" opens `/app/leaderboard`.
- **Recently unlocked:** up to 6 badges from `/xp/badges` (earned first, then locked ones greyed out with a lock), with an icon and colour picked from the badge category or code. "VIEW ALL BADGES" opens Profile.
- **TYNG thinks you'll like:** green suggestion card counting nearby games with open spots, grouped by the most common sport, with a "JOIN" button to `/app/ongoing`. Hidden when no nearby games have spots.
- Figma's sample stats with no backend data (the city name on the leaderboard, "moved up 3 places", "6-game streak") were swapped for real values: "All players", the XP gap to the player above, and games played.
- Compiled with no new warnings or lint errors. Checked each section in a test page using the compiled app styles; not yet checked on the live Home page because the preview browser was logged out.

# Completed: Player leaderboard redesigned to match Figma - 1 October 2026

- Rebuilt `/app/leaderboard` (`src/app/pages/events/leaderboard.page.*`) from the Figma Make `LeaderboardScreen.tsx`, using its colours (navy #111827 to #1F2937, lime #8CF000, orange #FF7A00, page #FAFBFC).
- **Sections:** intro with search and share buttons and "HOW XP WORKS"; CITY / FRIENDS / SPORT / VENUE mode tabs; THIS WEEK / THIS MONTH / SEASON / ALL TIME chips; a location line; sport circles (Sport mode); a venue picker (Venue mode, venues from `/venues/courts`); the dark "Your rank" card with an XP chase bar to the player above; "Your next move"; "Top three" podium with crown and gold/silver/bronze rings; "Rankings"; "Your rivals" (two places either side); "This week" highlight; and "Season progress" (Season chip only). Also a floating rank pill that appears once the rank card scrolls away, plus How XP works, Search players and Share your rank bottom sheets. The tab bar hides while a sheet is open.
- **Data:** `/xp/leaderboard` (scope city/friends/global, period, sport, venue_id, limit 50) and `/xp/me`. `XpService.leaderboard()` now takes an options object (scope, city, venueId, limit). Home's existing call is unchanged.
- **City fix:** the backend's city scope matched the whole profile location ("Preeti Nagar > Lucknow") against venue cities, so it never matched. The app now sends the parsed city ("Lucknow") as `city`. When the city board is empty it falls back to the all-TYNG board with a note.
- **Figma values with no backend data, replaced:** rank movement arrows (removed), "game streak" (now games played), "biggest climber" (now this week's top XP earner), "best rank" (now lifetime XP). Player photos and per-player reliability are now real (see the follow-up below).
- Compiled with no lint errors. Checked on the logged-in dev page with live data at phone width: every section, both sheets, search, the floating pill and all four modes.
- **Follow-up done (backend, live, commit `4603065` on `developer`):** `XpLeaderboardService` now returns `avatar` and `reliabilityScore` for each row and for `me`, and `viewerCity()` parses "area > city". Rows show real photos, and the podium and ranking captions show "{n} Reliability" (games played only when a player has no score). Checked with live data.

# Completed: Discover players redesigned to match Figma, fully dynamic - 1 October 2026

- Rebuilt `/app/discover` (`src/app/pages/discover/discover.page.*`) from the Figma Make `PlayerDiscoveryScreen.tsx`.
- **Header and search:** "DISCOVER PLAYERS" with a live "{n} players nearby" count; a search button (searches `/discover?q=`, results show photo, @username and area or distance); a filter button with an orange dot when filters are on.
- **Swipeable card stack:** the next player peeks behind. Drag right to connect, drag left to skip, with CONNECT / SKIP stamps. The photo area shows the availability pill, verified shield, level pill, name, age, @username, area and distance. The body shows bio, sport chips (tap one to filter by that sport), Reliability / Rating / Games / Level tiles, a "WHY YOU MAY MATCH" box, and SKIP / VIEW PROFILE / CONNECT. Loads more pages when 3 cards remain.
- **Sheets:** Discovery filters (sport, skill level, distance only when the user has a location, reliability 80+/90+/95+, availability) and "Connect with {name}?" with an optional message. Sending creates the connection (`/discover/swipe`) and, when a message is set, opens a private chat and sends it. The tab bar hides while a sheet is open. Empty state: "NO PLAYERS HERE YET." with Clear filters / Change sport.
- **Backend (live, commit `4603065` on `developer`):** `DiscoverPlayerResource` drops the fake fallbacks (rating 4.5, "Intermediate") and adds `username`, `area`, `level`, `levelTitle`, `reliabilityScore`, `verified`, real `distance` and `matchReasons` (shared sports, same skill, shared availability, mutual players, within 5 km or same city). `SocialService::discover()` accepts `sports`, `skill`, `availability`, `min_reliability` and `max_distance` filters.
- **Figma values with no backend data:** play-style filter (players have no play-style field, so it's left out); "verified" is based on a verified email (there is no ID verification); the availability pill is hidden when a player hasn't set availability; connecting adds a friend immediately (there is no pending-request state), so the badge reads "CONNECTED".
- Compiled with no lint errors. Checked on the logged-in dev page at phone width with live data: cards, filters (5 players to 4 with Cricket), search, connect sheet (opened and cancelled; no real connection sent).

# Completed: Back button and no tab bar on non-main pages - 2 October 2026

- New `MAIN_TAB_ROUTES` / `isMainTabRoute()` in `src/app/core/constants/layout-routes.ts`, listing only the bottom-tab destinations per role (player: home, discover, my-bookings, chat; coach: dashboard, students, schedule, chat; venue: dashboard, bookings, events, chat; admin: dashboard, users, venues, settings). Exact matches only, so inner pages such as `/app/chat/:id` or `/app/my-bookings/:id` count as inner.
- `TabsPage` shows the bottom tab bar only on those routes. This replaces the old per-page hide list, which showed the bar on side-menu pages such as leaderboard, coaches, profile and stats, and on venue calendar, facilities, earnings, analytics and profile.
- `BrandHeaderShellComponent` passes `showBack` when the route isn't a main tab. `HeaderComponent` then shows a back button (history back, otherwise the role's home) in place of the menu button. The tyng wordmark and bell stay the same. No CSS changed.
- Compiled with no lint errors. Not checked visually: the preview browser was logged out.

# Completed: Player side menu items match Figma - 2 October 2026

- Player drawer (`src/app/app.component.html`) now lists exactly the Figma `LeftDrawer` items, in order, with Figma descriptions: Wallet (Balance, TP Points & transactions), Leaderboards (City, friends & sport rankings), Coaches (Find & book coaches), Settings (Account & preferences), Support (Help, reports & contact us). Removed My Friends, Personal Stats, History and the divider before Support. Those pages are still reachable from the chat list, Home "View stats" and the My Bookings tab. No CSS changed.
- **Follow-up:** the app has no Support page (Figma links to `/app/support`), so Support still opens Home.

# Completed: Player Home section headings match Figma - 2 October 2026

- All Home section headings now use the Figma `SectionTitle` style (16px, weight 900, uppercase, -0.02em, #111827), with grey uppercase "View all ›" links (11px, #6B7280). Changed in `src/theme/player-home-v2.scss`; the separate caps variant was merged into the base heading.
- Added the "Explore by sport" heading above the sport rail and renamed "Venues near you" to "Top venues near you" (`home.page.html`).
- "Games near you" and "Tournaments" keep their titles because Figma has no matching section. Figma's "Next up" is the player's own next booking, which Home doesn't show yet.
- Compiled successfully. Not checked visually: the preview browser was logged out.

# Completed: Find coaches redesigned to match Figma, fully dynamic - 1 October 2026

- Rebuilt `/app/coaches` (`src/app/pages/player/coaches.page.*`, now separate HTML/SCSS) from the Figma Make `CoachesScreen.tsx`.
- **Sections:** "FIND COACHES" intro; search bar with a dark filter button (orange dot when filters are on); sport chips built from the sports coaches actually teach; coaching invitations (kept); "RECOMMENDED FOR YOU" dark featured card (hidden while searching or filtering); "COACHES FOR YOU" list with a sort pill; coach cards (photo, NEW ON TYNG, verified tick, sports, session types, rating or "No reviews yet", experience range, sessions and students, area or distance, ID VERIFIED / CERTIFIED, next available, price or "On request", NEGOTIABLE, VIEW PROFILE and BOOK); empty state; Coach filters sheet (sport, session type, coach experience, distance, price, session availability, rating, language, verified-only toggle); Sort coaches sheet. Infinite scroll and pull to refresh. The tab bar hides while a sheet is open.
- BOOK opens `/app/coaches/:id?book=1`, which now opens the existing booking sheet straight away.
- **Backend (live, commit `f36829b` on `developer`):** `CoachController::index` now returns, per coach: `area` (short form of the saved address), `distanceKm`, experience level/label/years, `sessionTypes`, `languages`, `achievements`, `groupPrice`, rating and `reviewCount` from published reviews, `sessionsCompleted`, `activeStudents`, `idVerified` / `certified` (approved verification documents), `isNew` (joined in the last 30 days), `nextAvailable` (next open weekly slot, India time), today/tomorrow/weekend availability and `sharesSport`. It also returns `facets` (sports, session types, languages present). New filters: `sports`, `session_types`, `experience`, `languages`, `price` bands, `min_rating`, `availability`, `verified`, `max_distance`; sorts: recommended, top, nearest, soonest, price, experience. Sport matching now ignores case, which fixes the old filter that never matched lowercase sports. Home's existing `sort=top` call still works.
- **Figma values with no backend data:** sponsored badge, specialisation and skill-level filters (shown as session type and coach experience instead), exact years (shown as the onboarding range, e.g. "4–10 Years"), exact next-session times (shown as the weekly slot, e.g. "Today • Night"). NEAREST sort and distance filter only appear once coaches have saved coordinates (none do yet).
- **Follow-up:** there is no admin approval step for coach verification documents (all stay "submitted"), so ID VERIFIED / CERTIFIED badges and "Verified only" show nothing until an admin approve action sets them to `approved`.
- Compiled with no lint errors. Checked on the logged-in dev page at phone width with live data: list (10 coaches), Cricket chip (5), Today + English filter (1), price sort, BOOK opening the booking sheet (closed without sending).

# Completed: Home search popover, filter icon and sport rail - 2 October 2026

- The Home "Search for" popover now closes as soon as an option is picked.
- The search filter button now uses the dark `options-outline` sliders icon on a light button, matching the reference.
- The Home sport rail always fits exactly 6 sports across the screen width (6 equal columns), with the rest reachable by swiping.
- Compiled successfully on the dev server.

# Completed: Search results loading skeleton - 2 October 2026

- `/app/search` now shows shimmering skeleton rows (avatar, name and detail lines) while a search is running, instead of a blank or stale list. The results list only appears once loading finishes.
- Compiled successfully on the dev server.

# Completed: Player profile backend for the Figma profile tabs - 2 October 2026

- **Backend, live and pushed (commit `adf48d1` on `developer`):** new `player_profile_details`, `player_documents` and `player_ratings` tables; `GET/PUT /player/profile`, `PUT /player/profile/medical`, game results (`/player/games/{bookingId}/result`), player ratings (`/booking/{bookingId}/player-ratings`) and player documents (list, upload, update, view file, delete). Profile visibility toggles are respected in Discover.
- **Still to do:** the frontend player profile screen with the five Figma tabs (Overview, Personal Info, Stats, Medical & Fitness, Documents); a screen to enter game results and rate players; sharing medical details and documents according to their visibility toggles; enforcing the "allow messages" toggle in chat.

# Completed: Settings cleanup, CMS privacy policy, blocking and notification preferences - 2 October 2026

- **Settings page:** removed Wallet. Options are now Edit Profile, Change Password, Notifications, Blocked Users, Privacy Policy and Terms & Conditions.
- **Privacy Policy / Terms (CMS):** new `/app/legal/:slug` page loads the content from `GET /pages/{slug}`, with a skeleton, "Last updated" date, styled rich text and a not-found state. Admins edit the text in Laravel at `/admin/pages` (a "CMS Pages" link was added to the admin sidebar). Checked in the browser against the live API.
- **Blocking:** players can block or unblock from a player's profile (the "..." button at the top, with confirmation). A red banner shows when a player is blocked. New "Blocked Users" item in the side menu and in Settings opens `/app/blocked-users`, listing blocked people with an Unblock button. On the server, blocked people can't message each other privately, invite each other to games, add each other as friends, or see each other in search, Discover or friends lists, and blocking removes the friendship.
- **Notification settings:** new `/app/settings/notifications` page with a master switch and per-category switches (bookings, chat, social, wallet, XP, coaching, announcements). Changes save instantly and roll back if saving fails. On the server every push notification checks the user's preferences first; everything is on by default for all users, and logging in no longer resets preferences.
- **Backend, live and pushed (commit `9ddf127` on `developer`):** `NotificationPreferenceService`, `NotificationSettingsController`, `PageController`, block endpoints in `SocialController`, enforcement in chat, social, booking and push services, and migration `2026_10_02_000002`. Verified on live: notification update/allow checks, block, block status, blocked list and unblock.
- **Frontend:** type check passes and the dev server compiles. The logged-in pages (blocked users, notifications, block action) were not clicked through in the browser because the preview browser was logged out.
- **Follow-up:** the live Privacy Policy content is placeholder text from another product ("Supper Shooper", eyewear) and should be replaced in `/admin/pages`. Opening a blocked player's profile directly by link shows "Player not found", because blocked players are hidden from the friends and Discover lists it loads from.

# Completed: TYNG privacy policy and terms content - 2 October 2026

- The live Privacy Policy and Terms & Conditions pages still held template text from another product ("Supper Shooper" / "Super shopper"). Replaced both with TYNG content written from what the app actually collects and does: account and profile details, optional medical details and documents, location (Google Maps), payments (Razorpay, no card details stored), notifications (Firebase), chat, wallet and TYNG Points, XP and leaderboards, blocking, notification settings, children and parental consent, and Indian governing law for the terms.
- **Backend, live and pushed (commit `3c6b905` on `developer`):** migration `2026_10_02_000003_replace_legal_pages_with_tyng_content.php`. It only overwrites a page that is empty or still mentions the old product, so later edits in `/admin/pages` are never undone. Verified the live API returns the new text and `/app/legal/privacy-policy` shows it with "Last updated 2 Oct 2026".
- **Follow-up:** there is no TYNG support email yet (the server's mail sender is still `hello@example.com`), so the Contact sections point to tyngpeople.com. Add a support email in `/admin/pages` once one exists, and have the legal text reviewed by someone qualified before launch. The inactive refund, about and shipping pages still hold the old eyewear shop text.

# Completed: Settings back button returns to the previous screen - 2 October 2026

- The Settings back button was hard-coded to open `/app/profile` (left over from when Settings was only reached from Profile). Now that Settings opens from the side menu, it goes back through navigation history like other inner pages, falling back to `/app/home` when there is no history.
- Gave Notification settings (fallback `/app/settings`) and Blocked Users (fallback `/app/home`) the same fallback so their back buttons never leave the app on a direct visit.
- TypeScript check passes and the dev server compiles. Not clicked through in the browser because the preview browser is logged out.

# Completed: Blocked Users removed from the side menu - 2 October 2026

- Removed the Blocked Users item from the player side menu in `src/app/app.component.html`, as requested, because it is already in Settings. The side menu is back to the five Figma items: Wallet, Leaderboards, Coaches, Settings and Support. `/app/blocked-users` is still opened from Settings.

# Completed: Player profile screen matching Figma (five tabs) - 2 October 2026

- `/app/profile` for players is now the Figma profile, built as `src/app/pages/profile/player-profile/` (`PlayerProfileComponent` plus shared `pp-chips`, `pp-field` and `pp-toggle` controls) and wired to the live endpoints through the new `PlayerProfileService`. The coach and venue branches of `profile.page` are unchanged; unused player XP code was removed from `profile.page.ts`.
- **Identity card:** photo with camera button (opens Edit Profile), name, verified tick, username, TYNG ID, city, member since, sport tags and EDIT PROFILE.
- **Tabs** (sticky, kept in the `?tab=` link, the selected tab scrolls into view):
  - **Overview:** TYNG Pulse (level, lifetime XP, progress, reliability, rating, city, streak, XP this month), At a glance, badges row, recent games and reputation.
  - **Personal Info:** basic info, masked account info, sports profile with positions, dominant side, playing preferences and about, privacy toggles that save instantly, a public profile preview that respects them, and profile completion.
  - **Stats:** compact pulse, city/sport/friends ranks, 12 activity stats, reliability meters, reputation, recent XP and the full badge collection with progress.
  - **Medical & Fitness:** body, fitness, medical, injury, allergy, emergency contact and doctor cards, access toggles that save instantly, and a collapsible wellness section with a hydration reminder.
  - **Documents:** upload (PDF or image, up to 20 MB), view, download, replace, delete with confirmation, visibility per document, document types and privacy options.
- **Editing:** Personal Info and Medical have edit mode with a Cancel / Save bar and a "Profile updated" pill. Tapping a recent game lets the player open it or mark it won, lost or draw.
- **Verified:** type check passes and the dev server compiles. Checked logged in at phone size against live data: all five tabs render with no console errors, edit mode and the save bar work, the Documents empty state shows, and opening with `?tab=documents` selects that tab.
- **Figma items with no backend data:** rank movement ("↑ 3 positions"), phone verification status, and a "verified" tick on documents. The hydration reminder is stored but no reminder is sent. The medical access and document visibility choices are stored but not yet enforced for coaches or venues.
- **Follow-up:** a screen to rate other players after a game; enforce medical/document access and the "allow messages" toggle; the app top bar scrolls away on every page (its sticky style has no effect), so the profile tabs pin to the top of the screen.

# Completed: Home "Top venues near you" now uses live venues - 2 October 2026

- **Audit of `/app/home` (player):** games near you, promotions, ads, tournaments, coaches, performance, race and badges were already live. "Top venues near you" was the only static section: it showed sample venues from `DesignDataService`, a made-up review count (`98 + i * 57`) and a save (heart) button that did nothing. The coach section of Home already replaces its sample data with live dashboard data, and venue staff are redirected away from Home, so its sample venue arrays are never shown.
- **Backend, live and pushed (commit `85766b3` on `developer`):** new `VenueGeocoder` service (Google Geocoding with the server's `GOOGLE_MAPS_API_KEY`, now exposed as `services.google_maps.key`). `VenueProfile` looks up its coordinates whenever the address, city, state or PIN changes. New `php artisan venues:geocode` command, run on live: 5 venues located, venue 15 has no address. `GET /venues` now accepts `lat`, `lng` and `limit`, returns `latitude`, `longitude`, `distanceKm`, `distance`, `coverImage` and `courtsCount`, and sorts nearest first (venues without coordinates last). Checked on live with a rolled-back test that an address change updates coordinates and unrelated saves don't.
- **Frontend:** `VenueService.getVenues()`; Home loads up to 6 venues with the player's current or saved location (reloaded whenever the location changes), shows the venue photo, locality and city, distance, sports, lowest court price ("Pricing coming soon" when no courts are priced) and "New" when there is no rating. Loading, error-with-retry and empty states added. The card and Book button open `/app/venue/:id`. The dead heart button was removed.
- **Verified:** type check passes and the dev server compiles. In the browser while logged in: the section shows the 4 bookable live venues with real photos, prices and areas, and Book opens the venue page. This browser blocks location, so it showed the same-city fallback order; distance sorting was verified on the server.
- **Follow-up:** venue ratings and reviews have no data (all venues show "New"); a saved/favourite venues feature does not exist; the venue detail page shows a default "4.5 (0 reviews)" rating.

# Completed: Players choose the 5 Home sports from the More screen - 2 October 2026

- **What changed:** the Home "Explore by sport" row is 5 sports plus "More". In the More screen ("Choose a sport") there is now an **Edit Home** button. Edit mode starts with the current 5 sports selected and numbered in order. Tapping a selected sport removes it; tapping another adds it. Once 5 are picked, the rest are greyed out, and **Save** only works with exactly 5 ("Choose N more sports to save" otherwise). **Reset to default** goes back to the automatic order (the player's own sports first, then featured sports). "Suggest a sport" can't be picked. Back in edit mode only leaves edit mode.
- **Backend, live and pushed (commit `aedc670` on `developer`):** migration `2026_10_02_000004` adds `player_profile_details.home_sports` (run on live). `GET /player/home-sports` returns `{ sports, count: 5 }`; `PUT /player/home-sports` accepts exactly 5 different sports from the Home catalog, or `null` to reset. Checked on live: 4 sports, a repeated sport and an unknown sport are rejected; 5 save, read back and reset correctly (test account left on the default).
- **Frontend:** `PlayerProfileService.getHomeSports()` and `saveHomeSports()`; Home loads the saved choice each time it opens and keeps a per-user copy on the device so the row shows straight away. Toasts confirm saving or show the server's message.
- **Verified:** type check passes and the dev server compiles. Not clicked through in the browser: the preview browser's session was signed out (its token was no longer accepted when the app started), so the logged-in Home could not be opened.

# Completed: Same size for section headings above cards across the app - 2 October 2026

- **What changed:** section headings above a card or list now all use the Home heading style (16px, weight 900, uppercase, letter-spacing -0.02em, line-height 1.2, #111827). Previously they ranged from 8px to 20px.
- **How:** new CSS variables --app-section-title-* in src/theme/variables.scss and a global .app-section-title class in src/global.scss (no margin, so Tailwind margin classes still apply). Existing component heading classes now read the variables: Home (player and coach), player profile, leaderboard, coaches, coach profile detail, venue detail, venue booking, chat list, settings sub-pages, edit profile, coach profile/students/book-venue/insights/chat, venue dashboard Quick Actions (.venue-section-title--outside, since .venue-section-title is also used inside cards), venue profile, calendar, analytics, events hub, admin dashboard.
- **Left alone:** titles inside cards, page and top-bar titles, modal titles, wizard steps, date group labels and result-count rows.
- **Verified:** type check passes, dev server compiles. In the browser as a player, Home, Profile, Coaches, Chat and Notification settings headings all compute to 16px / 900 / uppercase / #111827. Coach, venue staff and admin screens were not opened in the browser.

# Completed: Shorter location label in the Home header - 2 October 2026

- **What changed:** new headerLocationLabel getter in home.page.ts keeps only the first part of the location label (the area), so "Preeti Nagar > Lucknow" shows as "Preeti Nagar". When the label has no area it is just the city, so the city shows. The "Detecting location…" and "Set your location" placeholders are unchanged. Both header location buttons in home.page.html use it, with the full label as the title tooltip. locationLabel and playerLocation are unchanged, so nearby searches still get the full location.
- **Verified:** type check passes; in the browser as a player the header shows "Preeti Nagar".

# Completed: Hide the bottom tab bar while the keyboard is open - 2 October 2026

- **What changed:** UiChromeService has a new keyboardOpen signal. On native it listens to the Capacitor Keyboard keyboardWillShow/keyboardDidShow/keyboardWillHide/keyboardDidHide events. In touch (pointer: coarse) web browsers it treats a focused text input, textarea or contenteditable as an open keyboard. Checkboxes, radios and read-only inputs don't count. TabsPage hides pp-bottom-tab-navigation while it is true, so --app-bottom-chrome-offset drops back and fixed bottom CTAs sit right above the keyboard. Desktop browsers are unaffected.
- **Verified:** type check passes. In the browser with touch emulation, the tab bar unmounts when a text input is focused, stays for a checkbox, and returns on blur. Native builds need npx cap sync and a rebuild to test on a device.

# Completed: Skeleton placeholders instead of sample or old text while API data loads - 2 October 2026

- **Problem:** many screens first rendered hard-coded sample values, zeros or "No … found" empty states, then swapped in API data, so wrong text flashed before the real values.
- **Pattern used:** loading flags now start true (Ionic renders once before ionViewWillEnter). A separate loaded/ready flag keeps skeletons to the first load only, so pull-to-refresh keeps old data visible. Empty states only show once data has loaded. Sample arrays were replaced by empty typed arrays. New shared app-card-row-skeleton (inputs count, cardWidth, mediaHeight, lines, full, label) is exported from shared/components/skeleton/index.ts.
- **Global fix:** global.scss set ion-skeleton-text --background-rgb to 237, 240, 244. Animated skeletons paint that colour at 6–13% opacity, so every animated skeleton in the app was close to invisible on white. It is now 17, 24, 39 (Ionic's default dark text tint), with 255, 255, 255 under .dark-mode.
- **Player:** Home sport rail (skeleton until home-sports load or a cached entry exists), Games near you, Top venues, Coaches, Tournament and Performance sections; leaderboard rank card and next move; coach profile detail (skeleton + retry, review count now from coach.reviewCount instead of a fixed "48 Reviews"); create game no longer pre-fills sample venues; venue court counts, ongoing games count, My Bookings segment counts; chat room title; event detail, coach invite and TP history page skeletons; chat list safety timeout raised to 8 s.
- **Coach:** dashboard (Home coach branch) no longer shows sample sessions/requests/activity; every section has a skeleton until the first load finishes (coachDashboardLoaded). Fixed garbled · and – characters in session text. Students (counts, invitations, list), Schedule (stats, list, error line; today's completion % is now computed instead of a fixed 50%), Insights, Earnings (stats, wallet, breakdown, recent sessions), Student profile (loads by route id, skeleton + retry), Complete profile (progress and form skeleton, Skip hidden while loading).
- **Venue staff:** booking detail, calendar stats and events, earnings period switch, facilities court count and form, dashboard weather place name, complete profile steps (Next disabled while loading), create event courts and sponsors, side menu (Venue Profile / Facilities / Earnings subtitles and the profile checklist show skeletons until the dashboard call returns; the fake four-item checklist fallback was removed).
- **Admin:** dashboard stat values and operations list.
- **Verified:** type check passes and the dev server compiles. In the browser as a player with 4 s simulated network latency, Home shows visible skeleton cards that are replaced by real venues and the games empty state once data arrives. Coach, venue staff and admin screens were not opened in the browser.
- **Follow-up (not changed, no API behind them yet):** Stats page, coach Profile tab, upcoming events page, admin users/venues/revenue/disputes, venue analytics, coach teams/settings, venue collab detail. Values that are still always fake: venue weather text and temperature, coach earnings sparkline, venue rating 4.5 and "6 AM–10 PM" fallbacks, header bell red dot, venue booking summary slots, coach side menu rating "4.8 (128)".

# Completed: Player and coach badges with progress, plus admin badge views - 2 October 2026

- **Before:** only players had badges, there was no progress on locked badges, unlock checks only ran when a game session ended, the "On time" badge ignored early arrivals, The Early Bird counted any 5 early arrivals (not in a row), and the two rating badges were switched off.
- **Backend (live, `developer` f00ce0c):** new `App\Services\BadgeService` owns badge criteria, progress (`current`, `threshold`, `progressPct`, `hint`), secret handling and unlocking for both roles. `xp_badges.audience` (player/coach) added by migration `2026_10_02_000005_add_coach_badges_and_audience`, which also sets icons, enables Good Sport and Fan Favourite (player ratings exist now) and adds 8 coach badges: First Whistle (1 session), Session Pro (25), Century Coach (100), Squad Builder (10 active students), Academy Builder (30), Talent Scout (25 evaluations), Top Rated (10 published reviews at 4.5+ average) and secret Iron Coach (a completed session every week for 8 weeks). Venue Favourite stays off (no venue-to-player ratings yet).
- **When badges unlock:** game completion (existing XP engine now delegates to BadgeService), player rating saved, coach session or scheduled session marked completed, student becomes active, evaluation created, review saved (model events, after commit), on opening badge screens (throttled to once per 2 minutes per user), daily `badges:evaluate` at 03:30, and the admin "Re-check now" button. Each new unlock sends a "Badge unlocked" notification (XP notification category) that opens `/app/badges`.
- **API:** `GET /xp/badges` is role-aware and returns `audience`, `items` (with progress), `earned`, `locked`, `secret`, `total` and `next` (closest badge). The player profile `badges` block uses the same data.
- **Admin:** XP → Badges has Player/Coach filters, editable name/description/threshold/visibility/active, plain-language criteria, earned counts and a "Re-check now" button. New badge page lists everyone who earned it (searchable, with links to the player XP page or coach page). Badge cards with progress on the player XP page and the coach page; badge count columns on the player XP list and coach list.
- **App:** new shared Badges page (`/app/badges`) for players and coaches with summary, closest next badge, All/Earned/Locked filters, progress bars and a secret-badge card. Linked from the coach side menu, the coach dashboard Milestone card and Home "View all badges". The player profile badge rail and "All badges" sheet show progress and hints. Badge icons moved to `shared/badge-visuals.ts`.
- **Verified:** 17 XP feature tests pass, including 4 new ones (catalog progress and secret hiding, game unlock, coach session unlock, venue accounts have none). On live: migration ran, backfill checked 21 accounts (none had met a threshold yet, so 0 unlocks and no notifications sent), admin badge, earners, player, coach and coach-list pages render. In the browser as a player, the Badges page and profile sheet show live progress (for example The Connector 1/50). The coach screens were not opened in the browser.
- **Follow-up:** the live server has no cron running `php artisan schedule:run`, so no scheduled jobs run there (including the existing `bookings:expire-pending-approvals` and `wallets:ensure`); badges still unlock through the live triggers. Players cannot leave coach reviews in the app yet, so Top Rated can only be earned from reviews created elsewhere.
