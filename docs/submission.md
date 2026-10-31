# ClubOS capstone submission

## Deliverables and current status

| Required item | Location and evidence |
| --- | --- |
| Public GitHub repository | [KNors22/club-os](https://github.com/KNors22/club-os), verified public on October 30, 2026 |
| Project overview, features, installation, usage, technologies, future improvements | [README](../README.MD) |
| Architecture, relationships, permissions, and wireframes | [Architecture](architecture.md) |
| Weekly progress, challenges/solutions, learnings, screenshots, code snippets | [Devlog](devlog.md) |
| Local test and browser evidence | [Validation](validation.md) and [GitHub checks](https://github.com/KNors22/club-os/actions/workflows/ci.yml) |
| Demonstration records and public credentials | [Public demo accounts and seed behavior](demo-data.md) |
| Important release tags and notes | [Changelog](../CHANGELOG.MD) |
| Live application URL | [Andrey's ClubOS](https://andreys-club-os.onrender.com), health and seeded administrator/member login verified October 31, 2026 |
| Live two-account workflow and real email confirmations | **Pending:** deployment and private Resend/demo-recipient configuration |

The implementation and local evidence are prepared for review. Live application acceptance remains incomplete until the pending rows above have actual results. This document is a submission package; it has not been sent to an instructor or submission portal.

## Five-minute demonstration

Use two browser sessions with the public administrator/member accounts and password `ClubOSDemo2026!`, or register separate fictional accounts. Public demo startup seeds missing records and synchronizes only reserved demo passwords; it preserves existing records. If running locally, explicitly seed `ClubOS-DB` as described in the demo guide.

1. **Create and join:** the administrator creates a club with a CAD 20 fee and 365-day term, then copies its join code. The member joins and sees **Awaiting payment**.
2. **Activate:** the administrator opens **Members**, selects the member, and records a full received payment with method/reference. The member refreshes **My membership** to see active validity and payment history.
3. **Edit the fee and renew:** the administrator opens **Club settings**, changes the fee to CAD 25.50, then records a renewal. Show the old CAD 20 history row, the CAD 25.50 renewal row, and the extended expiration.
4. **Register:** the administrator creates an upcoming event with capacity 1. The active member registers, cancels, and registers again. A pending member cannot register; unrelated clubs remain inaccessible.
5. **Attend:** the administrator checks in the member from the event's participant list. Refresh the member's event screen to show checked-in status. Refresh the overview to show CAD 45.50 received, one registration, and one attendance record.
6. **Confirm:** with private Resend/demo-recipient configuration, verify a membership confirmation and event-registration confirmation in the demo inbox. Show the demo-mode notice. If delivery is disabled/fails, the saved workflow remains intact and the application displays its delivery notice; this demonstrates failure handling, not successful inbox delivery.
7. **Responsive/access:** open mobile navigation with the keyboard, use Tab/Shift+Tab, close with Escape, and show the visible focus indicator and mobile fee form. Ordinary members have no club-settings controls.

These payment records demonstrate manual bookkeeping of received funds; ClubOS does not collect online payments.

## Final live acceptance

After deploying the reviewed main-branch commit and configuring Resend privately:

- Verify the documented HTTPS URL, or update it if the Render service address changes.
- Wait for GitHub checks to pass; deploy the reviewed source with the provided [Render blueprint](../render.yaml).
- Follow [deployment setup](deployment.md), including Atlas access for Render outbound addresses and exact `APP_URL`.
- Run `npm run verify:live -- <https-origin>` for read-only readiness checks.
- Run `APP_LIVE_URL=<https-origin> PLAYWRIGHT_FIREFOX=1 npm run test:live` for the complete two-account browser flow. It creates fictional records on that app and does not reset existing data.
- Verify actual membership/event messages arrive at the configured demo inbox. Record the verification date/result without adding private addresses, API keys, session cookies, or secrets to source control.
- Reload a protected direct URL, sign out/in, and verify records/session behavior after redeployment. Note the free service's first-load delay in the demonstration.
- Update the release notes and publish the final stable validation milestone only after these live results pass.

## Agreed scope

The MVP includes authentication, club creation/joining, one CAD membership plan, administrator fee editing, received-payment recording, renewals/history, events, capacity-limited registration/cancellation, manual attendance, scoped dashboards, and demo-inbox email integration.

QR cards/scanning, multiple membership types, online payments, exports, announcements, scheduled reminders, password recovery, and administrator invitations remain deferred. These were agreed scope reductions from the broader project document and are not claimed as implemented.
