# How AI was used

The product was built by one person (the owner) working with Claude Code and a set of project agents. The owner set the goals, read every result, ran or checked the live app, and merged every pull request. AI wrote most of the code, tests and docs.

## Across the lifecycle

| Stage | What AI did | Example from this project |
|---|---|---|
| Define | Turned the lead's review into requirements | The lead's walkthrough video was in Hindi. It was transcribed locally with Whisper, key frames were pulled with ffmpeg, and the agent wrote the requirements and the contract from the transcript and screenshots. |
| Design | Planned data, API and screens before code | The `architect` agent split V3 into tickets. The contract [PROGRAMS-V3.md](https://github.com/shr1-live/fde-tracker-apiv2/blob/main/docs/PROGRAMS-V3.md) was written first so the API and web agents built against the same shapes. [DESIGN.md](https://github.com/shr1-live/fde-tracker-appv2/blob/main/DESIGN.md) was written before the restyle (tokens, components, accessibility rules). |
| Build | Wrote the code in small, reviewable steps | `backend-dev` built migrations 010 and 011, services and endpoints. `frontend-dev` built the pages; `ui-ux-designer` critiqued screenshots. |
| Test | Wrote and ran tests; drove the browser | `qa-engineer` wrote xUnit tests (275 pass) and ran Playwright + axe checks against a mocked API and the real API. |
| Review | Read-only review agents before every push | `code-reviewer` and `security-reviewer` read the diff. One review found that a coordinator invite could re-approve a rejected user. |
| Split | Planned and carried out the move to two repositories | Agents planned the split. Scripts did the history-preserving move (subtree split and renames). The build and tests were run in both repositories to check it. |
| Document | Wrote README, contract, design system and these docs | `docs-writer` keeps docs in plain English with limits stated. |

## Context engineering

The agents only know what they are given. These files give them the same context every session.

| File | In git | Why it exists |
|---|---|---|
| `CLAUDE.md` | No (local) | The project rules read at the start of every session: git flow, free tiers, no secrets, security rules, "verify before saying deployed". A shareable copy is [AGENTS.md](../AGENTS.md). |
| `TASKS.md` | No (local) | The live plan: open and done tasks, each with what "done" means and one line of proof. Read before work, updated after. Stops the agent from forgetting or redoing work between sessions. |
| [DESIGN.md](https://github.com/shr1-live/fde-tracker-appv2/blob/main/DESIGN.md) | Yes (frontend repository) | The design system. Agents change tokens, not pages, and check contrast against it. |
| [PROGRAMS-V3.md](https://github.com/shr1-live/fde-tracker-apiv2/blob/main/docs/PROGRAMS-V3.md) | Yes (backend repository) | The API contract. Both the API and web agents build against it, so they agree without seeing each other's code. |
| `.claude/agents/*.md` | Yes | Ten agent definitions with a narrow job and the tools they may use. |
| `.claude/commands/*.md` | Yes | Slash commands: `/verify` (build and tests, no claims without output) and `/release-check` (merged? live? API up?). The web repository adds `/notify-review`. |
| Memory notes | No (local) | Short notes the owner asked to keep: commit account, sheet format, "few big pushes", "finish to working". |

## Agents

| Agent | Job | What it did here |
|---|---|---|
| `architect` | Plans before code; read-only | V3 tickets, file list, risks |
| `backend-dev` | API, migrations, tests | Programs, status, reports, Excel, feed at scale (keyset paging, trigger counters) |
| `frontend-dev` | Web pages and components | Every V3 page, lazy routes, feed features |
| `ui-ux-designer` | Design and critique from screenshots | DESIGN.md, restyle, empty/error/loading states |
| `qa-engineer` | xUnit, Playwright + axe, live checks | 275 API tests; 166 mocked browser checks; 106 real-API checks |
| `code-reviewer` | Read-only diff review | Rejected-user finding; small fixes before push |
| `security-reviewer` | Read-only security review | Auth, IDOR, injection, secrets, CSP checks |
| `devops` | Vercel and Render setup, live checks | `vercel.json` (frontend repository) and `render.yaml` (backend repository); health and header checks |
| `docs-writer` | Docs | README, these docs |
| `task-manager` | TASKS.md, branches, PR links | Task list and compare links for the owner |

## Skills

- **design-elevation**: used for the redesign round (tokens, hierarchy, states).
- **code-review**: structured review of a diff before the push.
- **security-review**: auth, permissions, injection and secrets checklist.

## Guardrails

- No secrets in code, chat or logs. Agents get setting names only; the owner pastes values in Render or Vercel.
- AI cannot push to `develop` or `main` (blocked in the tool permissions). It works on a branch and gives the owner a compare link.
- The owner merges every pull request.
- Review agents run before every push.
- Invite-only access and per-program checks live on the server, so a mistake in the web app cannot open data.
- Free tiers only; few, big pushes to save build quota.
- Being added on this branch (not yet run on GitHub): a Claude Code hook that blocks secrets in agent edits (`.claude/hooks/block-secrets.mjs`), and CI with tests, a vulnerable-package check and a gitleaks secret scan.

## Human validation

- The owner reads each plan and each pull request before merging.
- The owner checks the live site after a deploy, and asks for real-API runs, not only mocks.
- Claims like "deployed" are only accepted after the Vercel or Render status of that commit is checked.

## Learning from AI failures

| # | What happened | How it was caught | What changed |
|---|---|---|---|
| 1 | A coordinator's invite could re-approve a person the admin had rejected. | `code-reviewer` agent, reading the invite flow. | Invites now only approve `pending` accounts. A test checks a rejected person stays locked out (commit `c62bbcf`). Reviews now always ask "can a lower role undo a higher role's decision?". |
| 2 | Text typed into the daily status form was wiped when the saved history arrived late on a slow first load. | `qa-engineer` real-API run (105 of 106 passed; this was the one failure). | Fields stay disabled until history loads (commit `58fffc8`). QA now runs against the real API, not only mocks, before a push. |
| 3 | A mocked browser test built dates in UTC, so in India (UTC+5:30) "today" shifted by a day and the test failed for the wrong reason. | The test failed locally; the agent traced it to the date helper. | Test dates are built in local time. Date handling is now checked in the local time zone. |
| 4 | A Windows path inside a `node -e` one-liner had its backslashes read as escape characters, so the script read the wrong path. | The command failed. | Use forward slashes or a script file instead of inline paths on Windows. |
| 5 | Importing a branch into this repo failed because leftover build folders (`bin`, `obj`, `dist`, `node_modules`) were in the way. | The import command stopped with an error. | Clean the build folders before history imports. |
| 6 | Merging V3 into the training repos removed features the owner still used every day from the live training site. | The owner noticed on the live site. | The training repos were restored from their backup branch, and V3 moved to this separate repo with its history. Rule added: "never mix the two products". |
| 7 | Test data with underscores in names broke the search test that checks `_` is not a wildcard, because the seed data matched too. | The test failed. | Test data for search tests avoids the characters under test. |
| 8 | The lead's walkthrough video was in Hindi, so the agent could not use it directly. | Found at the start. | Transcribed locally with Whisper; frames pulled with ffmpeg; requirements built from both. Nothing was sent to an outside service. |
| 9 | A git login test with prompts turned off ("no prompt") reported that pushing was impossible, because the test also disabled the credential helper. | The real push worked. | Test the real operation, not a proxy for it. |

Items 3, 4, 5, 7, 8 and 9 come from the working sessions and are not all visible in the git history. Items 1, 2 and 6 are visible in commits `c62bbcf`, `58fffc8` and `22558b6` (in the earlier web repo).

| 10 | The live site said "We could not check your access" after a move to a new API address. | Reproduced on a laptop: the same message appeared locally. The API only allowed `localhost`, the page ran on `127.0.0.1`, so the browser blocked every answer. The live service had the same gap: no `CORS_ORIGINS` setting. | `CORS_ORIGINS` is now a documented required setting; the deploy steps list it. |
| 11 | After adding plan weeks 1 and 2, five old tests failed. They had assumed a five-day plan. | The full run showed 8 failures; each cause was read before any test was changed. | Tests now expect ten days, and a new test checks both weeks. No test was weakened. |
| 12 | The test project would not build: the API used a newer Npgsql than the test packages. | `dotnet test` stopped with a version error. | The test project pins the same Npgsql version. |
| 13 | A link check reported most links as broken. | The URL list written on Windows had carriage returns in it. | The check strips them; all 58 links answered 200. |

The week 2 study notes were written by a sub-agent. The owner's side checked them again: topic lines match the training sheet word for word, every link answers 200, and the build passes.

| 14 | A NUL character inside a status value made the save fail with a 500. The bug was older than this work. | A reviewer agent that had not seen my reasoning attacked the running API with odd input. | Such text is refused with a 400 before it reaches the database; test V19 covers it. |
| 15 | A script of mine overwrote the test file with an empty file when it failed half way. | `git diff` showed 751 lines deleted. | The file was restored from git, and edits now go to a temporary file first and replace the original only after a successful write. |
