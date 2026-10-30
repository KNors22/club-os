# Fictional demonstration data

Seeding is an explicit command. Application startup never inserts or resets data, and the seed never sends emails. It uses a separate MongoDB database named `clubos_demo`.

1. Install dependencies and run `npm run setup`.
2. Set root `.env` `MONGODB_URI` to a reachable MongoDB URI ending in `/clubos_demo` (before any query string). Atlas URIs can also select this database.
3. Optionally set `DEMO_PASSWORD` to your own demo password (10–72 characters, at most 72 UTF-8 bytes), then run:

   ```bash
   npm run seed:demo
   npm run dev
   ```

If `DEMO_PASSWORD` is omitted, the command generates and prints a random password for newly created accounts. Save it privately. `DEMO_DATABASE_URI` can override the seed target; the application must still use the same database through `MONGODB_URI`. After building, the equivalent command is `node server/dist/seed.js`.

| Account | Role |
| --- | --- |
| `admin@clubos.example` | Demo Running Club administrator |
| `member@clubos.example` | Active member with payment history |
| `pending@clubos.example` | Member awaiting an initial payment |
| `expired@clubos.example` | Member with an expired membership/history |
| `other-admin@clubos.example` | Separate Demo Art Club administrator |

These are fictional addresses. Demo email still routes only to the server-configured `EMAIL_DEMO_TO`. No shared password is stored in source control.

The initial Running Club has a CAD 20 yearly plan, three membership states, two recorded payments, one upcoming registration, and one past attendance record. Dates are relative to the first seed run. The separate Art Club demonstrates organization isolation.

Rerunning inserts only missing reserved records. It preserves changed names, fees, password hashes, payment history, event dates, registrations, attendance, and timestamps. It does not rotate or restore existing passwords, advance dates, or repair changes made during a demonstration. Create a new upcoming event when the sample date has passed. Reserved-address collisions with unrelated accounts fail without changing credentials. There is no reset command.
