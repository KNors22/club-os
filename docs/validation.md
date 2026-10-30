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

## Acceptance still requiring connected accounts

Live hosting, Atlas network/credential configuration, and real demo-inbox delivery have not been verified. Local provider mocks prove application behavior, not delivery to a real inbox. Complete the live workflow in the deployment and submission guides after connecting hosting/email services. Do not represent these pending checks as passed.


## Production checks

The compiled-server smoke test covers the full manual-payment/fee/event workflow with production settings, scoped cleanup, and secure-cookie checks. The public `verify:live` command checks readiness without writes. `test:live` runs the two-account browser workflows against an explicitly provided HTTPS origin and creates fictional records; it never reuses local seeded credentials. Neither live command has been run against a public service yet because no service connection/URL is configured.
