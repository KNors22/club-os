# Changelog

All notable changes follow [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Manual payment APIs activate and renew memberships, preserve payment history, and prevent duplicate or concurrent payment submissions using request IDs and optimistic concurrency.
- Administrators can record verified payments from member details, while members can view their own payment and renewal history. Payment forms retain request IDs across retries and membership dates update after confirmation.
- Club administrators can create events and view participants; active members can register or cancel. Atomic event updates enforce capacity and prevent duplicate registrations while participant identities stay restricted to administrators.
- Responsive event screens support event creation, paginated browsing, membership-aware registration, cancellation, and administrator participant lists with loading and failure states.
- Administrators can check in registered participants from event details. Check-in retries preserve the original timestamp, and atomic updates keep cancellation and attendance consistent under concurrent requests.
- Administrator dashboards show confirmed payment totals, initial fees awaiting confirmation, renewals due within 30 days, upcoming events, registrations, and attendance. Aggregations remain scoped to the selected club.

### Planned

- Demo-inbox email confirmations.
- Live Render/Atlas deployment and a verified public application URL.
- Fictional demo-data seed command and final submission documentation.

## [0.1.0] - 2026-10-29

### Added

- Account registration/login, protected routes, profile editing, reusable controls, and component tests.
- Club creation/joining screens, accessible club selection, and workspace navigation.
- Administrator dashboards, join-code copying, member management, and responsive personal membership views.
- Chrome/Firefox acceptance workflow, disposable browser QA database, and desktop/mobile screenshots.
- GitHub Actions checks, Render configuration, production frontend serving, and deployment instructions.

## [0.0.3] - 2026-10-29

### Added

- Secure account/profile APIs, password hashing, persistent sessions, and authentication safeguards with tests.
- Club creation, joining by code, concurrent duplicate protection, and organization isolation with tests.
- Own-membership views, administrator member search/filtering/pagination, and dashboard counts with tests.

## [0.0.2] - 2026-10-29

### Added

- Foundation architecture, data relationships, role boundaries, and screen wireframes.
- React/Express workspaces, Node 24 configuration, local setup, MongoDB connectivity, and health checks.

## [0.0.1] - 2026-10-29

### Added

- Initial repository with README and MIT license.
