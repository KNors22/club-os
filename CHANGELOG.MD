# Changelog

All notable changes follow [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Chrome/Firefox acceptance now verifies real PNG signatures/dimensions, downloads after a concurrent renewal, refreshed page dates, expired status, long names, unpaid-card disabling, and mobile layout. Actual card and desktop/mobile captures accompany compiled-server card checks.
- Members can preview and save a crisp PNG card showing their name, full club name, membership ID, validity, exact Eastern-time expiration, and status. Saving fetches a fresh authenticated snapshot and refreshes the page; unpaid cards are unavailable and expired cards are marked. Accessible text, retry states, route-change cancellation, and five component tests accompany the download.
- Authenticated membership-card snapshots use the current member name, club, validity, expiration, status, and issue time. Cards require activation, retain expired status honestly, and restrict access to the signed-in member. Four API tests cover activation, renewal/profile freshness, expiration, and organization/account isolation.

### Planned

- Verify real confirmation delivery to the demo inbox with private Resend credentials.

[Full Changelog](https://github.com/KNors22/club-os/compare/v1.0.0...HEAD)

## [1.0.0] - 2026-10-31

**Club insights and readable navigation.**

### Added

- Version 1.0.0 aligns workspace/lockfile versions and publishes the chart, navigation, and author-footer milestone with release notes, usage guidance, screenshots, and a dated devlog. Final checks cover 79 component/API tests, production/startup-restart smoke tests, and ten Chrome/Firefox acceptance scenarios.
- Ten Chrome/Firefox scenarios verify chart metrics and periods, accessible tables, upcoming capacity, author credits, long-name wrapping, mobile overflow, and navigation focus. Actual desktop/mobile screenshots and validation notes document the v1 behavior.
- The sidebar is wider on desktop and wraps complete club names, including long unbroken text, with a scrollable mobile drawer. Workspace and sign-in footers now credit Andrey Gonzalez with the current year and GitHub profile, and header names wrap without truncation.
- The administrator overview now includes real membership-status, growth, attendance/payment charts, active-member share, and upcoming-event capacity. Six/twelve-month controls, focus/hover values, readable data tables, and explicit empty states keep the responsive SVG charts useful without adding chart dependencies.
- The administrator dashboard now supplies twelve Eastern-time calendar months of joins, membership totals, attendance, and received payments, plus the next four events with capacity counts. Aggregation tests cover timezone boundaries, prior-member baselines, empty months, chronological limits, and cross-club isolation.

[Full Changelog](https://github.com/KNors22/club-os/compare/v0.6.0-rc.3...v1.0.0)

## [0.6.0-rc.3] - 2026-10-31

**Live Render verification and safe startup diagnostics.**

### Fixed

- Startup logs identify configuration, MongoDB connection, demo initialization, and session-storage failures instead of reporting only a generic exit.
- MongoDB authentication, authorization, network/server-selection, URI-format, and reserved-account errors provide actionable diagnostics without printing raw driver messages, connection strings, or passwords.
- HTTPS-origin and public-demo database validation errors retain their safe configuration field names in startup logs.

### Verification

- After configuring Render's private `SESSION_SECRET` and allowing its outbound IP ranges in Atlas, the public service returned HTTP 200.
- Live administrator/member login, seeded membership/history, secure cookies, logout, and the public-demo frontend were verified at `https://andreys-club-os.onrender.com`.
- 75 component/API tests and both compiled production/startup-restart smoke checks passed locally. Seven new failure-path tests cover classification and credential redaction.
- Public demo credentials remain unchanged: `ClubOSDemo2026!` for the five reserved accounts. Real inbox delivery remains a separate verification step.

[Full Changelog](https://github.com/KNors22/club-os/compare/v0.6.0-rc.2...v0.6.0-rc.3)

## [0.6.0-rc.2] - 2026-10-31

**Render public demo.**

### Added

- Render public demo mode initializes missing fictional accounts, clubs, memberships, payment history, events, and attendance in the application's `ClubOS-DB` before accepting requests.
- A static public `DEMO_PASSWORD` of `ClubOSDemo2026!`, with administrator/member shortcuts and a shared-account notice on the login page.
- Scoped synchronization restores only reserved demo-account passwords and preserves ordinary accounts, edited records, validity, payment history, event registrations, and attendance.
- Compiled-process startup/restart verification and additional API/component/browser coverage for Render configuration and public demo login.

### Changed

- The seed targets `ClubOS-DB`, matching the application's database and current setup examples.
- Production origin configuration falls back to Render's `RENDER_EXTERNAL_URL`; an explicit HTTPS `APP_URL` supports custom domains.
- The Render blueprint specifies the existing `andreys-club-os` service, main branch, public demo settings, compiled start command, and installation of build dependencies.
- Root/client/server and lockfile versions align at `0.6.0-rc.2`; README, deployment guide, demo instructions, submission notes, and devlog document the public service and credentials.

### Verification

- 68 component/API tests, production builds, compiled production and Render startup/restart smoke checks, and eight Chrome/Firefox scenarios passed locally.
- The configured Atlas demo records/passwords were synchronized without resetting club records. Live deployment verification is performed after publication; real inbox delivery remains separate.

[Full Changelog](https://github.com/KNors22/club-os/compare/v0.6.0-rc.1...v0.6.0-rc.2)

## [0.6.0-rc.1] - 2026-10-30

**Validation and submission candidate.**

### Added

- The validation/submission candidate aligns all workspace and lockfile versions at v0.6.0-rc.1, consolidates completed changelog entries into a dated release, and includes release notes. Clean installation and full local checks pass; live hosting, production browser acceptance, and real inbox delivery remain explicitly pending connected accounts.
- The submission guide links required deliverables, records the five-minute administrator/member and fee-change walkthrough, and separates verified local evidence from pending hosting/inbox acceptance. README setup/usage, fictional-account instructions, example seed settings, screenshots, and the truthful weekly devlog are complete; local documentation links are validated.
- Compiled production smoke checks cover secure sessions, fee changes, payments/renewals, organization isolation, registration/cancellation, repeated attendance, dashboard totals, and logout with scoped cleanup. Read-only live readiness and explicit live browser commands are documented; public hosting and actual inbox delivery remain pending connected accounts.
- Six Chrome/Firefox scenarios pass across desktop and mobile, including changed-fee renewals, seeded access, keyboard menu containment/Escape, failure recovery, and member restrictions. Mobile focus, dashboard labels, and seed timestamp preservation are corrected; CI runs browser acceptance with reports/traces, refreshed screenshots, and validation evidence.
- The existing local-origin fix is now committed with regression tests and setup documentation. Development permits localhost and 127.0.0.1 only at the configured scheme and port; production and non-local origins retain exact matching.
- An explicit demo seed command creates fictional administrator/member accounts, membership states, payment history, events, and attendance in a dedicated database. Reruns preserve edited records and passwords, reserved-address collisions fail safely, and no startup seed or email side effects are introduced.


### Fixed

- Local development accepts both `localhost` and `127.0.0.1` with the configured scheme and port, preventing valid form submissions from failing origin validation. Production still requires the exact configured application origin.

[Full Changelog](https://github.com/KNors22/club-os/compare/v0.5.0...v0.6.0-rc.1)

## [0.5.0] - 2026-10-30

**Administrator fee management.**

### Added

- Administrator club settings provide fee editing in CAD, immediate shared-state updates, retained inputs on errors, and refresh controls for stale edits. Member access redirects safely, component tests cover saves and conflicts, and workspace versions align at v0.5.0.
- Administrators can update club fees through a validated API with stale-update protection. Existing payment history and membership dates are preserved; tests cover changed-fee renewals, saved-request retries, permissions, invalid input, and competing updates.

[Full Changelog](https://github.com/KNors22/club-os/compare/v0.4.0...v0.5.0)

## [0.4.0] - 2026-10-30

**Club workflows milestone.** Tagged at [`4f92808`](https://github.com/KNors22/club-os/commit/4f928088ef431bf0c61a523366a5b7dbe516c1c7).

### Added

- Membership activation/renewal and event-registration confirmations through Resend's HTTPS API, routed exclusively to the configured demo inbox after persistence.
- Bounded email timeouts, clear disabled/failure notices, and duplicate-payment confirmation suppression. Delivery failure preserves the successful payment or registration.
- Chrome/Firefox acceptance tests for payment, renewal, registration, cancellation, attendance, and dashboard workflows, including desktop/mobile layouts and screenshots.
- Separate disposable QA ports, updated usage/deployment instructions, architecture documentation, and dated devlog results.

### Verification

- Lint, TypeScript, 45 component/API tests, production builds, and compiled-server smoke checks passed at the tagged commit; GitHub Actions also passed.
- Four browser scenarios passed across Chrome and Firefox. Actual inbox delivery and live hosting remain unverified.

[Full Changelog](https://github.com/KNors22/club-os/compare/v0.3.0...v0.4.0)

## [0.3.0] - 2026-10-30

**Events and attendance.** Tagged at [`dc48a52`](https://github.com/KNors22/club-os/commit/dc48a524acd181a546ea3fde3b3729cd08cf00fd).

### Added

- Administrator event creation with dates, locations, capacity limits, and participant lists.
- Responsive member event browsing, registration, and cancellation screens.
- Active-membership requirements and atomic capacity/duplicate checks, including concurrent requests for the last place.
- Idempotent manual check-in that preserves the original attendance timestamp and prevents cancellation of checked-in registrations.
- Club-scoped dashboard APIs for confirmed payments, pending initial fees, renewals due within 30 days, registrations, and attendance, with summary screens.
- Component/API tests for event permissions, capacity races, cancellation, repeated check-in, and dashboard isolation.

[Full Changelog](https://github.com/KNors22/club-os/compare/v0.2.0...v0.3.0)

## [0.2.0] - 2026-10-30

**Payments and renewals.** Tagged at [`3c5c352`](https://github.com/KNors22/club-os/commit/3c5c352835964bcf74d8e73d175b2b40b2b795c4).

### Added

- Full-fee manual payment recording with method, reference, date, and membership activation.
- Renewal calculations that extend validity from the later of recording time and the current expiration.
- Embedded payment/renewal history, request identifiers, and optimistic concurrency to prevent duplicate or competing submissions from applying twice.
- Administrator member-detail/payment forms and personal membership history screens.
- Component/API tests for payment permissions, initial payments, early/expired renewals, and repeated/concurrent submissions.

[Full Changelog](https://github.com/KNors22/club-os/compare/v0.1.0...v0.2.0)

## [0.1.0] - 2026-10-29

**Foundation milestone — stable release.** Completes Foundation across 13 focused commits, including the setup and backend milestones below.

### Added

- Account registration/login, protected routes, profile editing, reusable controls, and component tests.
- Club creation/joining screens, accessible club selection, and workspace navigation.
- Administrator dashboards, join-code copying, member management, and responsive personal membership views.
- Chrome/Firefox acceptance workflow, disposable browser QA database, and desktop/mobile screenshots.
- GitHub Actions checks, Render configuration, production frontend serving, and deployment instructions.
- Repeatable production smoke checks for database health, direct application routes, compiled assets, security headers, and API error responses.

[Full Changelog](https://github.com/KNors22/club-os/compare/v0.0.3...v0.1.0)

## [0.0.3] - 2026-10-29

**Backend workflows — prerelease.**

### Added

- Secure account/profile APIs, password hashing, persistent sessions, and authentication safeguards with tests.
- Club creation, joining by code, concurrent duplicate protection, and organization isolation with tests.
- Own-membership views, administrator member search/filtering/pagination, and dashboard counts with tests.

[Full Changelog](https://github.com/KNors22/club-os/compare/v0.0.2...v0.0.3)

## [0.0.2] - 2026-10-29

**Project setup — prerelease.**

### Added

- Foundation architecture, data relationships, role boundaries, and screen wireframes.
- React/Express workspaces, Node 24 configuration, local setup, MongoDB connectivity, and health checks.

[Full Changelog](https://github.com/KNors22/club-os/compare/v0.0.1...v0.0.2)

## [0.0.1] - 2026-10-29

### Added

- Initial repository with README and MIT license.
