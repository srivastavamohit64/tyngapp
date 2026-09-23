# TYNG mobile UI/UX quality audit

**Scope:** Ionic Angular frontend (`src/app`)
**Method:** Static review of every routed page, role-specific screen, shared component, global stylesheet and design token. A live in-app browser was not available in this workspace during the review, so this audit records source-backed findings and the visual QA that remains for a device/browser pass.

## Executive assessment

The app already has a clear mobile-first visual language: a light canvas, lime primary action, orange secondary action, rounded surfaces and an established tab/header model. The main quality issue is not a missing design direction; it is that the direction has been implemented independently in many pages. More than one hundred page-level style blocks repeat near-identical values for neutral colours, card radii, shadows, fields and status treatments. This creates visible drift between Player, Coach, Venue and Admin experiences and makes future changes risky.

The recommended treatment is a **non-disruptive consolidation**, not a redesign: preserve all routes, layouts, content hierarchy and flow, while move reusable visual decisions into tokens and shared components.

## Priority findings

| Priority | Finding | End-user effect | Treatment |
| --- | --- | --- | --- |
| Critical | Keyboard focus is globally suppressed and controls do not share an accessible focus treatment. | Keyboard and switch-access users cannot reliably see the active control. | Restore a clear, brand-consistent `:focus-visible` ring without changing tap behaviour. |
| Critical | Brand lime/orange are sometimes used as small text or with white text, which is not consistently high contrast. | Status/action copy can be hard to read in bright conditions. | Use darker semantic ink values for text and retain bright brand colours for fills and emphasis. |
| Critical | Loading, empty and error treatments are implemented independently by page. | A retry/error or empty list can feel like a different product on each screen. | Standardize reusable state surfaces, skeletons, notices and action affordances. |
| Major | Card radius ranges from 12–24px; borders/shadows are redefined per page. | Lists and dashboards feel uneven and less intentional. | Introduce elevation and radius tiers, then apply them in shared cards and global Ionic surfaces. |
| Major | Buttons, chips, segmented controls and search fields each have separate sizing, disabled and pressed rules. | Touch targets and hierarchy vary across flows. | Consolidate component tokens, 48/52/56px control heights, disabled/focus/pressed states and semantic variants. |
| Major | Typography is individually specified in pages (many hard-coded neutral colours and weights). | Section hierarchy and secondary text density vary by role. | Establish consistent display, title, body, label and caption levels via design tokens and shared chrome. |
| Major | Page-level colours and surfaces do not reliably follow theme tokens. | Dark-mode support and future branding changes are fragile. | Replace shared component literals with semantic tokens; use safe global Ionic defaults. |
| Major | Some information-dense lists lack shared truncation, image fallback, divider and touch feedback standards. | Long names, slow images and crowded mobile widths reduce polish. | Add overflow, image shell, interactive feedback and responsive-safe defaults in reusable cards. |
| Minor | Motion timing differs between components and does not consistently honor reduced-motion preferences. | The app can feel abrupt or overly animated. | Standardize short motion curves and disable non-essential motion for reduced-motion users. |
| Minor | Web preview framing has a fixed mobile width but no companion visual QA baseline. | Desktop testing may conceal narrow-device clipping. | Keep the mobile frame and add device-size regression checks as a follow-up. |

## Screen-by-screen audit and refinement plan

The following groups cover every current page component and canonical route. Route aliases intentionally share the same treatment as their canonical screen; no navigation or flow changes are proposed.

