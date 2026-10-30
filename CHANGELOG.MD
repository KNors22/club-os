# Changelog

All notable changes follow [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- An explicit demo seed command creates fictional administrator/member accounts, membership states, payment history, events, and attendance in a dedicated database. Reruns preserve edited records and passwords, reserved-address collisions fail safely, and no startup seed or email side effects are introduced.
### Planned

- Live Render/Atlas deployment, a verified public application URL, and production workflow checks.
- Real confirmation delivery to the demo inbox using configured Resend credentials.
- Final submission documentation and live acceptance evidence.

[Full Changelog](https://github.com/KNors22/club-os/compare/v0.5.0...HEAD)

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
