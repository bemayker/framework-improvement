# Mayker Sandbox

A minimal task-notes app used exclusively as a validation sandbox for the mayker-dev framework. See below for setup instructions and [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for the full AI development workflow.

This project uses a Claude Code-driven, per-feature delivery framework: a human installs the `mayker-dev` plugin, runs `/init-project` (which generates `CLAUDE.md` and `.claude/settings.json` from the plugin), fills in `CLAUDE.md`, runs `/sync-project` to finish setup, then dispatches autonomous Claude Code sessions (one per feature) through a fixed pipeline: plan → review → build → review → revise → merge → Done.

---

## Running the project

**Prerequisites:** Docker and Docker Compose.

1. Copy the environment template: `cp .env.example .env` (defaults work as-is for local development).
2. From the repository root, start all services: `docker compose up`.
3. Once the services are up:
   - Frontend (React/Vite dev server): http://localhost:5183
   - Backend (FastAPI): http://localhost:8010
   - Database: PostgreSQL, exposed on host port 5442

`docker compose up` starts three services: `db` (PostgreSQL 16), `backend` (FastAPI via uv), and `frontend` (Vite dev server). See [docs/DEVELOPMENT.md → Running tests locally](docs/DEVELOPMENT.md#running-tests-locally) to run the test suites without Docker.

---

## Prerequisites

### Required connections: one MCP, one CLI

This project's framework needs an **issue tracker** MCP connection (reading features, status, dependencies) and a working **Git provider path** (PRs, review comments, branches). They are set up differently, and that is the thing to get right first.

- **The issue tracker is an MCP server.** Add it at **project scope** with `claude mcp add --scope project <name> ...` so it is written to `.mcp.json` and shared with the team via git. The template ships a `.mcp.json.example` for reference; `claude mcp add` writes the real file. With Work Item Source `local` you can skip it entirely.
- **The Git provider on GitHub is the `gh` CLI, not an MCP server.** Install the GitHub CLI and run `gh auth login` once (or set `GH_TOKEN` for an unattended surface). **Do not add a `github` MCP server: nothing reads it.** Every remote git operation — branches, pushes, PRs, checks, review comments, merges, repository creation — runs through `gh`, `gh api` and `git`, and a command that needs the remote stops with a named message rather than degrading. *(mayker-dev 0.3.141 retired the hosted GitHub MCP for this framework; `docs/DEVELOPMENT.md` has the two reasons.)*
- **On GitLab or Bitbucket the Git provider is that provider's MCP**, added exactly like the tracker. Know one consequence before choosing it: the framework's branch-guard and test-gate hooks match `Bash`, so a push made through a provider MCP's own write tools is **not** gated.

Two things to know before you run it, because they trip people up:

- **ClickUp (and Linear/Jira) use OAuth**, so there is no token to store; you approve in the browser via `/mcp`. A token-authenticated server instead references its secret as `'${SOME_TOKEN}'`, so `.mcp.json` stores only the variable name.
- **On GitHub Enterprise** (GHES or a `*.ghe.com` tenant), `gh` needs the host: `/init-project` detects a non-github.com remote and writes `GH_HOST=<your-host>` into `.claude/settings.json`, and you run `gh auth login --hostname <host>` once per machine. See **[docs/DEVELOPMENT.md → GitHub Enterprise](docs/DEVELOPMENT.md#github-enterprise-ghes-and-ghecom)**.

Verify the tracker with `claude mcp list` (or `/mcp` inside a session) and the Git path with `gh auth status`. The full `claude mcp add` forms, the worked ClickUp and GitHub examples, secret handling, and the optional Figma MCP are documented once in **[docs/DEVELOPMENT.md → MCP connections](docs/DEVELOPMENT.md#1-mcp-connections-mandatory)**; follow that for setup rather than repeating it here.

> In Claude Code on the web / Routines, the same project-scoped `.mcp.json` is used and credentials are supplied by the environment rather than your local machine.

### Permissions & autonomy

Autonomous (cloud) runs must not stop to ask for approvals. The permission posture lives in `.claude/settings.json`: `/init-project` writes the allow/deny list and `defaultMode` from the plugin (the committed file starts with only the marketplace/plugin bootstrap), and the plugin supplies the hooks that enforce the test and format gates. See [docs/DEVELOPMENT.md → Permissions & Autonomy](docs/DEVELOPMENT.md#2-permissions--autonomy).

### Repository secrets (for CI/CD)

The CI pipelines require these secrets to be configured in your repository:

| Secret | Purpose | Where to get it | Where to add it |
| --- | --- | --- | --- |
| `CLICKUP_API_KEY` | Auto-transition features to Done on merge | ClickUp → Settings → Apps → API Token | GitHub → Settings → Secrets and variables → Actions |

> The secret name matches your tracker (`CLICKUP_API_KEY` / `LINEAR_API_KEY` / `JIRA_API_TOKEN` + `JIRA_EMAIL`). With `local` work-item source there is no tracker secret. Optional Slack notifications need a `NOTIFY_SLACK` Variable + `SLACK_WEBHOOK_URL` Secret; optional security scanning needs `AIKIDO_API_KEY`. Full names, locations, and the Slack three-step setup are in [docs/DEVELOPMENT.md → Repository Secrets](docs/DEVELOPMENT.md#3-repository-secrets-for-cicd).

### Development environment

Docker and Docker Compose, Node.js 20, Python 3.12 and uv. See [docs/DEVELOPMENT.md → Development Environment](docs/DEVELOPMENT.md#4-development-environment).

---

## Repository structure

```text
.
├── CLAUDE.md                       # Project config + standard imports: generated by /init-project, then you fill it in
├── .mcp.json.example               # Sample MCP server config (ClickUp + GitHub shape) shipped with the template
├── .mcp.json                       # Live MCP server config you create with `claude mcp add` (committed, project scope)
├── .env.example                    # Env var template (DB connection + frontend API base URL); copy to .env
├── docker-compose.yml              # db (postgres:16) + backend + frontend services
├── playwright.config.ts            # Playwright E2E config (baseURL http://localhost:5183)
├── package.json                    # Root: Playwright dev dependency + `e2e` script
├── .claude/
│   ├── settings.json               # Bootstrap (marketplace + enabled plugins) committed; permissions added by /init-project
│   ├── rules/                      # Engineering standards, materialized from the plugin by /init-project (do not edit)
│   ├── project_state.json          # Pinned tracker IDs + status map + feature registry for tracker source; tracker-less for local source (generated)
│   ├── feature_map.md              # Flat feature dependency table; flat or absent for local source (generated)
│   └── artifacts/                  # Per-feature plans, reports, and scripts (generated)
├── backend/                        # FastAPI app (Python 3.12, managed with uv)
│   ├── app/                        # Router → Service → Repository layers, schemas, models, core (config)
│   ├── tests/                      # pytest: unit/ and integration/, shared conftest.py
│   └── Dockerfile
├── frontend/                       # React + TypeScript + Vite app
│   ├── src/                        # Components (e.g. LandingPage), entry point, Vitest setup
│   └── Dockerfile
├── e2e/                            # Playwright E2E specs (tests/), helpers/, and UAT artifacts (uat/scenarios, uat/scripts)
├── docs/
│   └── DEVELOPMENT.md              # Full development workflow guide
└── design-reference/               # Figma-to-code export: you add this only if CLAUDE.md Design Reference mode is REPO_DIR (not shipped in the template)
```

> The commands, skills, subagents, and hooks are **not** files in this repo: they are provided by the `mayker-dev` plugin once it is installed. This repo keeps only configuration and generated state. `CLAUDE.md`, the `.claude/settings.json` permissions, and the `.claude/rules/` standards are all generated or materialized into the repo by `/init-project` from the plugin, and `.claude/project_state.json`, `.claude/feature_map.md` and the CI workflows by `/sync-project` (the single source of truth), so a fresh clone holds only the bootstrap `.claude/settings.json` plus this scaffold until you run it. The `docs/issues/` directory (for `local` work-item source) is created on demand by `/fix` and `/diagnose`; the plugin ships a copyable example work item.

---

## Development workflow

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for the complete guide. Quick summary:

1. Install the plugin (see Install below), then run `/init-project` locally (one-time setup). It generates `CLAUDE.md`; fill in your project details and run `/sync-project` to finish. Re-run `/sync-project` whenever the tracker backlog or the codebase moves.
2. **Build the scaffold feature first** (`new` mode): plan, review, mark Ready for Build, build, and merge the feature flagged `scaffold` in `feature_map.md`. It creates the project structure, test infrastructure, and CI that every other feature depends on, and the precedence gate blocks every other item until it is Done.
3. Dispatch `/plan-feature {ID}` sessions for every item whose dependencies are Done (Claude Code on the web)
4. Review plan PRs
5. Mark approved features as "Ready for Build" in the tracker
6. Dispatch `/build-feature {ID}` sessions
7. Review implementation PRs
8. Merge → CI auto-transitions features to Done
9. Repeat for newly-unblocked items (or set `Autonomy: autonomous` in CLAUDE.md and run `/deliver` once to automate steps 3 to 9)

Steps 3 and 6 also have batch forms that keep every review gate: `/plan-features {IDs | ready | wave N}` and `/build-features {IDs | ready | wave N}` run the same procedure for a whole selection from one session, each item in its own git worktree. `wave N` takes the front you authored in `feature_map.md`; `/waves` prints those fronts.

---

## CI/CD

> CI pipeline details (the generated workflows and the secrets each needs) are summarized in [docs/DEVELOPMENT.md → CI/CD](docs/DEVELOPMENT.md#cicd).

## AI delivery framework (mayker-dev plugin)

This repo runs on the `mayker-dev` Claude Code plugin from the private `mayker` marketplace. The plugin provides the commands, skills, subagents, hooks, and standards; this repo keeps only configuration (`CLAUDE.md`, `.mcp.json`, `.claude/settings.json`, `.claude/rules/`, generated state).

### Install

```bash
claude plugin marketplace add bemayker/mayker-marketplace
claude plugin install mayker-dev@mayker
```

Team members are prompted to add the marketplace and install the plugin when they open the repo, since it is declared in the committed `.claude/settings.json` (this is what makes the install automatic; the prompt is a one-time approval per person).

### Modes (in CLAUDE.md)

- Project mode: `new` (scaffold a new app) or `existing` (adapt to an established codebase).
- Work item source: `tracker` (ClickUp/Linear/Jira via MCP), `local` (issue files in `docs/issues/`, no tracker needed), or `hybrid`.

### Commands

Type `/mayker-dev:<command>`, or the bare `/<command>` when no other plugin claims the same name: `init-project`, `sync-project`, `plan-feature`, `build-feature`, `revise-feature`, `refactor`, `generate-tests`, plus `diagnose` (find bugs/perf issues in existing code), `fix` (quick single-issue plan+build), `waves` (the read-only grouped wave view of the dependency graph), and the batch forms `plan-features` / `build-features` (`{IDs | ready | wave N}`, several items at once in per-item worktrees, same gates).

