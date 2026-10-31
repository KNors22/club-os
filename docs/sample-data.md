# ClubOS sample data

Version 1.2 supplies naturally named fictional people, clubs, payments, renewals, registrations, and attendance. Addresses use the first name followed by `@clubos`; these are sample sign-in identities, not deliverable mailboxes. The seed never sends emails.

## Dataset

A fresh seed anchored on October 31, 2026 contains **48 people, six clubs, 212 memberships, 465 events, and 1,150 payments**. Memberships include active, unpaid, and expired states. Histories start in **2010**, with continuous annual renewal periods, quarterly gatherings, recent monthly activities, and future events. Registration records belong to the right club and membership; past check-ins fall after event start, while future events have no attendance. Existing records and visitor edits can make saved totals differ.

| Club | Administrator | Annual CAD fee | Established |
| --- | --- | ---: | ---: |
| Riverside Running Club | `alex@clubos` | $20.00 | 2010 |
| Atelier Arts Society | `morgan@clubos` | $15.00 | 2012 |
| Summit Outdoor Society | `maya@clubos` | $30.00 | 2011 |
| Lakeside Cycling Club | `noah@clubos` | $25.00 | 2013 |
| Campus Book Collective | `olivia@clubos` | $12.00 | 2010 |
| Community Makers Guild | `ethan@clubos` | $35.00 | 2014 |

## Sign in

The public login page offers **Try administrator**, **Try member**, and **Explore another account**. The selector offers only **alex, jordan, taylor, morgan, maya, noah, olivia, and ethan**. Use `alex@clubos` to manage Riverside Running Club, `jordan@clubos` for its active member, `taylor@clubos` for unpaid membership, for the unpaid scenario. Open Maya Desai from the administrator's member list to see renewals dating to 2010. Maya, Noah, Olivia, Ethan, and Morgan administer the other clubs.

The existing configured public password remains **`ClubOSDemo2026!`** unless overridden by `DEMO_PASSWORD`. Environment names retain compatibility with the existing Render service. Shared fictional accounts and visitor edits are public; ordinary accounts retain their own credentials.

The full seeded member catalog is listed below; it is separate from the eight login-page choices.

| Account | Name | Role |
| --- | --- | --- |
| `alex@clubos` | Alex Rivera | Running club administrator |
| `jordan@clubos` | Jordan Lee | Active member |
| `taylor@clubos` | Taylor Brooks | Awaiting payment |
| `casey@clubos` | Casey Nguyen | Expired membership |
| `morgan@clubos` | Morgan Ellis | Arts club administrator |
| `maya@clubos` | Maya Desai | Outdoor club administrator |
| `noah@clubos` | Noah Bennett | Cycling club administrator |
| `olivia@clubos` | Olivia Chen | Book club administrator |
| `ethan@clubos` | Ethan Clark | Makers club administrator |
| `ava@clubos` | Ava Thompson | Member with club history |
| `liam@clubos` | Liam Martin | Member with club history |
| `sofia@clubos` | Sofia Ramirez | Member with club history |
| `lucas@clubos` | Lucas Wilson | Member with club history |
| `amelia@clubos` | Amelia Scott | Member with club history |
| `elijah@clubos` | Elijah Brown | Member with club history |
| `isla@clubos` | Isla Campbell | Member with club history |
| `james@clubos` | James Park | Member with club history |
| `charlotte@clubos` | Charlotte Lewis | Member with club history |
| `benjamin@clubos` | Benjamin Young | Member with club history |
| `harper@clubos` | Harper Adams | Member with club history |
| `henry@clubos` | Henry Foster | Member with club history |
| `evelyn@clubos` | Evelyn Moore | Member with club history |
| `jack@clubos` | Jack Hughes | Member with club history |
| `aria@clubos` | Aria Singh | Member with club history |
| `leo@clubos` | Leo Mitchell | Member with club history |
| `abigail@clubos` | Abigail Wright | Member with club history |
| `daniel@clubos` | Daniel Kim | Member with club history |
| `ella@clubos` | Ella Patel | Member with club history |
| `samuel@clubos` | Samuel Reed | Member with club history |
| `chloe@clubos` | Chloe Tran | Member with club history |
| `owen@clubos` | Owen Price | Member with club history |
| `grace@clubos` | Grace Murphy | Member with club history |
| `mateo@clubos` | Mateo Silva | Member with club history |
| `lily@clubos` | Lily Evans | Member with club history |
| `sebastian@clubos` | Sebastian Roy | Member with club history |
| `zoe@clubos` | Zoe Anderson | Member with club history |
| `aiden@clubos` | Aiden Cooper | Member with club history |
| `nora@clubos` | Nora Stewart | Member with club history |
| `gabriel@clubos` | Gabriel Moreau | Member with club history |
| `scarlett@clubos` | Scarlett Ross | Member with club history |
| `isaac@clubos` | Isaac Bell | Member with club history |
| `victoria@clubos` | Victoria James | Member with club history |
| `julian@clubos` | Julian Ortiz | Member with club history |
| `hannah@clubos` | Hannah Wong | Member with club history |
| `caleb@clubos` | Caleb Allen | Member with club history |
| `layla@clubos` | Layla Lewis | Member with club history |
| `nathan@clubos` | Nathan Green | Member with club history |
| `audrey@clubos` | Audrey Hall | Member with club history |

## Seed the local project or hosted database

1. Run `npm ci` and `npm run setup`.
2. Set the ignored root `.env` variable `MONGODB_URI` to a reachable database selecting exactly `ClubOS-DB`. The existing local project uses Atlas; when local and hosted configurations select that same database, both see the same records.
3. Run **`npm run seed`**, then `npm run dev`. The earlier `npm run seed:demo` command remains an alias.
4. On Render, the existing public mode automatically runs the same seed before serving requests. `DEMO_MODE=true` enables it locally; `DEMO_MODE=false` disables automatic initialization.

After compilation, `node server/dist/seed.js` runs the same command. `DEMO_DATABASE_URI` optionally overrides only the explicit seed target; leave it unset/empty to use `MONGODB_URI`. Set `DEMO_MODE=true` for an explicit command that also synchronizes reserved account passwords to the configured public value.

## Repeat runs and upgrade from earlier releases

The first run saves a reference date in `seedstates`. Relative membership/event dates reuse that date, even across years. Fixed IDs and insert-only writes add missing records without replacing fees, club names edited by visitors, validity, payment histories, registrations, check-ins, timestamps, or ordinary account credentials. Missing records can be recovered by rerunning the seed. New future events can always be created through the application as seeded dates pass.

The five original starter IDs are retained. Their known old addresses become `alex@clubos`, `jordan@clubos`, `taylor@clubos`, `casey@clubos`, and `morgan@clubos`. Only exact original default names, club/event labels, and payment references are renamed; edited names and existing histories survive. Existing joined relationships are reused. Reserved identity, join-code, and ownership collisions stop initialization before unrelated records or credentials can be changed.

There is no reset or delete-data command. Keep database credentials and backups outside source control. Production email operations still send only to the privately configured recipient.
