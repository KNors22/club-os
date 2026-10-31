# Validation evidence

## October 30, 2026 — local validation

All checks use disposable data. No real membership database was reset or seeded during verification.

| Area | Verification |
| --- | --- |
| Accounts and sessions | Registration, login/logout, profile updates, persisted sessions, request origins, and cookie safeguards |
| Organization isolation | Administrator/member restrictions and attempts to read or write another club's records |
| Memberships and money | Pending/active/expired boundaries, full payments, early/expired renewals, duplicate/concurrent submissions, history, and changed-fee renewals |
| Fee editing | Administrator-only updates, integer CAD bounds, stale concurrent edits, retained form input, shared club state, unchanged historical amounts/validity |
| Events | Duplicate registration, last-place concurrency, cancellation, repeated check-in, and cancellation/check-in races |
| Notifications | Mocked demo recipient, successful provider response, timeout/failure persistence, no duplicate payment resend, and credential-free public configuration |
| Demo records | Dedicated database guard, useful scenarios, non-destructive reruns with unchanged timestamps, unchanged passwords, and reserved-address collision rejection |
| UI | Loading/empty/failure states, form labels, account redirects, mobile overflow, keyboard focus containment, Escape, direct routes, and unknown routes |

**Component/API result:** 59 tests passed (17 frontend and 42 backend).

`npm run check` runs lint, TypeScript, component/API tests, production compilation, and compiled-server smoke checks. `PLAYWRIGHT_FIREFOX=1 npm run test:browser` additionally runs Chrome and Firefox acceptance scenarios. Install the browser binaries first as described in README.

**Browser result:** six scenarios passed, three each in installed Chrome and Firefox. The full two-account workflow records an initial CAD 20 payment, changes the fee to CAD 25.50, renews at the new amount, and verifies CAD 45.50 received while preserving the original payment. It also exercises registration/cancellation, check-in, member restrictions, and dashboard totals. Separate checks cover seeded logins, mobile keyboard navigation, error recovery, and unknown routes.

Screenshots are actual browser captures:

- [Administrator overview](screenshots/club-workflows-dashboard.png)
- [Event participants](screenshots/club-workflows-event.png)
- [Member attendance on mobile](screenshots/club-workflows-mobile.png)
- [Fee settings on desktop](screenshots/club-settings-desktop.png)
- [Fee settings on mobile](screenshots/club-settings-mobile.png)

GitHub Actions runs the same checks plus Chromium/Firefox acceptance and retains browser reports/traces as artifacts. Local installed Chrome verification complements CI's Chromium engine run.

## October 30 acceptance checkpoint (historical)

At this October 30 checkpoint, live hosting, Atlas network/credential configuration, and real demo-inbox delivery had not been verified. Subsequent October 31 entries record the completed hosting checks; the final-review section below lists the remaining acceptance items. Local provider mocks prove application behavior, not delivery to a real inbox. Complete the live workflow using the README deployment instructions and submission guide after connecting hosting/email services. Do not represent these pending checks as passed.


## Production checks

The compiled-server smoke test covers the full manual-payment/fee/event workflow with production settings, scoped cleanup, and secure-cookie checks. The public `verify:live` command checks readiness without writes. `test:live` runs the two-account browser workflows against an explicitly provided HTTPS origin and creates fictional records; it never reuses local seeded credentials. At the initial validation milestone no public service URL was configured. The October 31 entries and README deployment instructions describe the supplied live URL and subsequent verification.


## October 31, 2026 — Render public demo

- 68 component/API tests passed (19 frontend and 49 backend), including Render URL/port settings, explicit demo opt-out, reserved-account password synchronization, and public credential discovery through the normal login flow.
- Eight scenarios passed across installed Chrome and Firefox, including public administrator/member login and responsive credential controls.
- The compiled Render-style process starts with a disposable `ClubOS-DB`, seeds before accepting requests, preserves Mongo-backed sessions across a real process restart, restores only reserved demo passwords, and preserves ordinary accounts and edited fees/history.
- The configured Atlas database was seeded/synchronized explicitly with the public demo password; no club records were reset. The service URL is `https://andreys-club-os.onrender.com`. Live deployment verification follows publication; the initial public health requests timed out.
- Real Resend inbox delivery is still separate from application/provider-mock verification.

![Public demo sign-in](screenshots/public-demo-login.png)


### October 31 — hosted verification and diagnostic follow-up

After Render's private session secret and Atlas network-access entries were configured, live health, public administrator/member login, secure cookies/logout, seeded membership/history, and the deployed frontend passed verification. The diagnostic follow-up adds seven failure-path tests (75 component/API tests total) and retains passing production/startup-restart smoke checks. Browser behavior is unchanged from the eight verified Chrome/Firefox scenarios. Actual hosted Chrome checks also passed administrator settings and mobile member history without runtime errors or horizontal overflow. Actual Resend inbox delivery remains separate.

## Version 1 dashboard and navigation

The v1 browser suite passes ten scenarios across installed Chrome and Firefox. The new scenario verifies six/twelve-month chart controls, attendance/payment selection, monthly data tables, actual event capacity, author/year/profile footer credits, zero-data club views, and complete long club names on desktop and mobile. It also checks keyboard Escape/focus restoration and horizontal overflow.

