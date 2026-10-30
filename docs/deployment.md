# ClubOS deployment

## Current state

Production build, GitHub Actions, Render blueprint, and frontend route serving are prepared. **A Render service and Atlas database have not been provisioned from this workspace.** Source contains no production credentials.

## Atlas setup

1. Create a free cluster and database user with read/write access to `clubos`.
2. Set Render's `MONGODB_URI` to the Node.js connection URI with `/clubos` before the query string. URL-encode special password characters.
3. Allow your development IP if connecting locally. Add the Render service's outbound IP ranges from its dashboard to Atlas network access for hosting.

Records and sessions live in MongoDB, independent of Render's ephemeral filesystem. Startup creates required unique indexes and the session TTL index. The additive schema changes need no application-data migration and never automatically resets/seeds data.

## Source and CI

Commit the reviewed files and dependency lockfile to the existing public repository, excluding `.env`, credentials, caches, and build output. Keep unrelated local edits outside release commits. The workflow checks installation, linting, TypeScript, tests, and builds on main pushes and pull requests, using Node 24 and a MongoDB test service.

## Render setup

Connect Render to GitHub and create a Blueprint using `render.yaml`, or a free Node web service with:

| Setting | Value |
| --- | --- |
| Root directory | Repository root |
| Build | `npm ci --include=dev && npm run build` |
| Start | `npm start` |
| Health check | `/api/health` |
| Node | `24.21.0` |
| Auto deploy | After CI Checks Pass |

The blueprint specifies `autoDeployTrigger: checksPass`. Use the GitHub provider integration so Render can observe checks; a bare public repository URL does not provide this integration.

| Environment variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `NODE_VERSION` | `24.21.0` |
| `APP_URL` | Actual assigned HTTPS origin; no path or query |
| `MONGODB_URI` | Private Atlas connection URI |
| `SESSION_SECRET` | Random secret of at least 32 characters; blueprint generates one |
| `PORT` | Render supplies it; server listens on `0.0.0.0` |
| `RESEND_API_KEY` | Optional private Resend API key; configure with `EMAIL_DEMO_TO` |
| `EMAIL_DEMO_TO` | Optional account-owner inbox; all confirmations route here |
| `EMAIL_FROM` | Optional sender; defaults to `onboarding@resend.dev` |

Set `APP_URL` to the service's final assigned HTTPS origin before smoke testing, then redeploy if it changed after creation. An incorrect origin blocks write requests. Production requires HTTPS for secure session cookies behind Render's TLS proxy.

## Live smoke test

1. Verify `/api/health` returns 200 and `database: connected`.
2. Load `/register` directly, register an administrator, and create a club.
3. In a private browser, register a member and join using the code.
4. Reload the member's club page; verify the session persists and membership awaits payment.
5. Search the member list and confirm the administrator dashboard updates.
6. Create a second club and verify the member cannot access it.
7. Load `/app/<club-id>/members` directly as administrator to verify SPA routing.
8. Update the fee in **Club settings**, confirm a member cannot access settings, then record a full payment from member details; verify activation, history, dashboard totals, and a demo-inbox confirmation when configured. Repeat with a renewal and check the extended expiration.
9. Create an upcoming event, register the member, cancel, and register again. Check in the member from the administrator participant list; verify attendance and membership restrictions.
10. Confirm email-disabled/provider-failure notices preserve changes. Verify real inbox delivery separately; local mocked tests do not prove this.
11. Sign out and check protected-page redirects. Redeploy and confirm stored records/sessions survive.

Add the live URL to the README and record deployment success only after this test. Passing local checks alone does not prove hosting works.

Render Free sleeps after 15 minutes without traffic and can take about a minute to resume. Document the first-load delay for the capstone. Resend email delivery uses HTTPS because free services block SMTP ports.

## References

- [Render Express deployment](https://render.com/docs/deploy-node-express-app)
- [Render blueprint fields](https://render.com/docs/blueprint-spec)
- [Render CI integration](https://render.com/docs/deploys)
- [Render Free limitations](https://render.com/docs/free)
- [Atlas Free limitations](https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/)


## Executable deployment verification

After deployment and CI success, run the read-only public readiness probe:

```bash
npm run verify:live -- https://your-assigned-app.onrender.com
```

It checks database health, notification mode, direct frontend routes, built assets, CSP, and JSON API errors. Its health timeout allows for a sleeping free service. It does not create data or prove account workflows/inbox delivery.

For the same two-account workflow used locally, run against the actual HTTPS origin:

```bash
APP_LIVE_URL=https://your-assigned-app.onrender.com PLAYWRIGHT_FIREFOX=1 npm run test:live
```

This explicitly creates fictional accounts, clubs, received-payment records, and events on that application; it does not reset existing data. Email confirmations follow the server's demo-inbox configuration. Live acceptance excludes the local seeded-account test because public hosting does not share the disposable QA database. Confirm receipt of both membership and registration messages in the demo inbox separately, then record the actual URL/date/result in the submission notes.

`npm run test:production` builds and tests the compiled production application against isolated MongoDB data. It now verifies secure-cookie attributes behind a simulated HTTPS proxy, account/session persistence, organization isolation, fee changes, payments/renewals, registration/cancellation, repeated check-in, dashboard totals, and logout, in addition to compiled frontend routes and assets. Only records created by that smoke run are cleaned up.

Optional Resend credentials remain hosting environment variables. Leave both `RESEND_API_KEY` and `EMAIL_DEMO_TO` unset to disable delivery, or configure both together. Do not add private values to the blueprint or repository. The seed command is manual; select a dedicated `clubos_demo` database if using it for the live demonstration.
