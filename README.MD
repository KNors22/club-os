# ClubOS

## Project Overview

ClubOS is a student club management application inspired by administrative workflows at the McGill Students Running Club. It gives executives and members a shared home for their communities.

**Status: Foundation milestone v0.1.0 implemented.** Payments, renewals, events, attendance, and email delivery belong to phase 2. The [GitHub repository](https://github.com/KNors22/club-os) is public. This implementation has not yet been deployed to production.

## Features

- Account registration, password login, logout, and MongoDB-backed sessions.
- Club creation with one paid CAD membership plan and configurable term length.
- Joining multiple clubs through administrator-provided codes.
- Administrator dashboard counts and searchable, paginated member records.
- Membership status filters: active, expired, and awaiting payment.
- Personal membership details and profile-name updates.
- Club-scoped permissions and responsive, accessible navigation.

The creator is a club's sole administrator and is not automatically enrolled as a paid member. Joining creates an unpaid membership. Recording payments and activating/renewing memberships will be added in phase 2.

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

Setup creates an ignored root `.env` with a random session secret and leaves any existing file unchanged. Set `MONGODB_URI` if not using `mongodb://127.0.0.1:27017/clubos`. See [.env.example](.env.example) for the other settings.

Start MongoDB using your installed database service, then run:

```bash
npm run dev
```

Open **http://localhost:5173**. Vite proxies `/api` to Express on port 3000. Use this exact origin unless you also change `APP_URL`; unsafe requests from other origins are rejected. `GET http://localhost:3000/api/health` checks database connectivity.

Startup connects to MongoDB and creates required indexes before listening. It never seeds or resets application data.

## Usage

1. Create an account and choose **Create club**. Set the club name, fee, and term.
2. Copy its join code from the overview.
3. In a private browser window, register a second account and join with that code.
4. Inspect the second account's **Awaiting payment** membership.
5. Return to the administrator and search/filter the **Members** list.
6. Update the member's name under **My account**, then refresh the member list.
7. Create another club and confirm the member cannot access its records.

Dashboard values come from MongoDB. Empty screens reflect actual data. Payment/event controls are deferred until their features are implemented.

## Development and Testing

| Command | Purpose |
| --- | --- |
| `npm run setup` | Create a local environment file without overwriting one |
| `npm run dev` | Run the API and frontend with reload support |
| `npm run lint` | Lint application, test, and configuration code |
| `npm run typecheck` | Check both TypeScript workspaces |
| `npm test` | Run component and API tests |
| `npm run build` | Build the frontend and compile the API |
| `npm start` | Run compiled Express; production also serves the frontend |
| `npm run check` | Run lint, types, tests, builds, and production smoke checks |
| `npm run test:production` | Build and smoke-test compiled routes and assets |
| `npm run test:browser` | Run the complete two-account flow in installed Chrome |

API tests use disposable MongoDB data. On Homebrew macOS they use an installed `mongod`; otherwise `mongodb-memory-server` downloads a binary on first run. Set `MONGOMS_SYSTEM_BINARY` to use an existing binary. CI uses a MongoDB service via `TEST_MONGODB_URI`, which must select the database `clubos_test` to prevent deletion of application data.

Browser tests start their own disposable database and servers. Stop existing servers on ports 3000/5173 before running them. Chrome must be installed. Alternatively, run `npx playwright install chromium` and set `PLAYWRIGHT_CHANNEL=chromium`. For Firefox, run `npx playwright install firefox`, then `PLAYWRIGHT_FIREFOX=1 npm run test:browser`. Set `CAPTURE_SCREENSHOTS=1` to regenerate the documented desktop/mobile screenshots.

## Technologies Used

- **Frontend:** React, TypeScript, Vite, React Router, Lucide icons, CSS.
- **Backend:** Node.js, Express, Zod, bcryptjs, express-session, connect-mongo, Helmet, express-rate-limit.
- **Database:** MongoDB and Mongoose, with unique account and membership indexes.
- **Validation:** Vitest, Supertest, Testing Library, Playwright.
- **Delivery:** GitHub Actions and a Render deployment blueprint.

## Project Structure

```text
club-os/
├── client/                 # React pages, contexts, components, tests
├── server/
│   ├── src/                # Routes, services, validation, models, configuration
│   └── test/               # API tests and disposable browser QA server
├── e2e/                    # Complete browser workflow
├── docs/                   # Architecture, wireframes, deployment, devlog
├── scripts/                # Environment setup
├── .github/workflows/      # CI checks
├── .env.example
└── render.yaml
```

## Deployment

Prepared for one Render Free service and MongoDB Atlas Free. Production requires an HTTPS application URL, MongoDB URI, and random session secret. Express serves the built frontend and API together, including direct client-route links.

Follow the [deployment guide](docs/deployment.md). No production URL is claimed until account setup and live smoke tests have completed.

## Development Notes

See the [architecture and wireframes](docs/architecture.md), [devlog](docs/devlog.md), and [release history](CHANGELOG.MD). Entries record actual work and verification, without inventing separate development evenings or deployment results.

## Future Improvements

- Full payment recording and renewals with duplicate-submission protection.
- Event creation, capacity-limited registration, and manual attendance.
- Resend confirmation emails delivered to the configured demo inbox.
- QR cards/check-in, exports, announcements, scheduled reminders, and multiple plans.
- Administrator invitations and password recovery.

## Author and Acknowledgements

- Andrey Gonzalez
- Teacher: Martin Lee

## License

Licensed under the [MIT License](LICENSE).
