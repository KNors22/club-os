# Public fictional demonstration data

The public Render demo uses the application's `ClubOS-DB` MongoDB database. When public demo mode is enabled, startup seeds missing fictional records before accepting requests. Local development remains opt-in: use the explicit seed command, or set `DEMO_MODE=true` to exercise the hosted behavior.

## Public sign-in

**Static demo password: `ClubOSDemo2026!`**

| Account | Role |
| --- | --- |
| `admin@clubos.example` | Demo Running Club administrator |
| `member@clubos.example` | Active member with payment history |
| `pending@clubos.example` | Member awaiting an initial payment |
| `expired@clubos.example` | Member with an expired membership/history |
| `other-admin@clubos.example` | Separate Demo Art Club administrator |

Use the public login page's **Try administrator** or **Try member** buttons, then sign in. These credentials are intentionally published; visitors share fictional accounts and edits. Ordinary registered accounts keep their own passwords. `DEMO_PASSWORD` can override the public demo password; public mode advertises the configured value on the login page.

## Explicit local or Atlas seeding

1. Install dependencies and run `npm run setup`.
2. Configure a reachable `MONGODB_URI` ending in `/ClubOS-DB` before the query string. Do not place private connection credentials in source control.
3. Run `npm run seed:demo`, then `npm run dev`. Newly created accounts use the static demo password unless `DEMO_PASSWORD` overrides it.
4. To synchronize existing reserved demo accounts to the configured password, run `DEMO_MODE=true npm run seed:demo`.

After building, the equivalent command is `node server/dist/seed.js`. `DEMO_DATABASE_URI` optionally overrides the explicit seed target; the application must still point to that same database. Render startup always uses `MONGODB_URI`, preventing a mismatch between hosted data and seed data.

The initial Running Club has a CAD 20 yearly plan, three membership states, two recorded payments, one upcoming registration, and one past attendance record. The separate Art Club demonstrates organization isolation. Event and membership dates are relative to the first seed run and are preserved on later runs; create a new upcoming event after the sample date has passed.

Seeding inserts missing reserved records without resetting edited names, fees, validity, histories, registrations, attendance, or timestamps. Explicit seeding normally preserves existing passwords; public demo mode synchronizes only matching reserved demo IDs/emails. Reserved-address collisions with unrelated accounts fail before changing credentials. There is no reset command, and the seed never sends emails. Business-operation emails still route only to the server-configured demo inbox.

See the [Render guide](deployment.md) for environment settings and verification commands.