| Area / screen | Current consistency risks observed in source | Refinement applied or required |
| --- | --- | --- |
| Splash (`/`, `/splash`) | Standalone transition surface can drift from the app canvas. | Use the same background, motion and reduced-motion rules as the main app. |
| Welcome (`/welcome`) | Hero actions and content spacing are independent of form/action standards. | Align primary/secondary button hierarchy, safe-area spacing and focus treatment. |
| Login / Auth (`/login`, `/auth`) | Form errors, social actions and field shells use page-local values. | Standard field elevation, invalid notice presentation and action states. |
| Forgot password (`/forgot-password`) | Error copy and submit state use one-off styles. | Align with shared field, primary button and alert treatment. |
| Reset password (`/reset-password`) | Error copy and password controls use one-off styles. | Align with shared field, primary button and alert treatment. |
| Player onboarding (`/onboarding`, `/app/onboarding`) | Multi-step progress, selection cards and footer actions can drift from coach/venue onboarding. | Apply shared chip, card, bottom-action and focus standards. |
| Coach onboarding (`/coach-onboarding`) | Profile/setup controls use per-page card and field definitions. | Apply shared input, selection and status standards. |
| Venue onboarding (`/venue-onboarding`) | Location and document states have local field and modal styles. | Apply shared field, map-control and notice treatments. |
| Venue pending approval (`/venue-pending-approval`) | Waiting/empty status surface is not part of the standard state system. | Use consistent state icon, message and supporting-copy hierarchy. |
| Coach complete profile (`/app/coach/complete-profile`) | Dense long-form setup repeats neutral colours, radii and section headers. | Standardize form grouping, field spacing and sticky actions. |
| Venue complete profile (`/app/venue/complete-profile`) | Dense long-form setup repeats neutral colours, radii and section headers. | Standardize form grouping, map/photo surfaces, validation and sticky actions. |
| Main tabs (`/app`) | Floating tab chrome and page clearance are custom but well-established. | Preserve geometry; unify focus/pressed state, labels, badge contrast and surface elevation. |
| Home / Coach dashboard (`/app/home`, `/app/coach/dashboard`) | Dashboard cards and quick actions mix local shadows and type scales. | Harmonize shared card/section/chip standards without changing dashboard content. |
| Discover (`/app/discover`) | Search, filter and venue/event cards use overlapping styles. | Align search field, filter chips, card elevations and skeleton/empty states. |
| Events (`/app/events/:mode`) | Event list status badges and list-card spacing vary from booking cards. | Standardize list card, status badge and metadata density. |
| Venues (`/app/venues`) | Venue summary cards use bespoke image, chip and price styling. | Apply the shared venue card surface, image shell and CTA feedback. |
| Leaderboard (`/app/leaderboard`) | Tabs, rank rows and badges need a common control/row rhythm. | Align tabs, rank/podium surfaces and text hierarchy. |
| Profile (`/app/profile`, `/app/coach/profile`) | Profile cards have legacy dark utility classes mixed with light-theme surfaces. | Tokenize card text/surface colours and normalize action rows. |
| Edit profile (`/app/profile/edit`) | Inputs and save state rely on individual form definitions. | Align field shells, validation and save CTA feedback. |
| Change password (`/app/change-password`) | Password fields and errors are locally styled. | Align field shells, validation and save CTA feedback. |
| Settings (`/app/settings`) | List rows, section headers and toggles have page-level spacing. | Apply row height, divider, icon and chevron alignment standards. |
| Global chat page (`/app/chat`) | Message bubbles and input bar have separate utility-driven styling. | Standardize bubble radii, timestamps, input focus and safe-area footer. |
| Player home / legacy player tab views (`player-home`, `player-tabs`, `player-discover`, `player-venues`, `player-leaderboard`) | Supporting views retain older utility styles beside newer shared components. | Use common surface/typography tokens and interaction feedback when rendered. |
| Search (`/app/search`) | Search result rows, empty result copy and loading skeletons are locally defined. | Align search shell, result row rhythm and state surfaces. |
| Live map (`/app/map`) | Map overlay controls need consistent elevation and clear contrast over imagery. | Standardize floating control, filter chip and bottom-sheet surface rules. |
| Coaches (`/app/coaches`) | Filters and coach cards use inconsistent badge, image and CTA treatments. | Apply shared filter, card/image, badge and button styling. |
| Coach detail (`/app/coaches/:id`) | Hero, metric cards, tabs and CTA may mix card tiers. | Apply elevation tiers, metadata hierarchy and bottom-action treatment. |
| Create game (`/app/game/create`) | Multi-step selection, availability list and confirmation errors are page-local. | Align progress controls, choice cards, skeletons and payment/error notice. |
| Game detail (`/app/game/:id`, `/app/events/details/:id`, `/app/ongoing/:id`) | Dense summary, player list and action sheet surfaces can differ in hierarchy. | Standardize summary card, status chip, row dividers and action feedback. |
| Ongoing games (`/app/ongoing`) | Game list cards need the same status, spacing and empty-state language as bookings. | Apply shared list/card and state styles. |
| Player view (`/app/player/:id`) | Profile loading/error states use a separate state implementation. | Align profile skeleton, state card and action row treatments. |
| Venue detail (`/app/venue/:id`) | Hero overlay, image loading shell, tabs and amenities use a mix of literal colours. | Apply shared neutral/elevation, chip and responsive truncation standards. |
| Venue booking (`/app/venue/:id/book`) | Time-slot selection and footer CTA need the shared pressed/disabled/focus system. | Standardize selected state, control size and safe footer. |
| Booking summary (`/app/venue/:id/summary`) | Coupon, payment and error surfaces are locally styled. | Apply semantic form states, summary card tiers and accessible action hierarchy. |
| My bookings (`/app/my-bookings`) | Segments, booking list and empty/error states are implemented separately. | Use shared segment control, standardized list card and reusable state layout. |
| Booking detail (`/app/my-bookings/:id`) | Detail sections and action affordances vary from game/venue details. | Align section cards, metadata rows, status chip and bottom action. |
| Check-in (`/app/check-in`) | QR/check-in result feedback can feel separate from booking success/error language. | Apply shared success, warning and error surface treatment. |
| Player notifications (`/app/notifications`) | Filter chips, skeletons and notification rows have their own spacing values. | Apply shared chips, loading rows, unread badge and accessible tap states. |
| Wallet (`/app/wallet`) | Financial summary, tabs and form/error states have a unique visual density. | Preserve hierarchy; normalize controls, state cards, input feedback and list rows. |
| Player stats (`/app/stats`) | Metric cards and chart/empty containers need consistent elevation and captions. | Apply card tiers, statistic labels and responsive grid rhythm. |
| XP history (`/app/xp/history`) | Point history rows and no-data copy do not reuse list/state standards. | Apply shared rows, badges and empty-state copy hierarchy. |
| Team management / Friends (`/app/team/manage`, `/app/friends`) | Request, friend, search and empty states are all page-local. | Align list cards, search field, request actions and state surface. |
| Player chat list (`/app/chat`, `/app/coach/chat`) | Chat rows, filter chips and empty/loading states vary from notifications. | Apply common list row, unread badge, chip and skeleton treatment. |
| Chat room (`/app/chat/:id`, `/app/coach/chat/:id`) | Message input/bubbles have legacy utility styling. | Apply standardized bubble, time label, send-control and safe input bar polish. |
| Coach plan (`/app/coach/plan`) | Eight-step session builder contains many local card, facility, footer and progress styles. | Preserve all steps; apply shared card radius/elevation, chosen state, progress, image shell and CTA standards. |
| Coach schedule (`/app/coach/schedule`, `/app/schedule`) | Calendar/list segments, session cards and booking state indicators use local values. | Apply common segment, status badge, empty/loading/error and calendar card treatment. |
| Coach teams (`/app/coach/teams`, `/app/teams`) | Team list and member rows need common list spacing and action states. | Apply shared rows, chips, buttons and empty state. |
| Coach evaluate (`/app/coach/evaluate`) | Evaluation form cards and scoring controls can drift from profile forms. | Apply shared field, selection, progress and save-feedback styling. |
| Coach create session (`/app/coach/create-session`) | Session form and setup choices repeat design values. | Apply shared form groups, choice cards, validation and sticky CTA. |
| Coach book venue (`/app/coach/book-venue`) | Venue results, sport filters and booking cards are distinct from player venue discovery. | Apply shared search/filter/venue-card styles while retaining coach flow. |
| Coach venue booking (`/app/coach/venue-booking`) | Time selection, payment summary and confirmation states are locally defined. | Apply shared controls, notice and summary card tiers. |
| Coach session detail (`/app/coach/session/:id`) | Session summary, attendance and actions mix local badges/cards. | Apply standard detail section, list row and status treatment. |
| Venue collaboration detail (`/app/coach/venue-collab/:id`) | Partner, facility and agreement surfaces need common status/metadata styling. | Apply shared card, chip and information row styles. |
| Coach booking requests (`/app/coach/booking-requests`) | Newly added request actions are polished locally but should inherit global status/button tokens. | Keep the flow; align notice, request card, pending badge and action feedback. |
| Coach students (`/app/coach/students`) | Compact inline screen has independent cards, search and actions. | Apply shared form, list-card, status and empty-state standards. |
| Coach student profile (`/app/coach/student/:id`) | Dense detail and evaluation sections have a local hierarchy. | Align cards, section labels, fields and save feedback. |
| Coach enrol student (`/app/coach/enroll-student`) | Search/selection/onboarding cards repeat local values. | Apply shared search, selected card and CTA standards. |
| Coach earnings (`/app/coach/earnings`) | Financial cards, loaders and errors have their own shadow/colour language. | Align financial surface tiers, loading and error states. |
| Coach insights (`/app/coach/insights`) | Metric/chart cards need consistent labels, spacing and responsive grids. | Apply card tier, type scale and data-empty treatment. |
| Coach community (`/app/coach/community`) | Loading/error copy is basic utility-only UI. | Apply shared state panel and action affordance. |
| Coach chat (`/app/coach/chat`) | Reuses player chat but can inherit coach-specific header routes. | Apply the common chat refinements; retain existing routing. |
| Coach settings (`/app/coach/settings`) | Settings controls use local grouping and row styles. | Apply settings list spacing, section rhythm and focus states. |
| Coach notifications (`/app/coach/notifications`) | Notification rows and state handling differ from player/venue notifications. | Apply shared notification chips, rows, skeletons and unread styles. |
| Venue dashboard (`/app/venue/dashboard`) | Dashboard metric/action cards use a separate role-level style system. | Apply the same elevation/type/quick-action standards as home and coach dashboard. |
| Venue events hub (`/app/venue/events`) | Event cards, filters and state UI vary from player events. | Apply shared card, badge and empty/loading treatment. |
| Create venue event (`/app/venue/events/create`) | Long event form uses page-level control styles. | Apply shared input, selection, image/map and sticky action standards. |
| Venue calendar (`/app/venue/calendar`) | Calendar controls, availability blocks and details use bespoke state colours. | Harmonize selected/blocked/status colours, legend and card elevations. |
| Venue bookings (`/app/venue/bookings`) | Booking list/filter rows use local paddings and tags. | Apply shared segment/filter/list-row/status standards. |
| Venue booking detail (`/app/venue/bookings/:id`) | High-density booking detail uses many literal colour/radius values. | Apply standardized detail cards, statuses, actions and error/confirmation notices. |
| Venue facilities (`/app/venue/facilities`) | Facility cards and add/edit controls use local card and form patterns. | Apply shared card, selection, image and CTA standards. |
| Venue analytics (`/app/venue/analytics`) | Data cards/charts need consistent captions and loading/empty states. | Apply metric card tiers and responsive grid/legend hierarchy. |
| Venue earnings (`/app/venue/earnings`) | Financial cards and transaction rows differ from coach earnings/wallet. | Align financial cards, amount hierarchy, state panels and list rows. |
| Venue profile (`/app/venue/profile`) | Profile/amenity cards use local text and icon styling. | Apply shared profile card, list row and image shell standards. |
| Venue notifications (`/app/venue/notifications`) | Uses a separate notification screen implementation. | Apply shared notification row, skeleton and chip treatment. |
| Venue required-documents modal | Modal controls have their own spacing/elevation and must be resilient to keyboard/gesture insets. | Apply standard modal surface, field/action spacing and safe-area padding. |
| Admin dashboard (`/app/admin/dashboard`) | Admin metrics/cards can diverge from operational dashboards. | Apply the same card tiers, type hierarchy, responsive grid and state surfaces. |
| Admin users (`/app/admin/users`) | Data list/search/filter rows use page-local table-like spacing. | Apply consistent search, filter, row density, truncation and status badges. |
| Admin venues (`/app/admin/venues`) | Approval/list states diverge from venue booking status design. | Apply shared status chips, list row, empty/error and action hierarchy. |
| Admin revenue (`/app/admin/revenue`) | Revenue cards, totals and tables use distinct colour/shadow choices. | Align financial surface tiers, number hierarchy and table/card responsiveness. |
| Admin disputes (`/app/admin/disputes`) | Issue tags and resolution actions need consistent semantic colours. | Apply status badges, readable notice/action contrast and list rhythm. |
| Admin settings (`/app/admin/settings`) | Control sections inherit no common settings row system. | Apply group, row, toggle and action standards. |
| Admin XP rules (`/app/admin/xp-rules`) | Loading/error text is minimal and not visually aligned with other admin screens. | Apply shared state panel, input/action and feedback treatment. |

## Implementation principles

1. **No flow change:** routes, guard rules, labels, calls, forms, data bindings, modal flows and business logic remain untouched.
2. **One surface system:** `canvas`, `subtle`, `card`, `elevated` and `inverse` are semantic tokens rather than page-specific greys.
3. **One interaction system:** minimum 44px icon tap target; standard controls at 48/52/56px; consistent disabled, pressed and keyboard-focus treatment.
4. **One hierarchy:** display → title → body → label → caption, with tokenized colours that remain readable in the light theme.
5. **One state system:** skeletons for loading, card-based empty/error feedback, concise notices and semantic status colours.
6. **Motion is supportive:** short 120–220ms transitions, no navigation changes, and a reduced-motion escape hatch.
7. **Mobile-safe by default:** retain all existing safe-area behavior and desktop preview frame; add truncation/flex guards to prevent narrow-device overflow.

## Acceptance checks after implementation

- Angular template/type compilation succeeds.
- No route, service call, control binding or business action is changed.
- No conflict markers or formatting errors are introduced.
- Shared components have tokenized light/dark-safe surfaces and visible focus states.
- Manual device/browser review remains required for visual regression at 320px, 375px, 390px, 412px and tablet-width preview, including all role logins and loading/error paths.
