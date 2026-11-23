# Architecture

![Architecture: runtime and AI-assisted delivery](architecture.png)

The editable diagram is [architecture.excalidraw](architecture.excalidraw): open https://excalidraw.com, then Menu > Open, and pick this file.

## Repositories

The product lives in two GitHub repositories. Each has its own build, CI and deploy.

| Repository | Holds | Deploys to |
|---|---|---|
| [`fde-tracker-appv2`](https://github.com/shr1-live/fde-tracker-appv2) (frontend) | React app in `src/`, `DESIGN.md`, `vercel.json` | Vercel project `fde-tracker-green` |
| [`fde-tracker-apiv2`](https://github.com/shr1-live/fde-tracker-apiv2) (backend) | ASP.NET Core API, `migrations/`, xUnit tests, `render.yaml`, the API contract `docs/PROGRAMS-V3.md` | Render service `fde-tracker-apiv2` (https://fde-tracker-apiv2.onrender.com) |

The two talk only through the API contract. Change the contract in the backend repository first, then the frontend follows. The product-level docs (product, architecture, AI development, decisions, disclosure) are the same in both repositories; the backend copy is the source. Standards, QA, security and delivery are written per repository.

## Components

| Part | Technology | Where it runs |
|---|---|---|
| Web app (repository `fde-tracker-appv2`) | React 18, Vite, TypeScript | Vercel (free), built with Vite defaults and the root `vercel.json` of that repository |
| API (repository `fde-tracker-apiv2`) | ASP.NET Core on .NET 10, MVC style, Dapper | Render free web service, Docker, from the root `render.yaml` of that repository (`fde-tracker-apiv2`) |
| Database | Postgres | Supabase (free) |
| Sign-in | Supabase Auth (magic link, JWT) | Supabase |
| Excel | ClosedXML | Inside the API |

## Request flow

1. The browser signs in with Supabase Auth and gets a JWT.
2. The web app calls the API with `Authorization: Bearer <token>`.
3. The API checks the token (issuer and signing keys from `SUPABASE_URL`), loads the user from `app_users`, and checks the account is approved.
4. Route -> filters (approved, role) -> controller (HTTP only) -> service (rules, per-program role check, transaction) -> repository (parameterised SQL) -> view model -> JSON in snake_case.
5. Errors come back as `{ "error": "..." }` with no internal detail.

The web app never talks to the database directly. The Supabase key in the web app is the public one and only covers sign-in.

## Data model (V3 tables)

Created by migrations `010_programs_v3.sql` to `019_devops_plan.sql` (feed at scale, notifications, per-program feed, timesheets, demo flag, week submitted, FDE plan weeks 1 and 2, status notifications, the DevOps plan). `app_users` comes from `001_init.sql`. Migrations 002-009 belong to the older tracker features and are kept.

| Table | Holds |
|---|---|
| `app_users` | Every signed-in person: email, name, global role (`admin`, ...), access (`pending`, `approved`, `rejected`) |
| `lp_programs` | A program: name, description, start date |
| `lp_members` | Who is in a program and as what (`coordinator` or `member`) |
| `lp_invites` | Open invites by email; turned into memberships at sign-in |
| `lp_days` | The plan: week, day, topic, topics to cover, practical task |
| `lp_form_fields` | The two forms per program (`daily`, `day`): key, label, description, type, required, order |
| `lp_daily_status` | One row per person per program per date; values as JSON |
| `lp_day_status` | One row per person per plan day; values as JSON, completed flag |
| `feed_posts` | Posts: text and/or https link, stored `kind` (video, link, text), like and comment counters, `edited_at` |
| `feed_likes` | One row per like |
| `feed_comments` | Comments |

Form values are JSON, but the server checks every key and type against `lp_form_fields` before saving (see the contract in [PROGRAMS-V3.md in the backend repository](https://github.com/shr1-live/fde-tracker-apiv2/blob/main/docs/PROGRAMS-V3.md)).

## Authorization model

- **Invite-only.** The admin email is always admin. Anyone else is approved only when an invite exists for their email, or they were approved before V3. Unknown emails stay `pending`.
- **An invite never lifts a rejection.** If the admin rejected someone, a coordinator's invite adds them to the program but they stay locked out.
- **Per-program roles are checked in services**, not only in the web app. A member asking for another person's status gets 403. A program they are not in gives 404 or 403.
- The admin can delete any post but can only edit their own.

## Key trade-offs

| Choice | Why | Cost |
|---|---|---|
| Two repositories, one for the web app and one for the API (see Repositories) | Separate deploys, separate CI, smaller blast radius, clear ownership | The contract is kept in sync by hand; shared docs are copied; a cross-cutting change needs two pull requests |
| Keyset (cursor) paging on the feed | Stable pages while new posts arrive; fast at any depth | Cursors are tied to one sort; changed cursors give 400 |
| Like and comment counters kept by triggers | Sorting by "most liked" uses an index, not a count per request; counts stay right inside the same transaction | Logic lives in SQL as well as C# |
| Excel built on the server with ClosedXML | Same file for everyone; matches the training sheet layout exactly; no big library in the browser | Larger API image; export is limited to 120 days |
| RLS on for every table, public roles revoked | The public Supabase key cannot read or write any table, even by mistake | All data goes through the API |
| Form values as JSON with server checks | Coordinators can change forms without migrations | Reporting on a single field needs JSON queries |
| Render free tier | No cost | Cold starts (first request after idle can take about a minute) |

## Limitations

- Render free tier sleeps when idle; the first call is slow.
- Notifications are in the app only (the bell). Email reminders are built but stay off until a Resend key is set on the host.
- Feed posts take links only, no uploads.
- Daily reports cover at most 120 days per request.
- The main web bundle is about 133 kB gzipped; pages are lazy-loaded but the Supabase client is in the main bundle.
- One admin account; there is no admin hand-over screen.

## Notifications

In-app, one bell per person (`/api/notifications`). A person who fills something in tells the people above them, never the people beside or below:

| What happens | Who is told |
|---|---|
| A daily status is saved, a program day is completed, a week of the timesheet is submitted | The program's coordinators and the admin (a coordinator's entries reach the other coordinators and the admin) |
| A working day passes with no status or hours | The person, at 10:00 company time |

Repeat saves refresh one notification instead of adding more. Anyone above can also read the entries, and a member asking for someone else's gets 403. The test `V18_what_people_fill_in_is_seen_and_announced_up_the_chain...` checks this end to end against a real Postgres.

## Study notes

Each topic of the plan can open a short note (what it is, an example, and "Read or watch" links). The notes are data in the web app and attach to a plan topic when the words match the plan line, so the plan stays the source of truth. There is one set per program track: FDE (`studyNotes.ts`, `studyNotes2.ts`) and DevOps (`src/data/devops/notesW1.ts` to `notesW4.ts`). A program whose name contains "devops" gets the DevOps notes, any other program gets the FDE notes.

The DevOps plan itself is migration `019_devops_plan.sql`: 30 study days (Linux and Bash, Docker, CI/CD with cloud and Terraform, Kubernetes and Helm). A week holds at most 7 days, so the capstone (study days 29 and 30) is week 5. The migration only fills the real program named "Devops"; demo programs and the FDE program are left alone, and the demo DevOps program copies the real plan.
