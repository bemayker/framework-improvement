# Mayker Sandbox: development guide

Minimal task-notes app used exclusively as a validation sandbox for the mayker-dev framework. Features are deliberately trivial; the point is exercising the framework lifecycle, not the product.

This guide is for the people who work on this project: how to run, test and deploy it, where the code lives, its conventions, and how to contribute. It belongs to the project, so edit it freely. How the AI delivery framework that builds this project works (its commands, hooks, review gates, CI pipelines and troubleshooting) is in the **[mayker-dev framework manual](https://github.com/bemayker/mayker-dev-plugin/blob/main/docs/framework-manual.md)**; the installed plugin carries the copy that matches your version at `~/.mayker/mayker-dev/docs/framework-manual.md`.

## Setting up

1. Install the prerequisites under [Development environment](#development-environment).
2. Install the `mayker-dev` plugin at project scope (README → Install).
3. Connect the issue tracker and the Git provider, and read the permission posture: framework manual → Prerequisites (MCP connections, Permissions & Autonomy).

## Development environment

Required to run the project locally (per `CLAUDE.md` Tech Stack):

- **Docker** and **Docker Compose** (runs `db`, `backend`, `frontend` via `docker-compose.yml`).
- **Node.js 20** (frontend: React, TypeScript, Vite; matches the `node:20-slim` image in `frontend/Dockerfile`).
- **Python 3.12** (backend: FastAPI, matches the `python:3.12-slim` image in `backend/Dockerfile`).
- **uv** (manages the backend's Python environment and dependencies; see `backend/pyproject.toml`).

See the [README → Running the project](../README.md#running-the-project) for the `docker compose up` quick start, and [Running tests locally](#running-tests-locally) below to run the test suites directly on the host.

## Running the project

How to start the application is in the README → Running the project. Ports, environment files (`.env.example`) and backing services the application needs are listed there or under Development environment.

`BUILD_COMMIT` (optional, see `.env.example`) sets the commit `GET /api/version` reports: pass the full sha and the API returns its first 12 characters; unset or blank reports `unknown`.

## Testing

The test gate runs the command in `CLAUDE.md` → `Test gate command:` before every push, and CI runs the suites on every pull request. Test directories, naming and the tier toggles are in `CLAUDE.md` → Test Configuration and Feature Toggles.

### Running tests locally

```bash
# Frontend (Vitest)
cd frontend && npm test

# Backend, unit tier only — needs no database
cd backend && uv run pytest tests/unit

# Backend, full suite — the integration tier needs real PostgreSQL
docker compose up -d db
cd backend && DATABASE_URL=postgresql://tasknotes:tasknotes@localhost:5442/tasknotes uv run pytest

# E2E (Playwright) — requires the app running (docker compose up, or the dev servers directly)
npx playwright test
```

**The integration tier needs a real database.** Since TEST-03 the backend talks to PostgreSQL through `psycopg` (`backend/pyproject.toml`), and `backend/tests/conftest.py` reads `DATABASE_URL` to reach it. Two things follow:

- Put `DATABASE_URL` on the **pytest command itself**, not before a `cd`: in `VAR=x cd dir && pytest` the assignment applies to `cd` and never reaches pytest.
- With `DATABASE_URL` unset, the integration tests **skip** locally so a quick `pytest tests/unit` stays frictionless — but when `CI` is set they **fail** instead, so a pipeline that forgets the variable goes red rather than green-by-skip.

## Test environments

Every pull request `/build-feature`, `/fix` and `/deliver` opens carries a `## Test` section, printed by the plugin's `hooks/lib/pr-test-section.sh` and pasted verbatim: how to test the change locally (the suites, the key names in `.env.example`, the test data, the manual steps), how to test it on each environment in the table below, and a deploy checklist whenever the branch adds or removes an environment key, adds a migration, or changes deploy configuration. Fill in one row per deployed test environment: its name, its URL, how a branch reaches it, the roles a tester signs in with, the ids of the test records the steps use, and its secrets **as vault references only** (a vault path or a secret's name, never a value: this file is committed and its rows are copied into pull requests). With no row, each pull request says `Deployed: not configured`. No command fills this table; `/sync-project` reports it while it is empty.

| Environment | URL | How it deploys | Test roles | Test records | Secrets (vault references only) |
| --- | --- | --- | --- | --- | --- |

## CI/CD

Every pull request runs the project's CI pipelines; merging one moves its work item to Done. What each pipeline does is in the framework manual → CI/CD.

### Repository secrets

| Secret | Purpose | Where to get it | Where to add it |
| --- | --- | --- | --- |
| `CLICKUP_API_KEY` | Auto-transition features to Done on merge | ClickUp → Settings → Apps → API Token | GitHub → Settings → Secrets and variables → Actions |
| `MAYKER_FLIP_TOKEN` | Let the auto-Done job push the work-item file flip to a protected default branch (`local` and `hybrid` source only) | A repository admin's fine-grained PAT with `contents: write` | GitHub → Settings → Secrets and variables → Actions |

The optional Slack notification and security scanning secrets, and where each tracker's key is created: framework manual → Repository Secrets.

## Layout

> Filled in by `/build-feature` when top-level directories are created or removed.

Framework files: `CLAUDE.md` is the project's configuration for the framework; `.claude/` holds the framework's generated state and the engineering standards it copies in (`.claude/rules/`, never edited by hand); `docs/issues/` holds local work items when the project uses them.

## Conventions

The engineering standards the framework applies are in `.claude/rules/`. Project-specific conventions (formatter, linter, naming, layering) are recorded in `CLAUDE.md`. One branch per work item, named by the feature map; never commit to the default branch, every change lands through a pull request.

## Contributing

Each work item goes through one lifecycle: `/plan-feature {ID}` opens a plan pull request, a human reviews it and marks the item Ready for Build, `/build-feature {ID}` opens the implementation pull request, a human reviews and merges it, and CI marks the item Done. A small item takes `/fix {ID}`. Review feedback is applied with `/revise-feature {ID}`. The full workflow, the autonomous mode and the batch commands are in the framework manual → Development Workflow.