The analytics integration tests cover Eastern-time month boundaries, prior-window membership baselines, zero-filled months, chronological event limits, and organization isolation. Current membership status is a snapshot; the member-growth line shows cumulative joined records, not historical active status.

- [Desktop dashboard](screenshots/v1-dashboard-desktop.png)
- [Mobile dashboard](screenshots/v1-dashboard-mobile.png)
- [Mobile sidebar with a long club name](screenshots/v1-sidebar-mobile.png)


**V1 release checks:** 79 component/API tests (21 frontend and 58 backend) pass, together with compilation and both production/startup-restart smoke checks. All ten browser scenarios pass in Chrome and Firefox. Every implementation checkpoint was verified from a separate prospective-commit snapshot, with the existing staged LICENSE and documentation edits kept separate.


## Version 1.1 membership cards

The existing Chrome/Firefox public-demo workflow now downloads actual PNGs and verifies their file signature and 2160×1360 dimensions. A disposable-data administrator renewal happens while the member's page is stale; saving fetches the new expiration and refreshes the page. An expired-response fixture verifies the warning, expired filename, and complete long member/club names. The navigation workflow checks that unpaid cards remain disabled. Mobile checks cover overflow and reachable save controls. Visual inspection confirms readable dates and full names in the exported images. Compiled-server smoke checks now cover pending-card rejection, renewed card dates, cache policy, and club/member restrictions.

- [Saved PNG card](screenshots/membership-card.png)
- [Member page on desktop](screenshots/membership-card-desktop.png)
- [Member page on mobile](screenshots/membership-card-mobile.png)

Cards contain static membership information and expiration, with no scan flow. Final release checks and live verification are recorded separately after they run.


**V1.1 release checks:** 88 component/API tests (26 frontend, 62 backend), lint, type checks, production builds, and both compiled production and Render startup/restart smoke checks pass. All ten browser scenarios pass in installed Chrome and Firefox. Workspace/lockfile versions align at 1.1.0. Live rollout verification follows publication.


## Version 1.2 historical sample data

98 component/API tests (26 frontend, 72 backend), lint, types, builds, both compiled smoke checks and ten Chrome/Firefox scenarios pass. Coverage includes first-name login, 2010 history, renewal continuity, membership states, registration/attendance chronology, collision checks, conditional migration, existing membership reuse, date anchoring and missing-record recovery. Browser workflows inspect real fixture history and populated analytics. Local tests use disposable databases. Atlas connectivity is verified; hosted initialization follows publication of compatible code.


## Version 1.3 dashboard actions

100 component/API tests (28 frontend, 72 backend), lint, types, builds, both compiled smoke checks and ten Chrome/Firefox scenarios pass. Checks cover all four card actions, active-filter requests and reload/Back behavior, invalid URL filters, payments graph selection/focus/scroll, keyboard operation, reduced motion, mobile layout and exactly eight advertised sample identities. Atlas has the expanded 48-person/six-club dataset; a private backup confirms 212 memberships, 465 events, 1,150 payments and 2010 history. Live UI verification follows publication.


## October 31, 2026 — Final review

The initial default `npm run check` passed 99 of 100 tests but failed the notification configuration test because `loadConfig()` read `DEMO_MODE=true` from the developer's private `.env` while the test selected `clubos_test`. An environment-isolated rerun passed all 100 tests, lint, types, builds and both compiled smoke checks. The correction replaces that test's environment loading with explicit `parseConfig()` fixtures; it does not change runtime configuration. Both five-test targeted runs passed with sample mode enabled and disabled. The default full command then passed all 100 tests, lint, types, builds and both compiled smoke checks without environment overrides.

All ten Chrome/Firefox browser scenarios passed on the reviewed v1.3.0 implementation with tracked screenshot regeneration disabled. They cover the complete disposable administrator/member workflow, cards, fees, events, navigation, URL filters, graph actions and eight advertised identities. Screenshot artifacts from older milestones remain historical captures.

The read-only live probe passed for `https://andreys-club-os.onrender.com`: database readiness, production assets, direct SPA routes, security headers and API 404 behavior. Earlier October 31 authenticated live checks verified the four dashboard actions, active-filter reload, payments selection/scroll, mobile overflow, the eight sample choices, six accessible clubs and Maya’s 17 payments beginning in 2010. These are read-only UI results, not a claim that the full create/pay/register/check-in walkthrough has been performed against production. Live notifications report `disabled`; actual inbox delivery remains unverified.

A read-only check of the configured local `ClubOS-DB` confirmed 48 users, six clubs, 212 memberships, 465 events and 1,150 payments. The local URI is `mongodb://127.0.0.1:27017/ClubOS-DB`; local and hosted databases are independent unless explicitly configured to share a URI. Tests use disposable data and do not reset either application database.

**Dependency audit:** `npm audit` reported 12 moderate development-tooling findings in the ESLint/TypeScript-ESLint/minimatch dependency chain. `npm audit --omit=dev` reported zero production findings; there were no high or critical findings. Dependency versions were not changed in this cleanup, and the development findings remain outstanding.
