# Disclosure of earlier work

This product did not start from zero during the hackathon.

| Period | Work | Where |
|---|---|---|
| From 2026-11-13 | The owner's FDE learning tracker: a personal training tracker (plan, content feed, assistants, practice lab, reports) | Repositories `FDE-Learniing-Tracker` (web) and `fde-tracker-api` (API) |
| From 2026-11-19 | Programs V3, after a lead engineer's video review: invite-only programs, coordinators and members, plan, daily and program status, reports with Excel, social feed | Built on branch `feature/programs-v3` in both earlier repositories |
| 2026-11-19 | V3 moved into one monorepo (`fde-tracker`) | `web/` and `api/` were imported with their full git history, so every earlier commit is visible here |
| 2026-11-19 onwards | Feed at scale, design system and restyle, mobile and feed work | The monorepo, then the two repositories below |
| 2026-11-20 | The monorepo was renamed to `fde-tracker-appv2` (frontend) and its backend moved with history to `fde-tracker-apiv2` | A subtree split and renames kept the history of both parts; the older daily-training history stays in both. Before the split, a backup branch of the combined repository was made on the frontend repository: `main_backup_before_split` (same commit as `main`, `5d56f39`). The owner also made `main_backup_11102026` at the same commit. The pre-split state can always be restored from either |

What was reused from the earlier tracker:
- the API structure (MVC layers, middleware, rate limits, security headers, migration runner, test fixture);
- migrations 001-009 (users, older features, RLS lock-down);
- the web app's sign-in, API client and build setup.

What is new in V3: migrations 010 and 011, programs, roles, invites, plan, forms, status, reports, Excel exports, the feed as it is now, and the design system.

Reused later, and disclosed here: the Week 1 study notes (one note and set of reading links for each topic) come from the earlier tracker's `studyNotes.ts`, copied into this web app. The Week 2 notes were written new for this product (by an AI agent, then checked). The demo data uses the training sheets' wording for the plan and the week 1 sample answers.

The DevOps program plan comes from the owner's own personal DevOps study plan (a shared document: four weeks of KodeKloud courses, topics and milestone labs), split into 30 study days for this product. The notes and links for its topics were written new for this product by AI agents; every topic line was matched to the plan and all 205 links were opened and answered HTTP 200 on 2026-11-23.

The older features (assistants, practice lab, study notes, old reports) are still in the API code but are not part of the V3 web app. They are not part of this submission.

The product was built by the owner working with AI agents (Claude Code); see [AI-DEVELOPMENT.md](AI-DEVELOPMENT.md).
