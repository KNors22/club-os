# Render deployment and public demo

The application is configured for [Andrey's ClubOS web service](https://andreys-club-os.onrender.com), one Node web service serving both the Express API and compiled React frontend. The `main` branch and release tag identify the reviewed source. A configured URL is distinct from a successful live verification; actual results are recorded in the devlog.

## Existing service settings

For a manually created service, match these settings in Render. Committing `render.yaml` configures Blueprint-managed services; it does not automatically replace settings on an unrelated manually created service.

| Setting | Value |
| --- | --- |
| Repository | `KNors22/club-os` |
| Branch | `main` |
| Root directory | Repository root; leave blank |
| Runtime | Node |
| Build command | `npm ci --include=dev && npm run build` |
| Start command | `npm start` |
| Health check | `/api/health` |
| Node version | `24.21.0` |
| Auto deploy | After CI Checks Pass |

The start command runs compiled JavaScript. TypeScript and Vite are available during the build through `--include=dev`; no `tsx` or development server is required at runtime. Express listens on `0.0.0.0` using Render's assigned `PORT`.

## Environment and Atlas

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `NODE_VERSION` | `24.21.0` |
| `MONGODB_URI` | Private Atlas URI selecting `/ClubOS-DB` before any query string |
| `SESSION_SECRET` | Private random value of at least 32 characters; the blueprint generates one |
| `APP_URL` | Optional exact HTTPS custom origin; otherwise the app uses `RENDER_EXTERNAL_URL` |
| `DEMO_MODE` | `true` for this public demo; defaults on when Render sets `RENDER=true`; set `false` to disable startup seeding and the credential panel |
| `DEMO_PASSWORD` | `ClubOSDemo2026!` — intentionally public demo password |
| `RESEND_API_KEY` / `EMAIL_DEMO_TO` | Optional private pair for demo-inbox confirmations |
| `EMAIL_FROM` | Optional; defaults to `onboarding@resend.dev` |

Render supplies `RENDER_EXTERNAL_URL` and `PORT`; do not copy localhost development settings into a production `APP_URL`. Explicit origins must use HTTPS and contain no path, credentials, or query string. Keep `SESSION_SECRET` stable across deploys so MongoDB-backed sessions remain valid.

Create an Atlas database user with read/write access to `ClubOS-DB`. Add this Render service's outbound addresses to the Atlas network access list. A successful local Atlas connection does not establish that Render's outbound addresses are allowed. Store database credentials and session/email secrets only in private environment settings.

## Seeded public accounts

In public demo mode, startup connects to MongoDB, creates indexes, and seeds missing fictional records **before listening**. This works with a Free web service's normal start command; it does not depend on a paid pre-deploy command or interactive shell. The same `MONGODB_URI` is used for both seeding and API requests.

Use these credentials at `/login`:

| Email | Role |
| --- | --- |
| `admin@clubos.example` | Demo Running Club administrator |
| `member@clubos.example` | Active member |
| `pending@clubos.example` | Awaiting payment |
| `expired@clubos.example` | Expired member |
| `other-admin@clubos.example` | Separate Demo Art Club administrator |

**Password for all five: `ClubOSDemo2026!`.** The login page provides administrator/member shortcuts when public demo mode is enabled. All visitors share the fictional accounts and their edits.

Restarts insert only missing demo records and restore the configured password only for the reserved demo account IDs/emails. They preserve fees, membership dates/history, event dates, registrations, attendance, and ordinary account passwords. Reserved-address collisions with unrelated accounts fail instead of changing those accounts. Turning demo mode off does not delete existing demo records. No seed emails are sent.

A local explicit seed uses the same target database. To synchronize existing demo passwords, run `DEMO_MODE=true npm run seed:demo` with the intended private `MONGODB_URI` configured. The compiled equivalent is `DEMO_MODE=true node server/dist/seed.js`. `DEMO_DATABASE_URI` affects only that explicit command; hosted startup always seeds the application's `MONGODB_URI`.

## Verification

```bash
npm run check
PLAYWRIGHT_FIREFOX=1 npm run test:browser
npm run verify:live -- https://andreys-club-os.onrender.com
```

`npm run check` includes a compiled-process Render startup/restart test with a disposable MongoDB instance. It verifies automatic origin selection, seeded account login, Mongo-backed session persistence, preserved edits, and demo-only password synchronization. The public readiness command checks health, direct routes, assets, and API errors without writes.

For the full two-account live workflow:

```bash
APP_LIVE_URL=https://andreys-club-os.onrender.com PLAYWRIGHT_FIREFOX=1 npm run test:live
```

This creates fictional clubs, payments, registrations, and attendance on the live application. It never resets existing records. Confirm actual membership/event emails separately when Resend is configured.

Render Free services sleep after 15 minutes without inbound traffic and can take about a minute to resume. The readiness probe allows a longer health-check timeout. Data and sessions persist in Atlas, independent of Render's ephemeral filesystem. Email uses HTTPS rather than SMTP.

## References

- [Render default environment variables](https://render.com/docs/environment-variables)
- [Render deployment and CI behavior](https://render.com/docs/deploys)
- [Render Free service limitations](https://render.com/docs/free)
- [Render Blueprint specification](https://render.com/docs/blueprint-spec)
