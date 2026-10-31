# ClubOS

## Project Overview

ClubOS is a student club management application inspired by administrative workflows at the McGill Students Running Club. It gives executives and members a shared home for their communities.

**Status: v1.3.0 actionable dashboard.** [Open ClubOS](https://andreys-club-os.onrender.com). The service uses Atlas-backed records and sessions; free-service startup can take about a minute. Real demo-inbox delivery remains a separate configuration/verification step. See the [Render configuration](render.yaml), [submission guide](docs/submission.md), and [validation evidence](docs/validation.md).

## Features

- Account registration, password login, logout, and MongoDB-backed sessions.
- Historical sample data: 48 people with `firstname@clubos` addresses, six clubs, 212 memberships, 465 events and 1,150 payments on a fresh October 31, 2026 seed. History starts in 2010; existing records and edits are preserved.
- Club creation with one paid CAD membership plan and configurable term length. Administrators can update future membership fees under **Club settings** without changing historical payments or current validity.
- Joining multiple clubs through administrator-provided codes.
- Administrator dashboard with membership-status, member-growth, attendance/payment charts, upcoming-event capacity, and searchable member records.
- Membership status filters: active, expired, and awaiting payment.
- Personal membership details and profile-name updates.
- Downloadable PNG membership cards with the member name, full club name, membership ID, validity dates, expiration time, and status.
- Club-scoped permissions, a wider sidebar with wrapping club names, accessible responsive navigation, and author/year/GitHub footer credits.
- Administrator recording of received payments, membership activation/renewal, and payment history.
- Events with capacity limits, active-member registration, cancellation, and manual check-in.
- Club-scoped payment, renewal, event, and attendance dashboard summaries.
- Optional Resend confirmations routed exclusively to a configured demo inbox; delivery failures preserve successful changes.

The creator is a club's sole administrator and is not automatically enrolled as a paid member. Joining creates an unpaid membership. An administrator records the full membership fee after receiving it. Active memberships extend from their expiration; pending or expired memberships start when the administrator records the payment. Each payment request has an identifier to prevent a retry from renewing twice. ClubOS records manual payments; it does not collect money online.

## Installation Instructions

### Prerequisites

- Node.js **24** and npm; use `nvm use` if nvm is installed.
- MongoDB 7+ running locally, or a MongoDB Atlas connection URI.

### Local setup

```bash
git clone https://github.com/KNors22/club-os.git
cd club-os
nvm use
npm ci
npm run setup
```

Setup creates an ignored root `.env` with a random session secret and leaves any existing file unchanged. Set `MONGODB_URI` if not using `mongodb://127.0.0.1:27017/ClubOS-DB`. See [.env.example](.env.example) for the other settings.

Start MongoDB using your installed database service, then run:

```bash
npm run dev
```

Open **http://localhost:5173** or **http://127.0.0.1:5173**. Vite proxies `/api` to Express on port 3000. In development, a local `APP_URL` permits both hostnames with the same scheme and port. Use one consistently: browsers keep their sessions separate. Other origins are rejected, and production requires the exact configured `APP_URL`. `GET http://localhost:3000/api/health` checks database connectivity.

Startup connects to MongoDB and creates indexes before listening. Public demo mode also inserts missing fictional sample records and synchronizes only reserved account passwords; it preserves edited records and ordinary accounts. Public demo mode defaults on in Render and is opt-in locally through `DEMO_MODE=true`.

## Usage

For the public sample data, sign in as **`alex@clubos`** or **`jordan@clubos`**, both with **`ClubOSDemo2026!`**. The login page provides role shortcuts and an **Explore another account** selector limited to **alex, jordan, taylor, morgan, maya, noah, olivia and ethan** (all `@clubos`). These are shared fictional accounts; visitor edits are shared. See [all sample accounts and clubs](docs/sample-data.md). You can also register separate accounts to try both roles:

1. Register an administrator, choose **Create club**, and set its name, fee, and term.
2. Copy the join code from the overview. In a private browser window, register another account and join with that code.
3. As administrator, open **Members**, select the member, and record the received payment, method, date, and optional reference. Confirm that you received the full fee.
4. Refresh the member's **Membership** page to see active status and payment history. Choose **Save card (PNG)** to keep a membership card. Optionally update the fee under **Club settings**, then record a renewal at the new fee. Historical payments and current validity remain unchanged by the fee edit itself.
5. As administrator, open **Events** and create an upcoming event with a capacity.
6. As member, open the event and register. Try cancellation and registration again.
7. As administrator, open the event's participant list and choose **Check in**. Refresh the overview to see payment, membership, registration, and attendance totals.
8. Update a name under **My account**. Create another club and confirm unrelated accounts cannot access its records.

### Historical sample data

Run `npm run seed` using the configured `MONGODB_URI`, then `npm run dev`. The local project and Render see the same records when they use the same Atlas database. Render initializes missing sample records on startup in its existing public mode; the older seed command remains an alias.

Use `alex@clubos` to open Riverside Running Club, then find **Maya Desai** under **Members** to inspect renewals dating to 2010. Other accounts administer the arts, outdoors, cycling, books and makers clubs. The original five identities keep their IDs, with first-name addresses replacing their old addresses. Configured passwords stay compatible.

See the [sample-data guide](docs/sample-data.md), [populated dashboard](docs/screenshots/sample-data-dashboard.png), and [historical payments](docs/screenshots/sample-data-history.png). Shared `@clubos` addresses are sign-in identities, not mailboxes; seeding sends no email.

For an independent local database, use these root `.env` settings and restart `npm run dev`:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/ClubOS-DB
DEMO_MODE=true
```

`DEMO_MODE=true` displays the eight sample sign-in choices and enables missing-record initialization. The local MongoDB database and the hosted Atlas database are separate unless you deliberately configure the same URI.

### Save a membership card

Sign in as a member, open the club, then choose **My membership → Save card (PNG)**. Your browser downloads a 2160×1360 image containing your current name, club, membership ID, validity, and exact expiration in Eastern time. You can save it on your device or print it.

Cards become available after the administrator activates membership. Expired memberships have a clearly marked **Save expired card (PNG)** option. Saving fetches the latest information and refreshes the page, so a renewal is reflected even if the page was already open. Saved cards are static copies: save a fresh card after renewal. There is no scanning step.

See the [sample PNG](docs/screenshots/membership-card.png) and [member page](docs/screenshots/membership-card-desktop.png).

### Dashboard charts

The administrator overview cards open **Total members**, **Active members** (with the active filter applied), or **Upcoming events**. **Payments received** selects Payments in the insights graph and scrolls/focuses that section. Cards work with the keyboard, and scrolling respects reduced-motion preferences. Member search, status and page are in the URL so refresh and Back preserve the current view.

Administrators can select the last six or twelve calendar months, switch attendance/payment activity, focus or point to chart values, and expand the monthly data tables. Membership status and active share reflect current validity. The member-growth line counts joined records over time, including members from before the displayed period. Attendance uses recorded check-in dates; payment trends use received dates. Monthly totals use Eastern Time. Upcoming-event rows show the next four events and their registration capacity. Empty clubs show explicit zero-data states.

See [desktop](docs/screenshots/v1-dashboard-desktop.png) and [mobile](docs/screenshots/v1-dashboard-mobile.png) screenshots.

## Development and Testing

| Command | Purpose |
| --- | --- |
| `npm run setup` | Create a local environment file without overwriting one |
| `npm run dev` | Run the API and frontend with reload support |
| `npm run seed` | Seed historical fictional data in the `ClubOS-DB` database |
| `npm run lint` | Lint application, test, and configuration code |
| `npm run typecheck` | Check both TypeScript workspaces |
| `npm test` | Run component and API tests |
| `npm run build` | Build the frontend and compile the API |
| `npm start` | Run compiled Express; production also serves the frontend |
| `npm run check` | Run lint, types, tests, builds, and production smoke checks |
| `npm run test:production` | Build and smoke-test compiled routes and assets |
| `npm run test:browser` | Run Foundation, club workflows, and keyboard/responsive acceptance in installed Chrome |
| `npm run verify:live -- <https-origin>` | Read-only readiness check of a deployed app |
| `APP_LIVE_URL=<https-origin> npm run test:live` | Run two-account browser acceptance against a live app, creating fictional records |

API tests use disposable MongoDB data. On Homebrew macOS they use an installed `mongod`; otherwise `mongodb-memory-server` downloads a binary on first run. Set `MONGOMS_SYSTEM_BINARY` to use an existing binary. CI uses a MongoDB service via `TEST_MONGODB_URI`, which must select the database `clubos_test` to prevent deletion of application data.

Browser tests start their own disposable database and servers. QA uses API port 3100 and frontend port 5174, separately from normal development on 3000/5173; keep the QA ports free. Chrome must be installed. Alternatively, run `npx playwright install chromium` and set `PLAYWRIGHT_CHANNEL=chromium`. For Firefox, run `npx playwright install firefox`, then `PLAYWRIGHT_FIREFOX=1 npm run test:browser`. Set `CAPTURE_SCREENSHOTS=1` to regenerate the documented desktop/mobile screenshots. Version 1.3.0 passes 100 component/API tests (28 frontend and 72 backend), ten Chrome/Firefox scenarios, and compiled production/startup-restart smoke checks. GitHub Actions also runs Chromium/Firefox acceptance and retains reports/traces as artifacts. The [validation guide](docs/validation.md) records coverage and remaining live checks.

The final review found 12 moderate development-tooling audit findings in the ESLint/TypeScript-ESLint/minimatch chain. `npm audit --omit=dev` reports zero production findings; no high or critical findings were reported. See the dated [validation evidence](docs/validation.md) for the audit scope and outstanding live acceptance.

## Technologies Used

- **Frontend:** React, TypeScript, Vite, React Router, Lucide icons, CSS.
- **Backend:** Node.js, Express, Zod, bcryptjs, express-session, connect-mongo, Helmet, express-rate-limit.
- **Database:** MongoDB and Mongoose, with unique account and membership indexes.
- **Validation:** Vitest, Supertest, Testing Library, Playwright.
- **Delivery:** Resend HTTPS API, GitHub Actions, and a Render deployment blueprint.

## Project Structure

```text
club-os/
├── client/                 # React pages, contexts, components, tests
├── server/
│   ├── src/                # Routes, services, validation, models, configuration
│   └── test/               # API tests and disposable browser QA server
├── e2e/                    # Complete browser workflow
├── docs/                   # Architecture, sample data, validation, releases, devlog
├── scripts/                # Environment setup and live readiness
├── .github/workflows/      # CI checks
├── .env.example
└── render.yaml
```

## Deployment

Configured for one Render Free web service and MongoDB Atlas. Production requires a private MongoDB URI selecting `ClubOS-DB` and a random session secret. The app uses Render's supplied HTTPS URL unless `APP_URL` explicitly overrides it. Express serves the built frontend and API together, including direct client-route links.

Use the repository root as the service root, build with `npm ci --include=dev && npm run build`, start with `npm start`, and use `/api/health` as the health check. Configure `MONGODB_URI` and `SESSION_SECRET` privately in the service; the session secret needs at least 32 characters. Allow the service's outbound addresses in Atlas Network Access. The [Render configuration](render.yaml) supplies the remaining defaults and requests deployment after successful GitHub checks. A manually created service must have matching settings.

Run `npm run verify:live -- https://andreys-club-os.onrender.com` for a read-only readiness probe. `APP_LIVE_URL=<https-origin> npm run test:live` creates fictional records and should be run deliberately against the intended service. The [submission guide](docs/submission.md) includes the demo script and the remaining live acceptance steps. Hosting credentials and email secrets belong in private environment variables.

## Development Notes

See the [architecture and wireframes](docs/architecture.md), [devlog](docs/devlog.md), [latest release notes](docs/releases/v1.3.0.md), and [release history](CHANGELOG.MD). Entries record actual work and verification, without inventing separate development evenings or deployment results.

## Future Improvements

- Verification of real demo-inbox delivery with Resend credentials.
- QR scanning/check-in, exports, announcements, scheduled reminders, and multiple plans.
- Administrator invitations and password recovery.

## Author and Acknowledgements

- Andrey Gonzalez
- Instructor: Martin Lee

## License

Licensed under the [MIT License](LICENSE).
