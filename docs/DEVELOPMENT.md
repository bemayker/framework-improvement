# AI Development Framework: Standard Operating Procedure

This document describes the full development workflow for this project, running on **Claude Code**. For a quick overview and how to run the application, see the [README](../README.md).

> **The loop, at a glance.** `/init-project` then `/sync-project` once to set up, then per work item:
>
> `/plan-feature {ID}` → review the plan PR → mark **Ready for Build** → `/build-feature {ID}` → review the implementation PR → **merge** (CI marks it Done).
>
> `/revise-feature {ID}` applies PR review feedback at either checkpoint; `/fix {ID}` is the condensed single-item path; `/diagnose {scope}` seeds work items from existing code; `/watch-pr` (run automatically at the tail of build/revise/fix, and of the standalone `/refactor` and `/generate-tests`) watches the PR's CI checks to green so red checks never sit unnoticed. Everything below is the detail behind this loop.
>
> **Several items from one session.** `/plan-features {IDs | ready}` and `/build-features {IDs | ready}` run the same per-item procedure for a whole selection, each item in its own git worktree, up to `Max parallel items` at a time. Same gates, same PRs, same approvals: a plan batch ends at draft plan PRs and a build batch at PRs handed over for review. See [Batch dispatch](#batch-dispatch-plan-features--build-features).
>
> **Autonomous alternative.** With `CLAUDE.md` → `Autonomy: autonomous`, the loop above is replaced by a single `/deliver` run that drives the whole backlog to Done itself: self-approved plans, CI monitored and fixed, review comments handled, merges decided by the framework. See [Autonomous mode](#autonomous-mode-deliver).

> **New project:** run `/init-project`, fill in `CLAUDE.md`, run `/sync-project`, then **build the scaffold feature first** (it creates the project structure, tests, and CI everything else depends on), and only then dispatch every item whose dependencies are Done, independent items in parallel.

---

## Prerequisites

### 1. MCP connections (mandatory)

This framework uses two MCP (Model Context Protocol) connections: an **issue tracker** and a **Git provider**. With the default `Work Item Source: tracker`, both are needed. With `local` source the issue tracker MCP is not required, and the Git provider MCP degrades to the `gh` CLI for branch and PR operations, including the PR review comments that `/revise-feature` and re-planning read; if neither the MCP nor `gh` is available, paste the feedback into the task prompt instead. If you rely on the `gh` fallback (common with `local` source), install the GitHub CLI and run `gh auth login` once so it can open PRs and read review comments. They are defined in `.mcp.json` at the repo root (project scope, committed to git so the whole team shares them).

#### How `claude mcp add` works

There is no single `<server-spec>` value. The command takes one of two forms, depending on how the MCP server runs:

1. **Local server (stdio).** Claude starts the server process on your machine, almost always via `npx`. Credentials are passed with `--env`, and `--` separates Claude's own flags from the launch command:

   ```bash
   claude mcp add --scope project <name> --env KEY=value -- npx -y <package>
   ```

2. **Remote server (HTTP).** Claude connects to a hosted URL with an `Authorization` header:

   ```bash
   claude mcp add --scope project --transport http <name> <url> --header "Authorization: Bearer <token>"
   ```

`<name>` is any label you choose; it becomes the key under `mcpServers` in `.mcp.json`. `--scope project` is what writes the entry to the committed `.mcp.json` (omit it and the entry lands in your personal `~/.claude.json` instead).

#### Issue tracker MCP, worked example: ClickUp

ClickUp publishes an **official, first-party MCP server**: a remote (HTTP) server at `https://mcp.clickup.com/mcp`, OAuth-authenticated, currently in public beta. Prefer it over community `npx` packages.

```bash
claude mcp add --scope project --transport http clickup https://mcp.clickup.com/mcp
```

Because it uses OAuth, there is no token or team ID to paste or store: run `/mcp` inside a session and approve ClickUp in the browser (you choose the workspace there). The resulting `.mcp.json` entry holds only the URL:

```json
{
  "mcpServers": {
    "clickup": {
      "type": "http",
      "url": "https://mcp.clickup.com/mcp"
    }
  }
}
```

(Linear and Jira also publish official MCP servers, added the same way. If you instead use a community server that authenticates with an API key, see "Keeping token-based secrets out of git" below.)

#### Git provider MCP, worked example: GitHub

GitHub publishes an official remote MCP server at `https://api.githubcopilot.com/mcp/`. **Authenticate it with a Personal Access Token, not OAuth.** Claude Code's OAuth flow requires Dynamic Client Registration (RFC 7591), which this endpoint does not support, so the interactive "Authenticate" path fails with *"Incompatible auth server: does not support dynamic client registration."*

Create a PAT with the scopes the agents need. Classic: `repo` (add `workflow` if features touch `.github/workflows`); fine-grained: Contents, Pull requests, and Issues read/write plus Metadata read. Keep the token in your environment, never in `.mcp.json`:

```bash
export GITHUB_PAT=ghp_your_real_token
claude mcp add --scope project --transport http github \
  https://api.githubcopilot.com/mcp/ \
  --header 'Authorization: Bearer ${GITHUB_PAT}'
```

The single quotes stop your shell expanding `${GITHUB_PAT}` during `claude mcp add`, so `.mcp.json` stores only the variable name; Claude Code expands it at runtime. Run `/mcp` to confirm the connection.

> GitLab and Bitbucket publish their own MCP servers. If their auth server supports OAuth Dynamic Client Registration, the OAuth flow works; otherwise use the same PAT-in-header pattern.

#### GitHub Enterprise (GHES and ghe.com)

The hosted endpoint above (`https://api.githubcopilot.com/mcp/`) serves **github.com only**. Pointed at a repo that lives on an Enterprise host, its repo tools (`list_pull_requests`, `create_pull_request`, ...) return 404s even though the connection itself shows as healthy — which is why verification must be a functional call, not a presence check (see `project_state.json` → `git_provider.effective_path` below). Configure Enterprise hosts like this:

- **GitHub Enterprise Cloud with data residency (`*.ghe.com`):** use your tenant's own remote endpoint instead of the github.com one — same PAT-in-header pattern, PAT issued on your tenant:

  ```bash
  claude mcp add --scope project --transport http github \
    https://copilot-api.<subdomain>.ghe.com/mcp \
    --header 'Authorization: Bearer ${GITHUB_PAT}'
  ```

- **GitHub Enterprise Server (self-hosted):** the remote server is not offered; run the local `github-mcp-server` and point it at your host with `GITHUB_HOST` (the explicit `https://` prefix is required):

  ```bash
  claude mcp add --scope project github \
    --env GITHUB_PERSONAL_ACCESS_TOKEN='${GITHUB_PAT}' \
    --env GITHUB_HOST=https://github.your-company.com \
    -- docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN -e GITHUB_HOST \
    ghcr.io/github/github-mcp-server
  ```

- **The `gh` CLI fallback:** `gh` also defaults to github.com. `/init-project` detects a non-github.com GitHub remote and writes `GH_HOST=<your-host>` into the `env` block of `.claude/settings.json`, so every `gh` call in every session (including cloud ones) targets the right host with no `--hostname` flag. The one manual step: run `gh auth login --hostname <your-host>` once per machine so the CLI is authenticated against that host.

#### Keeping token-based secrets out of git

`.mcp.json` is committed, so never put a raw token in it. When a server needs a static token, reference an environment variable instead: write `'${GITHUB_PAT}'` (the single quotes stop your shell expanding it during `claude mcp add`), so `.mcp.json` stores only the variable name. Set the real value in your shell (or CI secrets), and Claude Code expands `${...}` at runtime:

```bash
export GITHUB_PAT=ghp_your_real_token
```

OAuth servers (such as the official ClickUp one above) avoid this entirely, since there is no token to store. GitHub, authenticated by PAT here, follows the variable-reference pattern.

#### Figma MCP (optional)

Only if `CLAUDE.md` → Design Reference → Mode is `FIGMA_MCP`. Add the Figma MCP server the same way, then authenticate with `/mcp`.

**It is needed at plan time, not at build time.** The `planner` is the only dispatch that reads the design: it records the reference's own values (spacing, sizes, colors, typography, states) on the plan's `- Design reference notes:` line, and every build phase implements from that record without fetching anything (`coding_standards.md` Section 3.4). So a build runs normally on a machine with no Figma connection, and a *plan* written without one records "no values recorded: Figma MCP unavailable at plan time" on that line — which the self-review reports as one OPTIONAL finding about the plan rather than a BLOCKING one against the code.

#### Verify

```bash
claude mcp list        # both should show as connected
```

Inside a session, `/mcp` lists the servers and triggers any interactive auth flows.

> **Cloud surfaces:** In Claude Code on the web / Routines (unattended runs triggered on a schedule, webhook, or API call; see [Dispatching Sessions](#dispatching-sessions)), the same project-scoped `.mcp.json` is used. Credentials are supplied by the environment (the web session or Routine secrets), not a developer's local machine. The "MCP is mandatory, stop if absent" guard still applies; only the place you set the secrets moves.

### 2. Permissions & Autonomy

Claude Code has an explicit permission system. Unattended runs must not block on approvals, so the framework keeps a permission posture in **`.claude/settings.json`**. `/init-project` writes it from the plugin (the committed file starts with only the marketplace/plugin bootstrap that triggers auto-install), and you can tune it afterwards:

- **`permissions.defaultMode: "acceptEdits"`**: file edits proceed without prompting.
- **`permissions.allow`**: the git / package-manager / test / formatter / Docker commands and MCP tools agents routinely need.
- **`permissions.deny`**: destructive or unsafe operations (`rm -rf`, `sudo`, the common force-push flags `--force` / `-f` / `--force-with-lease`, writing `.git/`, and reading committed secret env files like `.env` / `.env.local`). Treat this as a best-effort guard, not a sandbox: an allowed interpreter or shell utility can still read a file, so keep real secrets in environment variables or CI secrets, never in committed files. The non-secret `.env.example` stays readable on purpose.
- **Hooks**: deterministic gates (see [Hooks](#hooks) below).

Tune the allow/deny lists for your stack. For Claude Code on the web, the environment can also grant tool permissions; keep `.claude/settings.json` as the committed source of truth so local and cloud runs behave the same.

> Personal overrides go in `.claude/settings.local.json` (gitignored). Never put secrets in `.claude/settings.json`.

### 3. Repository Secrets (for CI/CD)

The CI pipelines require secrets to be configured in your repository settings. These enable the auto-Done pipeline to transition features in your tracker when PRs are merged.

| Secret | Purpose | Where to get it | Where to add it |
| --- | --- | --- | --- |
| `CLICKUP_API_KEY` | Auto-transition features to Done on merge | ClickUp → Settings → Apps → API Token | GitHub → Settings → Secrets and variables → Actions |

> The secret name matches your tracker. ClickUp uses `CLICKUP_API_KEY`; Linear uses `LINEAR_API_KEY`; Jira uses `JIRA_API_TOKEN` **and** `JIRA_EMAIL`. With `Work Item Source: local`, the auto-Done step flips an in-repo file instead of calling a tracker API, so **no tracker secret is required** (the optional Slack secrets below still apply). With `hybrid` the secret **is** required: tracker-resident items are transitioned through the REST API, and without it their authoritative status is only warned about, never flipped.

**Platform-specific instructions (where to add the secret):**

- **GitHub:** Repository → Settings → Secrets and variables → Actions → New repository secret
- **GitLab:** Repository → Settings → CI/CD → Variables (set as masked + protected)
- **Bitbucket:** Repository → Repository settings → Pipelines → Repository variables (set as secured)

**Tracker-specific API key locations:**

- **ClickUp:** ClickUp → Settings → Apps → API Token
- **Linear:** Linear → Settings → Account → API → Personal API keys → Create key
- **Jira:** Atlassian → Account → Security → API tokens → Create API token (also requires the `JIRA_EMAIL` secret)

**Optional Slack notifications.** If `/sync-project` generated the PR notification pipeline (`notify-slack.yml`), it is opt-in and off by default. Enabling it takes three required steps: a `NOTIFY_SLACK` repository Variable, a `SLACK_WEBHOOK_URL` Secret, and pushing the workflow from a local CLI. See [Notes & edge cases → Slack notifications (opt-in)](#slack-notifications-opt-in) for the full setup and the reasoning behind it.

**Optional security scanning.** If the **Security Scanning** toggle is `ENABLED` or `OPTIONAL`, the `security-scan.yml` gate needs an `AIKIDO_API_KEY` secret (from Aikido → Local Scanner setup). The gate stays inert (skips with a warning) until it is set. The optional `aikido-autofix.yml` workflow (opt-in via the `AIKIDO_AUTOFIX` Variable) additionally needs a Claude auth secret (`ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN`) to dispatch the fixer. See [Security scanning (Aikido)](#security-scanning-aikido).

### 4. Development Environment

Required to run the project locally (per `CLAUDE.md` Tech Stack):

- **Docker** and **Docker Compose** (runs `db`, `backend`, `frontend` via `docker-compose.yml`).
- **Node.js 20** (frontend: React, TypeScript, Vite; matches the `node:20-slim` image in `frontend/Dockerfile`).
- **Python 3.12** (backend: FastAPI, matches the `python:3.12-slim` image in `backend/Dockerfile`).
- **uv** (manages the backend's Python environment and dependencies; see `backend/pyproject.toml`).

See the [README → Running the project](../README.md#running-the-project) for the `docker compose up` quick start, and [Running tests locally](#running-tests-locally) below to run the test suites directly on the host.

---

## Framework Overview

### How It Works

This framework uses Claude Code to plan, implement, test, and deliver features autonomously. The commands you run are plan, build, and revise; the lifecycle they produce is **plan → review → build → review → revise → merge → Done**. The two reviews are human checkpoints (on the plan PR and the implementation PR), revise is the loop back when a review asks for changes, and Done is set automatically by CI on merge.

The **primary dispatch surface is Claude Code on the web** (or `claude --remote`): each session runs in an isolated, Anthropic-managed cloud VM, clones the repo, and prepares a PR. Because each invocation is its own independent session, you can fire `/plan-feature US-101`, `US-102`, `US-103` in parallel, one per feature. See [Dispatching Sessions](#dispatching-sessions).

### Key Files

| File | Purpose | Who edits it |
| --- | --- | --- |
| `CLAUDE.md` | Project configuration (tech stack, MCP config, design refs, toggles) plus always-on standard imports | Generated by `/init-project` from the plugin, then filled in by a human |
| `.mcp.json` | Live MCP server definitions (project scope); written by `claude mcp add`. The template ships `.mcp.json.example` as a sample | Human / `claude mcp add` |
| `.claude/settings.json` | Permissions and autonomy posture (hooks are wired by the plugin, not here) | Bootstrap committed; permissions written by `/init-project`, then tunable |
| commands, skills, subagents, hooks | The pipeline logic and gate scripts | Provided by the `mayker-dev` plugin (not files in this repo) |
| `.claude/rules/*.md` | Engineering standards (coding/testing/review) | Materialized from the plugin by `/init-project`; do not hand-edit |
| `.claude/scripts/feature-map-validate.sh` + `feature_map.template.md` | The feature-map schema validator and its schema source, vendored so this repo's own CI and your own shell can run them without the plugin installed. Both carry a `materialized-from` stamp and are replaced as a pair | Vendored from the plugin by `/init-project`, refreshed by `/upgrade-project`; do not hand-edit |
| `.claude/project_state.json` | Pinned tracker identifiers (workspace/project/team) + status mapping + feature registry, each entry recording where its Feature ID came from and where the tracker carries it (`id_source`, `id_carrier`) plus the item's canonical tracker `url` where the tracker's response carried one (tracker source); tracker-less (Git provider + `work_item_source` only) under `local` source. Also records `git_provider.effective_path`: the functionally-verified Git-provider working path (`mcp` or `gh`, with host, timestamp, plugin version), so sessions go straight to the path that works instead of re-discovering a dead MCP | Generated by `/sync-project`, `effective_path` refreshed by pipeline sessions when stale |
| `.claude/feature_map.md` | Flat feature dependency table (tracker/`new` mode); flat or absent under `local` source | Generated by `/sync-project` (or `/deliver`) |
| `.claude/artifacts/{ID}/` | Per-feature plans, reports, and User Acceptance Testing (UAT) scripts | Generated by agents |

### Status Flow

Features move through these statuses. The framework maps them to your tracker's actual status names during `/sync-project`.

```
Todo → Planning → Plan Review → Ready for Build → In Progress → In Review → Done
                       ↑                                              |
                       |              (revision needed)               |
                       └──────────────────────────────────────────────┘
```

| Status | Who sets it (assisted) | How |
| --- | --- | --- |
| Todo | Default | Initial state in tracker |
| Planning | AI agent | `/plan-feature` starts |
| Plan Review | AI agent | `/plan-feature` creates draft PR |
| Ready for Build | **Human** | You approve the plan in the tracker |
| In Progress | AI agent | `/build-feature` starts |
| In Review | AI agent | `/build-feature` converts its draft PR to ready for review, after its CI watch came back green |
| Done | **CI pipeline** | Automated on merge to main |

> **Autonomous mode:** the flow is identical, but `/deliver` performs the two human transitions itself: the plan is self-approved (Plan Review → Ready for Build is automatic, logged in the item's `decisions.md`) and the merge is the framework's own verdict once CI is green and comments are resolved. See [Autonomous mode](#autonomous-mode-deliver).

> **Ready for Build needs a tracker status of its own.** The framework writes a status through `status_mapping` in `.claude/project_state.json` and reads it back through `reverse_status_mapping`, which is single-valued. So if **Ready for Build** shares a tracker status with anything else, your approval becomes invisible: the write lands on the shared status, reads back as the other one, and `/build-feature` refuses the item forever with "not yet approved for building". The same applies to **In Progress** (resume detection) and **Done** (what unblocks dependent items). `/sync-project` will not write a mapping that collapses one of these, and every command re-checks it at startup and warns once. If you ever see that warning, edit the named `status_mapping` key in `.claude/project_state.json` to a tracker status nothing else uses — the warning lists the free ones. There is no repair command; it is a one-line edit on purpose. The same check fails a working status (Planning through In Review) mapped onto a tracker status whose name marks it closed or cancelled: that mapping can be distinct and still wrong, because a build would move a live item to the terminal status the moment it starts implementing.
>
> ```bash
> # check it yourself at any time
> bash "$CLAUDE_PLUGIN_ROOT/hooks/lib/status-mapping-validate.sh" .claude/project_state.json
> ```

---

## Commands, Skills, and Subagents

The commands, skills, and subagents are provided by the `mayker-dev` plugin, not files in this repo. Once the plugin is installed, each command is available as `/mayker-dev:<command>`; the bare `/<command>` form (used in the examples throughout these docs) also works when no other plugin claims the same name. Each command invokes the matching **skill**, which holds the full multi-phase procedure and auto-loads (by its description) even in Claude Code on the web and Routines. Commands also pin a **model** per task (strongest for planning, cheaper for mechanical work) — but **only the slash-command route applies that pin**, so a procedure the description auto-load or the `Skill` tool starts runs on your session model instead. See [Per-Command Model Pinning](#per-command-model-pinning) before you rely on a tier.

### Subagents

The plan / build / review split is expressed with dedicated subagents provided by the plugin (`planner`, `builder`, `reviewer`):

| Subagent | Role | Tools / Permissions | Model |
| --- | --- | --- | --- |
| `planner` | Architect plans (`/plan-feature`, `/deliver`) | Read-mostly; writes only plan artifacts under `.claude/artifacts/` | fable |
| `builder` | Implementation + tests (`/build-feature`, `/revise-feature`, `/fix`, `/deliver`) | Read/write code, run tests, commit and push | opus |
| `reviewer` | Self-review against `review_standards.md` (`/build-feature`, `/fix`, `/deliver`) | **Read-only** (Read, Grep, Glob); cannot edit, run, or commit | opus |
| `orchestrator` | Autonomous scheduling and verdicts (`/deliver`): dependency graph, readiness, conflict serialization, plan self-approval, merge decisions, run report | Read-mostly; writes only run artifacts and decision logs; spawns nothing | fable |

**The Model column holds only while the dispatch passes no `model` argument.** These pins live in the plugin's `agents/*.md` and are route-independent — unlike a command pin, they apply however the procedure was entered — but they are *not* unconditional: the Agent/Task call that spawns a subagent may itself carry a per-invocation `model`, and that argument outranks the definition. Nothing refuses it and the run still reports success, so a review that was supposed to be Opus can run a tier down with no error anywhere; the only trace is the **observed** model column in `.claude/artifacts/{ID}/stats_summary.md`. Since plugin 0.3.116 a dispatch-bracketing step marker declares the agent **definition's** pin rather than whatever the dispatching session assumed, so an argument that overrode the definition now surfaces as a `model!=marker` flag instead of agreeing with a marker written from the same wrong assumption (MDF-135). Every skill and rule in the plugin that dispatches a subagent therefore states that its dispatches pass no `model` argument. If you drive these subagents yourself, do the same.

The reviewer is intentionally read-only so it cannot quietly fix what it is meant to critique. It reports findings; the builder applies the fixes. Since it cannot run anything, each dispatch also hands it the run's observed test results — every build dispatch records the command, counts and infrastructure of each tier it ran in `.claude/artifacts/run/handover/{ID}-run.md`, stamped with the run's id, and the reviewer is handed that id and reads only its own run's lines — so a review claim about run-time behaviour is graded against what **this** build actually observed rather than predicted from source alone: a prediction that contradicts an observed pass must be explained or downgraded and is never BLOCKING, and a suspicion the reviewer cannot settle by reading is RECOMMENDED with a `Verify by running:` command attached, which the refactor gate discharges by running it. The orchestrator is likewise decision-only: the main `/deliver` session executes its verdicts, keeping decisions and actions separately auditable.

**None of them inherits `CLAUDE.md` or its `@`-imported standards** — a dispatch carries only its system prompt, its tools, its definition and the dispatch prompt — so each agent reads the standards it applies itself and ends its return payload with a `STANDARDS READ:` line naming what it actually opened. At each run's Summary the dispatching command makes one call to the plugin's `standards-provenance.sh`, which flags any artifact citing a standard the dispatch never reported reading. The read count carries **no pass bar**: skipping a standard and saying so is acceptable, citing one you skipped is the defect, and a flagged mismatch is reported rather than blocking anything. **That count is self-reported, and the check labels it so**: it is what each dispatch said about itself, nothing in the check verifies it, and the measured figure comes from counting `Read` tool_use blocks in the dispatch transcripts. A dispatch has more than once claimed a standard it never opened, on the false belief that the `CLAUDE.md` imports reached it.

### Hooks

The `mayker-dev` plugin wires seven deterministic hooks in its manifest (`.claude-plugin/plugin.json`). The scripts live in the plugin and are referenced via `${CLAUDE_PLUGIN_ROOT}/hooks/`; they are **not** files in this repo:

- **`branch-guard.sh`** (PreToolUse on `git commit`/`git push` **and** on the GitHub MCP push tools): hard-enforces the branch convention on both push paths. For Bash it checks the current branch **of the tree that command runs in** — the primary checkout, or the item's worktree when the run uses per-feature worktrees, resolved from a `cd`/`git -C` in the command or the session's directory; for an MCP push (`push_files`, `create_or_update_file`, `delete_file`) it checks the target `branch` argument. **Blocks** on an unrecognized branch (it allows `feature/*`, the standalone `refactor/*` and `test/*` branches that `/refactor` and `/generate-tests` create, and `main`/`master`/`develop`), so cloud surfaces that start on an auto-generated `claude/<slug>` branch cannot commit or push there. The block message is fed back to the agent, which then switches to the feature branch and retries; it names the branch's source in priority order — `feature_map.md`, else the local work item's frontmatter, else `feature/{WORK_ITEM_ID}-{slug}` built from the item's own ID when the repo has neither file — so a repo without a feature map gets a remedy instead of a file to hunt for. **The verdict does not depend on how the command is spelled:** `git commit`, `cd <dir> && git commit` and `git -C <dir> commit` issued from one directory resolve to one tree, including when the session's project directory is itself not a repository (a workspace folder holding several checkouts, a monorepo of separate repos). **Fails open** when it cannot resolve a branch (detached HEAD, no repository at the resolved directory, an unparseable MCP call) — but never silently: each of those prints one `[branch-guard] fail-open:` line naming what it could not resolve, because an exit 0 with no output is indistinguishable from a gate that ran and passed. This is what makes the auto-Done pipeline's feature-ID parsing reliable.
- **`test-gate.sh`** (PreToolUse on `git push` **and** on the GitHub MCP push tools): runs the project's test suites before any push, on either path, **in the tree the push comes from**. For an MCP push it resolves the target branch's local worktree (autonomous runs build each item in `.claude/worktrees/{ID}`) and runs the suites there; for a `git push` it resolves the same way from the command's own directory (a `cd` or `git -C` in the command, else the session's), which is what makes `Worktrees: per-feature` gate the feature's code rather than whatever the primary checkout happens to hold. A subdirectory of the same checkout is not a different tree: a monorepo push still gates from the repo root. It first honors the explicit **`Test gate command:`** from `CLAUDE.md` → Test Configuration (written by `/sync-project` from the real stack as plain text; the hook strips a bold label, a wrapping code span and a trailing `#` comment before running it, and refuses — blocking the push with the fix — a command whose backticks it cannot resolve, rather than eval'ing something else); only when that is unset/`auto` does it fall back to auto-detection, which scans the repo root **and one level deep** (e.g. `backend/pyproject.toml`, `frontend/package.json`) and runs each suite in its own directory with the right runner (`uv run pytest` when `uv.lock` is present, else `pytest`/`python3 -m pytest`; the package.json `test` script via pnpm/yarn per lockfile, else npm). **Detection is evidence, not a guess:** a Python suite needs a real config file (`pyproject.toml`, `pytest.ini` or `setup.cfg`) at the root just as it does one level deep — a bare `tests/` directory is not evidence of pytest, since it just as easily holds shell scripts or Playwright specs. A repo running pytest with no config file anywhere is therefore detected as nothing, and the gate says so rather than running an empty suite; give it an explicit `Test gate command:`. **Fails closed** (blocks the push) if tests genuinely fail, **and also when tests are detected but no usable runner is on PATH** (with guidance to install the runner or set `Test gate command:`); **fails open** (allows) only when no explicit command is configured and no test setup exists at the root or one level deep (pre-scaffold), when it cannot enter the resolved run directory, or when an auto-detected runner collects no tests (pytest exit 5). That last case is allowed but **never reported as a pass**: it prints a `[test-gate] fail-open:` line naming the tree and the suite's entry in `Suites run:` says `collected no tests`, because a detected suite that collected nothing is as likely to be a mis-detection as an empty one and the two used to be the same green line. A configured `Test gate command:` or `Scoped test command:` is not covered by that: it was written rather than guessed, so its exit code decides the gate as-is and exit 5 **blocks** the push — an empty run of the command your project chose is not a pass, and CI's exit-5 tolerance is a different instrument (it keeps a workflow shared across subprojects from going red, it is not a verdict about your push). **That block says what actually happened**: it names the field, says it `collected no tests`, and names the three ways out (write the tests, fix a filter that currently matches nothing, or point the field at a command that has a suite). It is deliberately not the "tests failed … fix the failing tests" message, which named a cause that did not exist; a real failure still gets that message, unchanged, so the two are distinguishable in the log. **Before any suite runs it exports the run's resolved backing services**: the `- env:` lines of `.claude/artifacts/run/handover/{ID}-run.md` become environment variables for the suites (`{SERVICE}_URL`, `{SERVICE}_PORT`, and `DATABASE_URL`/`TEST_DATABASE_URL` for a relational engine), so the host-assigned port a build provisioned on is visible to the gate and a build whose every tier passed inside the dispatches is not blocked at the push by a suite falling back to `localhost:5432`. Variable names are logged, never values. **Only the current run's lines are exported**: that record is keyed by work item and grows across runs, so the hook derives the current run as the last `run=` value in the file and skips every line carrying another id or none, counting them on stderr — a previous run's service is a container that was torn down. A record with no `run=` key anywhere predates that convention: nothing in it can be attributed, so nothing is exported and the hook says so. **And which record is chosen comes from the branch, not from modification time:** it is `{ID}-run.md` for the item the `feature/{ID}-{slug}` branch names, so another item's record is never this item's environment — several items share one Docker host by design. **A push that names no item is not part of any lifecycle run** — a maintenance push on `main`, a revert, a `refactor/*` or `test/*` branch — and it exports nothing at all, running against this project's declared environment or its defaults; the gate says so on the `[test-gate] env:` channel, as a decision rather than a fail-open. **Every remaining service is then connection-tested before it is exported**, one TCP connect bounded to a second: the record is written when a service comes up and is never rewritten, so it cannot know the run's Summary tore the container down afterwards. A closed port is skipped and named on stderr with its service, endpoint, run and `teardown=` value, and never exported; a line the gate cannot probe at all is exported with that stated, because "cannot check" is not "not there". **If a suite then fails after this gate exported something, the block names it** — the variables, the record, the run and the endpoint — so an environment failure is not diagnosed as a test failure. The failure sentence itself is unchanged. No record at all is the normal case for a project with no backing services and changes nothing; a record line it cannot use prints a `[test-gate] fail-open:` line naming the cause and the suites run anyway. Every run names the suites it executed, and every fail-open prints a `[test-gate] fail-open:` line naming the tree it searched, so a passing gate is auditable against a gate that ran nothing — and "no tests here" cannot hide the case where it looked in the wrong tree. **A push whose diff is non-code runs no test command at all.** Before it reads the run record and before it resolves any command, the gate classifies the paths this push would add to the remote: under `docs/`, under `.claude/`, or ending in `.md` is non-code, and **everything else is code, `.github/` included** (a workflow edit is exactly the change whose effect you want to see run). All non-code means the gate exits 0 having run nothing, printing `[test-gate] skip:` with the reason and the paths, so a documentation-only plan push no longer runs your whole suite for a `.md` file. It is the same list `pr-tests.yml`'s change gate applies in CI, deliberately, so the two cannot disagree about one diff. **One code path is enough to run the normal gate**, and the skip errs that way everywhere: the diff range is `@{u}..HEAD`, or the default branch (`origin/HEAD`, `origin/main`, `origin/master`) when the branch has no upstream yet, and a range that cannot be resolved, or resolves to no changed path, runs the suite instead of skipping. A hook never fetches. The skip is reported as a **decision** and never through the fail-open channel: "the gate chose to run nothing" and "the gate could not run anything" are different facts and must not read alike. **And every push's verdict is written where it can be read after the push, since 0.3.120.** Everything above is stderr, and a `PreToolUse` hook's stderr on exit 0 is not shown to the session, so on the success path the gate's verdict scrolled past and was gone. The gate now appends one line to the same run record it reads, as a third kind beside `- tests:` and `- env:`: `- gate: run={id} phase=push verdict={skipped|scoped|full|none} duration={n}s suites="..." reason={token}`. It is a separate kind rather than another `- tests:` line on purpose — those are the reviewer's observed test tiers, and a hook-written verdict in that set would read as a tier it never ran. The line is written only where a lifecycle run owns the push (the branch names a work item, that item's record exists, and it carries a `run=`), so a maintenance push records nothing; a blocked push records nothing either, because its block message already reaches the agent. Every success path also prints one `[test-gate] verdict:` line naming the verdict, the gate's own duration and whether it was recorded. Read the lines back with `${CLAUDE_PLUGIN_ROOT}/hooks/lib/gate-verdicts.sh`, which prints one row per push and one `[gate-verdicts]` summary line last.

**What it runs, once something in the push is code, is a two-way precedence.** By default it runs the full detected suite. Set `Scoped test command:` in `CLAUDE.md` → Test Configuration and a push on a `feature/{ID}-{slug}` branch instead runs that command with `{FILES}` replaced by the test files that item's work can break — resolved by `hooks/lib/test-scope.sh` from the dependency graph: the item, every item that depends on it transitively (`depends_on` holds direct edges only, so the walk is the resolver's), and every item flagged as sharing files with one of those (`shared_risk_notes`). From the graph rather than from the diff, because the diff says what changed and the graph says who can break because of it. **The scoped run is deliberately weaker than CI:** it can miss a regression outside that closure, so `pr-tests.yml` stays the authority and scoping never narrows what CI runs. Anything the resolver cannot resolve — no map, a malformed one, an item with no plan artifact in this checkout, an empty target set, a branch with no item ID — runs the **full** suite and names the reason, because a partial scope is worse than a full one: it passes and looks complete. Leave the line `auto`, `none` or absent and nothing changes. Every push says which branch it took (`[test-gate] precedence:` plus a `Scope:` field on the verdict), so a scoped pass and a full pass are not the same line in the log.
- **`format-on-edit.sh`** (PostToolUse on Write/Edit/MultiEdit): formats the file just written (ruff/black for Python, prettier for JS/TS) if a formatter is installed. Advisory only; it never blocks.
- **`feature-map-guard.sh`** (PostToolUse on Write/Edit/MultiEdit, only for `.claude/feature_map.md`): validates the dependency table against the schema in the plugin's `templates/feature_map.md` (the single source of truth for its columns) and reports every violation with the offending row, the rule, and the consequence. This is the one artifact whose corruption is silent — a blank `depends_on` instead of `[]` makes a blocked item look ready, `scaffold: true` instead of `✅` disables the scaffold-first gate project-wide, a `branch` cell missing its `feature/{ID}-` prefix stops the auto-Done transition, an unescaped `|` in a title shifts every later cell — and each of those still renders as a perfectly fine table. `/sync-project` and `/deliver` run the same validator (`${CLAUDE_PLUGIN_ROOT}/hooks/lib/feature-map-validate.sh <path>`, exit 0 valid / 1 violations / 2 could not check) on the file they just wrote and refuse to continue on failure; the hook covers every other write, including your own hand edits. Advisory only; it never blocks. **The commands that only read the table check it too, at Load Context**: `/plan-feature`, `/plan-features`, `/build-feature`, `/build-features`, `/fix`, `/revise-feature` and `/deliver` re-run the validator before they trust a map they did not just write, and warn once without blocking — `/deliver` stops instead, because an unattended run has nobody to read the warning. A structural finding (`header:` or `schema-block:`, a map that predates the schema and lacks its scaffolding) names one heal command, `hooks/lib/feature-map-repair.sh`, which preserves every existing cell; a row finding is yours to fix, because nothing may guess at your data. No map at all is silent, which is the normal state under `local` work items. Run it yourself after editing rows by hand.
- **`rule-drift-check.sh`** (SessionStart): at every session start, compares the first-line `materialized-from` stamps of the seven always-on standards in this repo's `.claude/rules/` against the installed plugin version. On any stale, unstamped, or missing copy it injects a `[rule-drift]` warning into the session context naming the affected files, the heal path (`/upgrade-project`), and the heal's one precondition: it writes into `.claude/`, which an unattended session cannot get approved, so a refused write stops rather than being retried or worked around. Advisory only; it never blocks a session and stays silent on repos that have not run `/init-project` yet.
- **`session-stats.sh`** (SessionStart): persists the session's `session_id` and `transcript_path` from the hook input into `.claude/artifacts/run/session.json` (the hook input is the only reliable source for the transcript location; nothing reconstructs the path by hand) and appends the same record to `sessions.jsonl`. Both hold machine-local values (a session ID and an absolute path on your machine), so `.claude/artifacts/run/` is gitignored by this repo's `.gitignore` and the hook additionally writes a self-ignoring `.gitignore` (`*`) into that directory on first use — nothing in there is ever committable, whatever you `git add`. That guard lives in `hooks/lib/run-dir.sh` and is shared with `stats-collect.sh`, which writes its error log into the same directory, and with `/refactor` and `/generate-tests`, which use it for the scope-named statistics unit a run on a scope rather than a work item records under (`.claude/artifacts/refactor-backend/` and the like): one mechanism, so the three callers can never disagree about whether a directory is safe to write into, and none of them writes there at all when it cannot be made self-ignoring. A **work-item** artifact directory (`.claude/artifacts/{ID}/`) is committed branch content, so it never gets the `*` treatment; every command that creates one creates it through the same helper's narrow entry point, `ensure_stats_dir`, whose `.gitignore` names exactly `stats.jsonl`, `stats_summary.json`, `stats_summary.md` and itself — never `*`, never overwriting one the project already put there — so `plan.md`, `shared_risks.md`, `review_scope.md` and `review_scope_artifacts.md` stay committable while an item whose artifact directory is not yet on the branch no longer trips the command's own clean-tree pre-flight. This repo's own `.gitignore` carries the same three files as per-file globs (`.claude/artifacts/*/stats.jsonl`, `.claude/artifacts/*/stats_summary.json`, `.claude/artifacts/*/stats_summary.md`), never the directory, so a work item's plan and review-scope manifests stay committable while its statistics cannot be staged at all: **statistics artifacts are never committed to a feature branch** (`.claude/rules/work_items.md` Section 9). That is a CI rule rather than a tidiness one — a statistics file pushed to a branch with an open PR fires `pull_request: synchronize` and runs the full matrix for a measurement that changed no executable line, and a `paths-ignore` filter cannot suppress it because a pull request's changed-file list is a three-dot diff. Autonomous runs push through the GitHub API, which does not honour `.gitignore`, so `/deliver` filters those paths out of the item push and publishes each item's summary to the **default** branch as `.claude/artifacts/run/reports/{ID}-stats_summary.{json,md}` instead — read a finished autonomous run's raw per-item figures from there, not from the feature branch. The repo-level globs above only reach a repository that has run `/init-project` since 0.3.69, so the directory-level `.gitignore` the helper writes is the half that also protects a repository initialized before then: since 0.3.83 all eight commands that create a work-item unit — `/plan-feature`, `/build-feature`, `/fix`, `/revise-feature`, `/security-fix`, `/refactor`, `/generate-tests` and `/deliver` — go through `ensure_stats_dir`, and none of them uses a bare `mkdir -p` any more. Half of the per-step run statistics; advisory only, inert on pre-init repos and when `CLAUDE.md` → Statistics is `DISABLED`.
- **`stats-collect.sh`** (Stop and SessionEnd, also runnable standalone): the other half of the run statistics. It buckets the transcript's token usage, observed model and tools-per-turn into the step windows the lifecycle skills append to `.claude/artifacts/{ID}/stats.jsonl`, aggregates subagent transcripts (attributed to work items by the item ID in the agent prompt, and since MDF-089 only to a unit whose step windows overlap the dispatch's own turns in time — an incidental mention of a finished item's ID in a later dispatch's prompt no longer claims that unit; a dispatch no eligible unit claims is counted as unattributed rather than spread) both into those windows and as **one row per dispatch** — each row carrying the agent's `role` (planner, builder, reviewer), read since MDF-106 from the harness's own `attributionAgent` stamp on the dispatch's transcript (the dispatch tool_use's `subagent_type`), with `dispatch_totals.count_by_role` summing them and a transcript with no resolvable stamp counted as `unresolved` rather than guessed — records the skill-load source, and writes `.claude/artifacts/{ID}/stats_summary.json` and `.md` (a per-step table: wall time, turns, tool calls, tools-per-turn, largest parallel batch, output tokens, average/max context tokens, cache hit ratio, observed model, the read/edit/exec turn split, and flags). One item's `stats.jsonl` accumulates the markers of every run on that item — `/plan-feature`, `/build-feature` and `/deliver`, the rework commands `/revise-feature` and `/fix`, and the standalone `/refactor`, `/generate-tests` and `/security-fix` — so step windows are keyed by `(run, run_id, step)` and the summary carries **one table per run**, each with its own wall time (its last step end minus its first step start; idle time between two commands belongs to neither). `run` names the command and `run_id` names the invocation (the per-run id every marker carries since MDF-098), so two runs of the *same* command on one item are two tables rather than one table whose durations span both; a table heading gains the id — `## Run: build-feature (20260731T142230Z)` — only when a unit holds more than one run of that command, and markers with no `run_id` (pre-fix files) tabulate exactly as before. That is how a review round or a small fix shows up as its own measured cost next to the build it followed, instead of being invisible. Turns are counted per assistant `message.id`, not per transcript line: the transcript writes one line per content block, so a parallel batch of N tool calls is one turn with N tools. Four properties are load-bearing, because this file is the measuring device every performance claim is graded against: the `model` is **observed** from the transcript and a marker that disagrees is flagged rather than believed; tools-per-turn is split by turn class, since only read turns can batch freely; a step or dispatch is flagged when a turn ran close to the context window of the model that served it; and per-dispatch rows exist because a step window mixes a dispatch's turns with the dispatching session's. It computes **no cost**, deliberately: per-token prices depend on commercial terms the framework cannot know, so it records tokens and wall time (ADR 0004). Because the marker file is written by a model rather than by a hook — the dispatching session, which brackets each subagent dispatch and writes every marker itself since 0.3.49 (MDF-062) — the reader also repairs the two schema mistakes that have actually been made and reports both instead of absorbing them: a marker with no `run` is attributed to the run bracketing it in time rather than to a synthesised second run, and an event written under `phase` or `marker` is read as an alias rather than dropped (MDF-064, MDF-065). The three report channels differ on purpose — `**Degraded:**` means a figure is absent or untrustworthy, `**Marker schema:**` means the input was malformed and the collector recovered, so the figures stand and the marker *writer* is what needs fixing, and `**Collector failed:**` means the table is not that run's measurement at all — and a run whose step set is known incomplete gets no `wall` and no `steps sum` at all, since a total over a partial step set reads as a measurement while being wrong. **Fail-soft by contract:** a missing or unrecognized transcript is reported as ABSENT metrics with a `**Degraded:**` line naming the cause (durations still come from the markers) and the hook always exits 0; it never blocks or fails a run, and it never writes zero where it means "unknown". It also never rewrites a recorded summary whose marker input has not changed, so a finished item's recorded numbers survive later sessions — and, since MDF-089, that guarantee is content-gated rather than transcript-gated: each summary carries a `source_digest` of the `stats.jsonl` it was computed from, an existing summary is replaced only when the digest recomputed from disk differs, and mtime is consulted only for pre-digest summaries (strictly newer). A digest survives what mtime does not — a fresh clone or branch checkout sets every file's mtime to the checkout moment — so a discarded summary stays discarded: `git checkout --` restores the exact bytes the recorded digest was computed from, and the next collection skips the unit instead of resurrecting the change. **Fail-soft is not fail-invisible, though, and the collector reports its own crashes (MDF-075):** its parser runs as an embedded Python heredoc, and when that raises, nothing is rewritten — so the *previous* collection's summary stays on disk and reads as this run's numbers. The shell wrapper is the only part that survives such a crash, so it reads the parser's exit status, captures stderr to `.claude/artifacts/run/stats_collect_error.log`, appends one `**Collector failed:**` line to every `stats_summary.md` that exists at the time, and writes a `stats_collect_failed.json` sentinel beside it for a machine reader (bash-written, because the Python that would have amended `stats_summary.json` is what died). The next successful collection names that failure under `**Degraded:**`, records it in `collector_health.prior_failure`, and removes the sentinel. As an independent backstop it also reports a summary whose `generated_at` predates the newest step marker of a run **that summary already covered**: that is the signature of a collection which never ran **at all**, which is what a killed end-of-session hook looks like and why the lifecycle skills run the collector in-session too. The "already covered" scoping matters, because without it every ordinary lifecycle trips the check — `/plan-feature`'s summary is necessarily older than `/build-feature`'s markers — and a `**Degraded:**` line that fires on healthy runs trains a reader to skip the one annotation that must never be skipped. That benign shape stays machine-readable in `collector_health.stale_summary_replaced` as `case: "superseded_by_new_run"` and deliberately never reaches the prose; a replaced summary that names no run of its own cannot be scoped and is reported conservatively. **One other thing produces that same observation, and the line tells you which:** if the run collected more than **once**, its second collection replaces its own first, and nothing was lost. The collector compares the replaced summary's recorded `transcript` against the one it is reading — the same file means the same session — so a double collection is reported as `case: "recollected_same_session"` with a line naming the extra call, stating that the figures on the page are complete, and telling you the fix is in the caller: **one collection per run, at that run's Summary**, is the contract. The killed-hook wording is reserved for a replaced summary written by a different session or by none this collector can name, so a `**Degraded:**` line saying "skipped or killed" means what it says. **A table carrying a `**Collector failed:**` line is not a measurement of the run that produced it** — report `Stats: unavailable` instead. Nothing is written to stdout on any path, since a `Stop` hook's stdout can perturb the very run a measurement is grading. Configure via the `## Statistics` block in `CLAUDE.md` (feature on/off, marker granularity, token collection on/off, and the context threshold whose crossing is flagged); because end-of-session hooks can be killed on cloud surfaces, the lifecycle skills also run the collector at their Summary step. **Since plugin 0.3.117 a unit's figures also stop where its runs do (MDF-092):** a main-session turn enters a unit's `totals`, `outside_steps` and `skill_load` only when its timestamp falls inside that unit's **run span** — `[earliest start marker, latest end marker]` across all of its runs — so a session that carries on working after a run has ended no longer inflates that run's recorded cost with whatever came next, and two runs of identical work record the same numbers however long the session continued. Turns *between* two windows but inside the span are the run's own unmarked gaps and still count; a unit whose last window is still open is not bounded at the top, because its runs have not ended; and the turns that fall outside every run are counted and named on their own line (`totals.turns_outside_runs`) rather than dropped in silence. **Since plugin 0.3.121 the context threshold is model-relative (MDF-144):** it was one constant, default 200000 — the long-context *pricing tier* boundary, never a model limit and never a framework invention — applied to every turn whatever served it, so it fired on every healthy run of the 1M-window models while being the exact wall for the two commands pinned to a 200K one. `Statistics context threshold: auto` (the default, and what an absent line means) flags a turn whose context exceeded **80% of the published window of the model the transcript shows served it**; the window table lives in the hook and carries the date it was checked; and a model the table has no row for is **never flagged and is named in the summary instead**, because a guessed window would read as a measurement while being wrong. An explicit number is still honoured as a fixed ceiling for every model, and `none` still disables the flag. `ctx_tokens_max` is untouched either way, so no figure a trend comparison reads moved.

These turn "the prompt says run tests" into an enforced gate. Both scripts are stack-agnostic; for the test gate, prefer setting `Test gate command:` in `CLAUDE.md` → Test Configuration over editing the script's detection block.

> **Scope of the gates.** `branch-guard` and `test-gate` are `PreToolUse` hooks on `Bash` **and** on the GitHub MCP push tools (`push_files`, `create_or_update_file`, `delete_file`), so both push paths are gated: shell `git` (assisted mode) and MCP pushes (autonomous mode). A push made through some other, unmatched API path would not pass through them; in normal runs the agents use exactly these two paths, so the gates fire. Treat them as a strong in-session guard, and keep the CI checks (PR tests, auto-Done branch match) as the backstop. Note: the MCP matcher keys on the server name `github`; if you register the Git MCP under a different name, mirror it in the plugin manifest or keep the standard name.
>
> **What that leaves uncovered, concretely.** A `PreToolUse` hook only ever sees a tool call, so these gates do **not** see and cannot block: the **VS Code UI's Sync / Publish Branch** buttons (or any other IDE or Git client acting on your working copy), a `git` command you type in a terminal the session did not open, or any **server-side** merge or push — a PR merged in the web UI, a merge queue, a force-push through the provider's API, a CI job pushing to the default branch. So `branch-guard` is not protection of your default branch, and nothing in the plugin can make it into that: the only mechanism that covers the paths above is **server-side branch protection on the remote**, a repository setting no hook can reach. If your default branch is unprotected, a feature branch can land on it without a PR, a review, or a green check, and no gate here will have fired. `hooks/branch-guard.sh`'s own header states the same limit; the two must never disagree.
>
> **So `/sync-project` recommends one, and it never applies one without your explicit approval.** Its Section P reads your default branch's protection on every run, in both project modes, and where the branch is unprotected it proposes a ruleset: require a pull request (the only way onto the branch — a direct push is rejected), leave approving reviews optional (0 required — anyone can review, no review blocks a merge), dismiss stale approvals on new commits, require the `pr-tests` status check (plus the Aikido check when Security Scanning is on — the same required-status-check setting the [security scanning guide](https://github.com/bemayker/mayker-dev-plugin/blob/main/docs/security-scanning.md) describes, carried by one ruleset rather than two unrelated rules), block force-push and deletion, and restrict bypass to repository admins **plus the `github-actions` bot**. That last clause is not decoration: under Work Item Source `local` or `hybrid` the auto-Done pipeline pushes the work-item file flip straight to the default branch, so a ruleset without it silently leaves merged items in their pre-merge status (see [Notes & edge cases → When auto-Done fails after a merge](#when-auto-done-fails-after-a-merge)). It requires `pr-tests` only once that check has actually **reported** on a real pull request in your repository — a requirement pointed at a check that never reports blocks every merge forever — so a brand-new repo gets the rest of the ruleset now and the check requirement on the next `/sync-project`. **The review count stays at 0 for a reason, and raising it is a real trade in autonomous mode:** requiring an approving review makes an unattended `/deliver` merge impossible by design, since the run cannot approve its own PR and will leave every item green and unmerged. That is presented as a choice rather than decided for you — require a review and merge by hand, or leave reviews optional and keep `/deliver` autonomous.

### Per-Command Model Pinning

| Command | Model | Rationale |
| --- | --- | --- |
| `/init-project` | sonnet | Interactive setup, part 1: generates the files you fill in |
| `/sync-project` | sonnet | Interactive setup, part 2, and the repeatable half: reasoning over the backlog and its dependencies |
| `/upgrade-project` | sonnet | Migration detection and targeted edits to materialized files |
| `/plan-feature` | fable | Architecture and planning, strongest model |
| `/build-feature` | opus | Implementation quality and fewer turns per phase |
| `/plan-features` | fable | The plan batch: same work as `/plan-feature`, N items |
| `/build-features` | opus | The build batch: same work as `/build-feature`, N items |
| `/revise-feature` | opus | Targeted fixes on reviewed code |
| `/watch-pr` | sonnet | CI watch and failure diagnosis after a push |
| `/refactor` | haiku | Mechanical, low-risk cleanup |
| `/generate-tests` | haiku | Mechanical test generation |
| `/diagnose` | sonnet | Reasoning over code to find real defects |
| `/fix` | opus | Condensed plan+build for one work item |
| `/security-scan` | sonnet | Local Aikido scan and finding triage |
| `/security-fix` | sonnet | Autonomous remediation of Aikido findings on the PR branch |
| `/deliver` | opus | Whole-backlog orchestration: scheduling, verdicts, merge calls |

Adjust the `model:` field in the plugin's `commands/*.md` (these files live in the `mayker-dev` plugin, not in this repo), then cut a new plugin version.

**Which routes apply a pin, and which silently do not.** A frontmatter `model:` key is a **turn-scoped override applied on one route only**. Measured on Claude Code 2.1.227 by starting a session on a different model and reading `message.model` out of the transcript on each route, never by reading the frontmatter:

| How the procedure is entered | Pin applied? | What actually runs |
| --- | --- | --- |
| `/mayker-dev:build-feature`, typed by a human or passed to `claude -p` (the bare `/build-feature` spelling is interactive-only and is not resolved by `claude -p`) | **Yes** | the pinned model, until your next message; then the session model resumes |
| `Skill(mayker-dev:build-feature)` — the `Skill` tool, including the description-based auto-load | **No** | the session model, for the whole procedure |
| A subagent dispatch (`planner`, `builder`, `reviewer`, `orchestrator`) | **Yes**, from `agents/*.md` — **unless the dispatch call passes a `model` argument, which outranks it** | that agent's pinned model, on either route above; the argument's model when one is passed |

Three consequences worth planning around:

- **A pin does not span a human gate.** It holds until your next message, so in an assisted `/build-feature` the first turn is pinned and everything after the first approval or answer runs on the session model.
- **A surface that auto-loads the skill is unpinned.** Claude Code on the web, Routines, and any caller that reaches the procedure through its description rather than its slash command get no pin at all. Where a tier matters, enter through the slash command — or set the session model (`/model`, `claude --model`) so the whole run is on one tier.
- **The tiers the framework relies on for quality are the subagent pins, and those are route-independent.** Planning runs on Fable and implementation/review on Opus in every route, because each is a dispatch carrying its own pin. A command pin only ever covers the dispatching session's own steps. **Route-independent is not unconditional**, though: a `model` argument on the dispatch call itself outranks the definition's pin, which is the one way those tiers can be lost silently — see the Subagents table above.

The per-step **observed** model in `.claude/artifacts/{ID}/stats_summary.md` is the only place that answers "which model ran": a step marker's `model` field is the framework's declaration of intent, and the collector flags the two disagreeing rather than believing the marker. **Since plugin 0.3.116 a marker declares one only for a step that brackets a subagent dispatch**, where the value is that agent's route-independent `agents/*.md` pin. A step the dispatching session ran itself carries no `model` at all: a command pin reaches one route only, no session can read the model it is itself running on, and writing the pin there produced a `model!=marker` flag on every unpinned route — which is a marker-writer defect, not an expected flag, and suppressing a working detector by explaining it away is the direction that is never taken (MDF-135).

**Cost impact of the plan/build tiers (plugin 0.3.34).** The planning tier runs on Fable and the implementation and review tier on Opus, one model class above the Sonnet default each carried before. Both of those are the `planner` and `builder`/`reviewer` **subagent** pins, so they hold however the run was entered; the command pins in the table above cover the dispatching session's own steps and only on the slash-command route, so a run started through the `Skill` tool spends those steps on the session model. Per-token prices are commercial terms this framework does not know and never assumes (ADR 0004), so the honest statement is directional: **per-run token cost rises**, and the size of the rise is whatever the per-step statistics measure on your project. Read it from `.claude/artifacts/{ID}/stats_summary.md`, whose per-step table carries the **observed** model beside that step's token classes and cache hit ratio, and compare a run before the change against a run after it. `/deliver` deliberately stays on Opus: every scheduling, approval and merge judgement in an autonomous run is delegated to the `orchestrator` subagent (Fable), and the session itself executes those verdicts rather than making them.

### `/init-project [existing | new]`

**Run locally, once per project.** Part one of setup: it writes the files you fill in, then stops. Do not run in unattended surfaces.

What it does:
1. Generates `CLAUDE.md` from the plugin template, stamped with the resolved Project Mode and its `Worktrees:` default
2. Generates `.claude/settings.json` (permissions block only when absent), and `GH_HOST` for a GitHub Enterprise host
3. Materializes the seven always-on standards into `.claude/rules/`, each with a `materialized-from` version stamp
4. Vendors the feature-map validator and its schema source into `.claude/scripts/`, stamped the same way, so this repo's CI can check its own dependency graph
5. Appends the framework `.gitignore` entries (append-only; it never reorders or deletes a line you own)
6. Names every `CLAUDE.md` section you still have to complete, and points you at `/sync-project`

**Re-running it on an initialized repo is a no-op** on `CLAUDE.md` and `.claude/settings.json`, by design. The command you re-run as the project moves is `/sync-project`; after a `claude plugin update` it is `/upgrade-project`.

### `/sync-project`

**Run locally, as often as the tracker or the codebase moves.** Part two of setup, and the repeatable half. Interactive: it stops for your approval at the status mapping, the import and the dependency graph. Do not run in unattended surfaces.

What it does:
1. Verifies MCP connections (`claude mcp list`), and stops if `CLAUDE.md` still holds placeholders
2. Sets up tracker status mapping
3. Imports features from the issue tracker, and gives each one a Feature ID
4. Analyzes dependencies (direct `depends_on` per feature, no waves)
5. Identifies the scaffold feature (first to be built)
6. Generates the flat `feature_map.md`, `project_state.json`, CI pipelines, documentation
7. Derives `Test gate command:` when it is missing or `auto`, and re-derives the Backing Services block every time
8. Checks your default branch's server-side protection and, where it is unprotected, proposes a ruleset — applied only on your explicit approval, and never altered where protection already exists (see [Scope of the gates](#hooks) above for the ruleset and the one autonomous-mode trade)

Running it twice on an unchanged repo is a clean no-op, and it only ever rewrites content it discovered — never a section you filled in by hand.

> **Feature IDs, and the one thing this command writes outside your repo.** Every branch, every `feature_map.md` row and the auto-Done match are keyed on a Feature ID. If your tracker gives items a human-readable key of its own (Jira `PROJ-14`, Linear `ENG-22`, ClickUp with custom task IDs enabled) that key **is** the Feature ID and nothing is ever written back. If it does not — plain ClickUp is the usual case — the framework assigns `FEAT-1`, `FEAT-2`, … and then **writes that ID onto the tracker item itself**, so it survives a regenerated `project_state.json` and you can quote it in a comment. It goes into a short-text custom field named `Feature ID`, `Framework ID` or `Mayker ID` if your project has one, and into a `FEAT-2: ` title prefix if it does not, because no tracker MCP can create a field. Two guarantees bound that write. The import's approval prompt tells you **how many** items it will write and **which carrier** it will use before writing anything, so declining is a normal answer. And the second is unconditional: **An unattended run never writes a framework ID onto a tracker item: it reports how many items would be written and by which carrier, and continues.** So `/deliver` on a fresh repo leaves your tracker untouched, and one `/sync-project` closes the gap. The registry in `.claude/project_state.json` records `id_source` and `id_carrier` per item, which is how a re-run knows what is already there.

> **The PR and the work item link to each other, and both links come out of that same import.** The registry also records each item's canonical `url`, taken verbatim from the field the tracker's own response carries it in rather than built from a URL template, so every PR the framework opens starts its body with one `Work item: {ID} — {url}` line and every item gets one comment carrying its PR's URL. `local` items use `docs/issues/{ID}.md` and a `pr:` frontmatter field instead, and call nothing. Two properties are worth knowing. **Neither link costs an extra call at PR time** — the URL is already in state. And **a repo synced by an older version has no `url` recorded, which is silent by design**: no line, no comment, no warning, until the next `/sync-project` fills it in. The comment is deduplicated on the **PR URL**, so a re-plan, a resumed run or a body update never posts a second one, while a `/refactor` or `/generate-tests` PR opened against the same item does get its own. Nothing GitHub-specific is used for either direction (no `Closes #`), because the framework supports GitLab and Bitbucket too, and a tracker's native Git integration is never relied on: where you have one installed, the framework's comment is simply mildly redundant. The sync report's `Item URLs: {U} of {N}` line is the one place you can see whether the URL was actually captured.

### `/plan-feature {FEATURE_ID}`

**Dispatch as an autonomous session, one per feature.** Delegates architecture to the `planner` subagent.

1. Checks dependencies (all must be Done)
2. Fetches feature details from MCP
3. Creates feature branch
4. Detects if this is the scaffold feature and includes infrastructure setup in the plan
5. Generates architect plan with file manifest, API contracts, testing strategy
6. Creates a draft PR with the plan
7. Updates tracker status to Plan Review

When re-planning (dispatched again for a feature with an existing plan): reads PR review comments via Git provider MCP and revises the plan to address the feedback.

### `/build-feature {FEATURE_ID}`

**Dispatch as an autonomous session, one per feature.** Requires an approved plan. Delegates implementation to the `builder` subagent and self-review to the read-only `reviewer` subagent.

1. Verifies feature is "Ready for Build" and plan exists
2. Scaffolds project infrastructure (if scaffold feature)
3. Implements frontend, backend, and/or API integration (as specified by the plan)
4. Generates and runs unit + integration tests
5. Generates E2E test specs and smoke-runs this feature's own spec(s) once locally (headless, one fix cycle; skippable only via `CLAUDE.md` → Test Configuration → E2E → `Local smoke run`, never silently — the full matrix is executed by CI)
6. Self-reviews against coding and security standards
7. Runs refactor gate (if enabled)
8. Generates UAT artifacts (if enabled)
9. Updates README and DEVELOPMENT.md if infrastructure was created
10. Pushes; the PR stays the draft `/plan-feature` opened, and the pipeline starts on that push
11. Watches the PR's CI checks to completion and fixes failures (the `watch-pr` skill, bounded by `CLAUDE.md` → Autonomy → CI fix attempts, default 3); the summary reports the final check status, never leaving red checks unnoticed
12. Only once the checks are green: updates the PR title and description, converts the PR to ready-for-review, and updates the tracker status to In Review — so the Slack announcement and the tracker never describe a pipeline that is still running. If the checks stay red through the fix budget, the PR is left in draft and the item stays In Progress, with the failure report as the summary's headline; re-dispatch `/build-feature {FEATURE_ID}` once the cause is fixed and it completes the handover

### Batch dispatch: `/plan-features` + `/build-features`

**`/plan-features {ID ID ... | ready}`** and **`/build-features {ID ID ... | ready}`** move several work items through one phase from a single session. They are the two commands above, run per item, and nothing else: same subagents, same gates, same artifacts, same PRs.

- **Selection.** Name the IDs, or pass `ready` to take everything the graph allows: for a plan batch, items whose dependencies are Done and that have no plan yet; for a build batch, items a human has moved to **Ready for Build**. Anything that fails a gate is **refused with a reason** (which dependency, which scaffold item, which status) and the rest of the batch still runs.
- **Isolation.** Each item gets its own git worktree at `.claude/worktrees/{ID}`, whatever the `Worktrees` toggle says — concurrent items cannot share a checkout. Your primary checkout is untouched. If worktrees are unavailable, the batch runs the items serially in the primary checkout and says so.
- **Concurrency.** Up to `CLAUDE.md` → Autonomy → **Max parallel items** (default 3) in flight; the rest queue. In a build batch, two items whose plan File Manifests overlap (or whose `shared_risk_notes` flag each other) are **serialized**, and both PRs carry the merge order to use. Overlap is judged on each manifest as a whole file set: entries carry the build phase that produces them, but that attribution only feeds the per-phase dispatches inside one item, so two items collide whenever their whole-feature file sets do — never phase against phase — they still branch from the default branch, so the second needs a rebase after the first merges.
- **CI.** In a build batch the watches are interleaved: every round polls each in-flight PR once, so the run is not M sequential 45-minute waits. Each item's fix budget and handover decision are its own — one item going red leaves the others untouched.
- **The gates are yours, unchanged.** A plan batch ends at N draft plan PRs (`Plan Review`); you approve item by item. A build batch ends at N PRs handed over for review (`In Review`); you review and merge. No plan is self-approved and nothing is merged — bulk delivery *with* those is `/deliver`, and only `/deliver`.
- **Report.** Per item: branch, worktree, PR, verdicts, plus the refused, serialized, and failed blocks. Re-dispatching the same batch resumes every item idempotently and redoes nothing.

### `/revise-feature {FEATURE_ID}`

**Dispatch as an autonomous session.** For applying PR review feedback.

1. Reads PR review comments via Git provider MCP
2. Applies targeted fixes (via the `builder` subagent)
3. Re-runs affected tests
4. Pushes updates (PR auto-updates)
5. Watches the PR's checks back to green (the same bounded CI watch as `/build-feature`) before signalling that the PR is ready for another look
6. Does not change tracker status (feature stays In Review), and never converts a PR the build left in draft

### `/watch-pr [{FEATURE_ID | PR number}]`

**Runs automatically inside `/build-feature`, `/revise-feature`, and `/fix`, after their push and before they hand the PR over; dispatch standalone after any other push that triggers checks (for example a re-plan).**

1. Resolves the open PR (from the argument, or the current branch)
2. Polls the checks with adaptive backoff (the waiting policy), up to 45 minutes per push
3. On failure: pulls the failing job's log, classifies flake/infra versus real, fixes real failures via the `builder` (never deletes, skips, or weakens a test), re-pushes, re-watches
4. Bounded by `CLAUDE.md` → Autonomy → CI fix attempts (default 3); never merges, never changes tracker status, and never converts a PR out of draft (its result is what decides whether the calling skill hands the PR over); on exhaustion reports the red checks with logs and attempted fixes

### `/refactor frontend|backend|{FEATURE_ID} [--no-watch]`

**Dispatch as a session or run locally.** Standalone code quality improvement.

1. Scans target files against the refactoring checklist
2. Applies RECOMMENDED improvements, writes the refactoring report, and commits both in **one** `refactor:` commit — so the report ships in the cleanup PR beside the change it describes, instead of staying untracked in your working tree (where it also made the next `/refactor` or `/generate-tests` run stop at its own clean-tree pre-flight). The scope-mode report is `.claude/artifacts/refactor_{scope}_{date}.md`; a feature-scoped one is `.claude/artifacts/{FEATURE_ID}/refactor_report.md`
3. Verifies tests still pass (a failing suite reverts that commit, report included: there is no surviving cleanup left to document)
4. Opens the PR as a **draft**, watches its CI checks (the `watch-pr` skill, bounded by `CI fix attempts`), and converts it to ready for review only once they are green. A cleanup still red after the budget is left as a draft with the failure report as the summary's headline — a behaviour-preserving refactor whose suite is red is the one thing it claimed not to be. `--no-watch` opens the PR ready for review without watching; the summary says so

### `/generate-tests {scope} [--tier unit|integration|e2e|all] [--no-watch]`

**Dispatch as a session or run locally.** Standalone test generation.

Supported scopes: `backend`, `frontend`, a feature ID, or a file/directory path.

1. Analyzes source files to determine which test tiers are warranted
2. Generates tests following testing standards and `CLAUDE.md` Test Configuration paths
3. Runs unit + integration tests locally, plus a bounded smoke run of the generated E2E specs (the full matrix runs in CI)
4. Opens the PR as a **draft**, watches its CI checks (the `watch-pr` skill, bounded by `CI fix attempts`), and converts it to ready for review only once they are green. CI is the first full execution of the generated specs, so this is where a spec that only fails in the pipeline surfaces; still red after the budget leaves the PR a draft with the failure report as the summary's headline. `--no-watch` opens the PR ready for review without watching; the summary says so

### `/diagnose {scope}` and `/fix {ID | description}`

- `/diagnose {scope}`: scans existing code for bugs, performance issues, and risky patterns, writing each finding as a local work item under `docs/issues/`. Analysis only.
- `/fix {ID | description}`: a condensed plan+build for one work item that keeps the self-review, test, and refactor gates but skips the separate plan-review PR. Its PR is opened as a draft and only converted to ready for review, with the item moved to In Review, once the CI watch is green. It promotes to `/plan-feature` if the change turns out large or architectural.
- `/security-scan {scope}`: runs an Aikido scan locally (no git repo or CI required) and reports findings, optionally writing them as `docs/issues/` items for `/fix`. Analysis only. See [Security scanning (Aikido)](#security-scanning-aikido).
- `/security-fix [findings-file]`: the autonomous remediation counterpart to `/security-scan`. Reads Aikido's PR-diff findings and fixes each one at or above the threshold on the current PR branch, keeping the test and self-review gates. Normally dispatched by the `aikido-autofix.yml` workflow; never weakens or ignores the scan to pass.

### `/deliver [IDs]`

**Autonomous mode only** (`CLAUDE.md` → `Autonomy: autonomous`; the command hard-stops otherwise). One unattended session drives the whole backlog to Done; see [Autonomous mode](#autonomous-mode-deliver) for the full model.

1. Verifies the autonomy gate and the GitHub MCP (hard-required, no `gh` fallback)
2. Initializes the project non-interactively if `/init-project` and `/sync-project` never ran (choices logged to `DECISIONS.md`)
3. Ingests the backlog and builds the dependency graph (the `orchestrator` subagent)
4. Schedules continuously: ready items dispatch in parallel (up to Max parallel items), scaffold first and alone, file-overlap conflicts serialized
5. Per item: plan (planner) → self-approve → build + tests (builder, own worktree) → self-review (reviewer) → refactor gate → re-check the files that gate added, if it added a source or test file (reviewer) → push + draft PR via the GitHub MCP → poll CI → fix failures → convert the PR to ready for review and set In Review once green → address review comments → merge on the framework's own verdict → verify Done → unblock dependents
6. Ends with a run report (`.claude/artifacts/run/report.md`), the decision logs, and any blocked items listed

Optional arguments scope the run to specific item IDs (plus their unfinished dependencies).

---

## Dispatching Sessions

**Primary surface: Claude Code on the web (or `claude --remote`).** Connect the repo, then start one session per feature with the command as the prompt (e.g. `/plan-feature US-101`). Each session runs in its own isolated cloud VM, clones the repo (so it needs the committed `CLAUDE.md`, `.claude/`, and `.mcp.json`), and opens a PR. Fire several in parallel for independent features (in autonomous mode a single `/deliver` session replaces all of these).

**One session, several items.** The alternative to N sessions is one batch session: `/plan-features US-101 US-102 US-103` or `/build-features ready`. It isolates each item in its own worktree and runs up to `Max parallel items` concurrently, so one dispatch produces one PR per item (see [Batch dispatch](#batch-dispatch-plan-features--build-features)). Independent sessions still parallelize further and survive each other's failures; a batch keeps the whole selection, its refusals, and its serializations in one report. Both keep every human gate.

**Other surfaces (optional):**

- **Routines**: saved prompt + repo + connectors, triggered on a schedule / webhook / API call, fully unattended. The natural home for "when a feature moves to Ready for Build, auto-run `/build-feature`." Skills committed in the repo load automatically in a Routine. Do **not** run `/init-project` here (it is interactive).
- **GitHub Actions** (`anthropics/claude-code-action`): autonomous PR review/fixes on comment or cron triggers. A good home for `/revise-feature` and review edges, alongside the auto-Done pipeline.
- **Headless `claude -p`**: orchestrate dispatch from your own infrastructure. **On an unattended surface, name the command in its namespaced form, `/mayker-dev:<command>`:** the bare `/<command>` spelling resolves only in an interactive session, and `claude -p` answers an unknown command by printing `Unknown command` and exiting **0**, so an unattended caller must check the output for the run's own report header and never the exit code alone.

All commands except the two setup commands, `/init-project` and `/sync-project`, are designed to run unattended. Interactive checkpoints exist only in those two (all of them in `/sync-project`). In autonomous mode there is exactly **one** session to dispatch: `/deliver` on any of these surfaces (Claude Code on the web, a Routine, headless `claude -p`), and it never needs a second dispatch to finish the backlog.

**Interrupted or auth-stopped sessions: re-dispatch the same command.** Every pipeline command verifies tracker authentication with a functional read before mutating anything; if the tracker MCP is unauthenticated (e.g. an expired ClickUp OAuth), the run stops once with an actionable message ("run `/mcp`, authenticate, then re-dispatch") instead of waiting mid-command. Re-dispatching is always safe: runs are idempotent-resumable — an existing branch, plan, commit, PR, or already-set status is reused, never redone, and the summary lists the sections skipped as already done.

---

## Autonomous mode (`/deliver`)

With `CLAUDE.md` → `Autonomy: autonomous`, the per-item loop above collapses into a single unattended run governed by `.claude/rules/autonomy.md`. The comparison:

| | Assisted (default) | Autonomous |
| --- | --- | --- |
| Unit of dispatch | one session per item, or one batch session for a selection (`/plan-features`, `/build-features`) — you decide what runs | one `/deliver` session for the whole backlog |
| Plan approval | human reviews the draft plan PR, sets Ready for Build | self-approved against the standards and acceptance criteria, logged |
| Implementation review | human reviews and merges the PR | framework polls CI, fixes failures, answers comments, merges on green |
| Scheduling | you follow `feature_map.md` by hand | dependency-graph scheduler, parallel independent items, dependents start on merge |
| Remote git | Git provider MCP, degrades to `gh` CLI | GitHub MCP **only** (no CLI fallback; the run stops at setup if it is missing) |
| Quality gates | test gate, branch guard, self-review, refactor gate | identical, plus the same gates enforced on MCP pushes |

**One-time setup (the only manual step).** Fill in `CLAUDE.md` (tech stack, MCP configuration, test configuration) and the Architecture Notes, set `Autonomy: autonomous` in the `## Autonomy` section, connect the GitHub MCP (and the tracker MCP for `tracker`/`hybrid` source), commit, push. `/init-project` and `/sync-project` are optional: a first `/deliver` performs both halves non-interactively and records its choices in `DECISIONS.md`.

**Autonomy settings** (`CLAUDE.md` → Autonomy): `Max parallel items` (concurrency cap, default 3 — also the cap for the assisted `/plan-features` and `/build-features` batches), `Merge method` (`squash`/`merge`/`rebase`), `CI fix attempts` (bounded diagnose-fix-push cycles per PR, default 3, also the assisted CI watch's budget), `Repository creation` (`allowed`/`primary-only`), `Default organization` (org for new repos, default `bemayker`).

**Decision authority and the audit trail.** The framework infers intent instead of asking: underspecified details are resolved from the item, `CLAUDE.md`, and the code, and every non-trivial decision is logged with a rationale to `.claude/artifacts/{ID}/decisions.md` (per item) and `DECISIONS.md` (cross-cutting). The single escalation: a genuinely **irreversible and ambiguous** action (destructive production migration, secret rotation) is not performed; the PR is left green but unmerged and reported. Everything else is decided and executed.

**Repositories.** Work lands on `feature/{ID}-{slug}` branches of this repo by default. An item that is a genuinely separately-deployable service gets its own repository under the configured organization (created and initialized via the GitHub MCP, recorded in `project_state.json` → `repositories`); ambiguous cases stay branches here.

**Blocked items and resuming.** An item that exhausts its retry budgets is left as an open PR and reported; the run continues past it. Re-running `/deliver` resumes blocked and in-flight items from ground truth (statuses, open PRs, artifacts) and picks up new backlog items, never redoing merged work.

**Governance.** `/deliver` refuses to run unless the committed `CLAUDE.md` says `Autonomy: autonomous`, so enabling autonomy is itself a reviewed change. Autonomy removes the human gates only; no quality gate, test, or standard is weakened, and the framework never merges red or disables a failing check.

---

## Development Workflow

### Phase 0: Project Setup (once)

1. Add the two MCP connections with `claude mcp add --scope project ...` and verify with `claude mcp list`
2. Run `/init-project` in a local interactive Claude Code session; it generates `CLAUDE.md` and stops
3. Fill in the generated `CLAUDE.md` (project description, tech stack, MCP names, test configuration)
4. Run `/sync-project` and follow the wizard to map statuses, import features, and approve the dependency graph
5. Review generated files, then **commit and push everything to the repo** (cloud sessions clone these files)
6. Add required repository secrets for CI (see Prerequisites)

### Phase 1: Planning

1. Look at `feature_map.md`, identify the scaffold feature (marked ✅) and the items with `depends_on: []`
2. **Dispatch the scaffold feature first:** `/plan-feature {SCAFFOLD_ID}`
3. Review the scaffold plan PR; it should include infrastructure setup
4. For plans that need changes: leave PR comments, re-dispatch `/plan-feature` for that feature
5. For approved plans: move the feature to "Ready for Build" in your tracker
6. After the scaffold feature is built and merged, dispatch `/plan-feature` for every feature whose dependencies are Done
7. Review plan PRs, approve in tracker when ready

### Phase 2: Implementation

1. Dispatch one session per approved feature, each running `/build-feature {FEATURE_ID}`
2. Each session implements the plan, runs tests, and creates a ready-for-review PR
3. **Review implementation PRs**: standard code review
4. For PRs that need changes: leave review comments, dispatch `/revise-feature {FEATURE_ID}`
5. For approved PRs: merge to main → CI auto-transitions to Done

### Phase 3: Follow the graph

1. Every merge satisfies dependencies: any feature whose `depends_on` are now all Done is ready
2. Return to Phase 1 for the newly-ready features
3. Repeat until the backlog is empty

### Parallel Execution

- Independent features (no dependency between them, directly or transitively) can be planned and built simultaneously by separate sessions, or by one batch session (`/plan-features`, `/build-features`, up to `Max parallel items` at a time)
- Each feature runs on its own branch, with no conflicts between parallel sessions
- With `CLAUDE.md` → **Worktrees: per-feature** each also runs in its own git worktree at `.claude/worktrees/{ID}`, so two sessions never share a checkout (see [Worktrees](#worktrees) below); a batch does this regardless of the toggle
- The `shared_risk_notes` column in `feature_map.md` flags potential file conflicts between independent features; sequence those rather than running them concurrently
- A feature should NOT run while any of its `depends_on` is not Done (the dependency gate blocks it anyway)

### Adding work after initial setup

**Tracker source.** When new features are added to the tracker after the initial setup:

1. Re-run `/sync-project` locally. It detects existing features and adds new ones.
2. The dependency graph is regenerated. Existing features are preserved.
3. Commit and push the updated `feature_map.md` and `project_state.json`.
4. Dispatch sessions for the new features once their dependencies are Done (or let the next `/deliver` run pick them up in autonomous mode).

**Local or hybrid source.** No re-init is needed per item. Create a `docs/issues/{ID}.md` (or let `/fix "describe it"` create one), then run `/fix {ID}` for a small change, or `/plan-feature {ID}` → `/build-feature {ID}` for a larger one. Local items carry their own `branch` and `depends_on` in frontmatter, so the pipeline resolves them without `feature_map.md`. Repeat whenever new work appears.

---

## Feature Map

`.claude/feature_map.md` is a flat dependency table, the local source of truth for:

- **Dependencies:** Which features block which other features (`depends_on`, direct only)
- **Branch names:** Consistent naming for feature branches (prefix `feature/`)
- **Scaffold flag:** Which feature sets up project infrastructure
- **Shared risks:** Flags for potential merge conflicts between independent features
- **Test checkpoint:** Which features' merge is a boundary worth running the whole suite at

Readiness is computed from the graph (an item is ready when all its `depends_on` are Done, `.claude/rules/work_items.md` Section 7); there is no wave grouping. Agents read this file to check dependencies. They then verify actual status via MCP.

**`test_checkpoint` is the one authored column that is not about dependencies.** The pre-push gate runs a *scoped* suite on a feature branch and CI runs everything against one PR at a time, so nothing ever runs the whole suite against a locally integrated `main`. Put a `✅` on the row whose merge closes a group of work and the full suite (`CLAUDE.md` → `Full suite command:`, falling back to `Test gate command:`) runs once at that point: reported and non-blocking in `/build-feature` and `/build-features`, blocking in `/deliver`, which admits no newly unblocked item after a red one. **Any number of rows may carry it**, unlike `scaffold`, and `/sync-project` proposes candidates (sinks, and items that unblock three or more others) for you to accept or amend. Leave every cell empty and nothing runs — a project with no meaningful boundary is a legitimate answer.

The column set is defined once, in the plugin's `templates/feature_map.md` → `## Schema`, which every generator materializes verbatim; the `## Schema` block stays in the generated file as its own documentation. Because a corrupt row still renders as a valid table, the schema is enforced rather than merely documented — validate it any time you edit rows by hand:

```bash
bash .claude/scripts/feature-map-validate.sh .claude/feature_map.md
```

Exit 0 is a pass; exit 1 names each offending row, the rule it breaks, and what silently breaks downstream; exit 2 means the validator could not run. The `feature-map-guard` hook runs it for you after any write to the file (advisory, never blocks).

> **You do not have to remember to run it, and that is the point.** Editing rows by hand is a supported path, and an instruction to validate afterwards is exactly the kind a busy afternoon skips. So the check also runs in CI: the `feature-map` job in `.github/workflows/pr-tests.yml` runs the same validator on every pull request and fails the required `pr-tests` check on a corrupt graph. It uses `.claude/scripts/`, the copy `/init-project` vendored into this repository, rather than `${CLAUDE_PLUGIN_ROOT}` — the plugin installs under `~/.claude/`, which no CI runner has, which is why the pair is in the repo and committed. Both files carry a `materialized-from` version stamp and `/upgrade-project` refreshes them; do not hand-edit either.


---

## Testing

Testing is integrated into the build pipeline at multiple layers.

| Layer | Generated in | Executed in | Blocks merge? |
| --- | --- | --- | --- |
| Unit tests | `/build-feature` | During build (+ test-gate hook on push) + CI on PR | Yes |
| Integration tests | `/build-feature` | During build + CI on PR | Yes (if enabled) |
| E2E tests | `/build-feature` | CI on PR | Depends on toggle |
| UAT Gherkin | `/build-feature` | CI on merge to main | Yes (if enabled) |
| UAT manual script | `/build-feature` | Human tester | No (reference only) |
| Full-suite checkpoint | — (runs the project's own suite) | Once, after an item flagged `test_checkpoint` in `feature_map.md` merges | No in `/build-feature` and `/build-features` (reported); in `/deliver` a red one admits no further item |

Test directory paths and naming conventions are configured in `CLAUDE.md` → Test Configuration. Toggle configuration is in `CLAUDE.md` → Feature Toggles.

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

**Which tier covers which acceptance criterion is a decision the plan records.** Every acceptance criterion is covered by an executed test at the **cheapest tier that can cover it**: a criterion warrants E2E only when verifying it requires navigation or interaction through the UI, and one that does not is covered at integration or unit level instead. The plan's `## Testing Strategy` carries a `### Criterion coverage` table with one row per criterion, the tier that covers it, and a one-line reason wherever that tier is not E2E, and `/build-feature`'s E2E phase generates specs for exactly the criteria that table assigns to E2E. So a validation-only criterion is verified at the tier that can verify it in milliseconds instead of in a browser, and no criterion loses its test: read the table when you want to know where a criterion is covered, and treat a criterion missing from it as a plan defect.

**`Parallel workers` under Test Configuration → E2E is the one E2E setting that changes wall time.** Specs are independent by convention, so they may run in parallel; this field is what exercises that. An integer is substituted into *your* configured E2E command as the runner's own worker option (`--workers=4` for Playwright, `-n 4` for a pytest-xdist browser suite) both in the build's local smoke run and in the CI E2E step, so the two agree by construction. `auto`, the default, leaves the runner's own default in place, and a runner with no worker option should keep `auto` rather than be given a flag that fails the step — the framework never picks the flag for you, because it does not know your runner.

**Backing services for the integration and E2E tiers are declared there too**, under Test Configuration → Backing Services: the start command, readiness check, port lookup, connection string and teardown command, parameterized by work item ID so two items building at once cannot collide on a container name or a host port. `/sync-project` fills them from the real stack, and re-derives them on every run. A build's first dispatch that needs a service brings it up from that recipe and records what it resolved in `.claude/artifacts/run/handover/{ID}-run.md` as an `- env:` line, stamped with the run's id; every later dispatch of the same run connects to what **that run** recorded instead of inspecting `docker-compose.yml`, and the run's Summary tears its own set down once. The record is keyed by work item and shared by every lifecycle run on it, so the id is what keeps a second run from connecting to the first run's torn-down container. **The pre-push `test-gate` hook reads the same record** and exports each service's connection variables before running `Test gate command:`, which is what stops the deterministic gate blocking a push over a port only the dispatches knew about. **Keep the block current as the project grows** — it is maintained, not filled in once. When a feature needs a service the block does not describe, or a recipe has gone stale (a bumped image, a renamed service, a changed credential), the build does not fail and does not fall back to per-dispatch guessing: the dispatch that hits it works the recipe out **once**, records it in the `- env:` line with `derived=yes`, and the run summary reports it as a declaration gap under `Environment:`. That report is your cue to fix it at the source — re-run `/sync-project` (which re-derives this block, unlike `Test gate command:`, which it preserves) or edit the lines by hand. A gap you ignore is re-derived once per run, forever. No build phase edits `CLAUDE.md` for you, deliberately: it is committed content, so a phase commit carrying it would change that phase's reviewed file set. The one exception is the scaffold feature's Phase 0S, which reconciles the block against the `docker-compose.yml` it writes in the same commit.

**The application runtime is a different block and a different lifetime**, under Test Configuration → `Handover rebuild:` and `Handover health check:`. Backing Services is the *test* environment: services a build phase provisions and the run's Summary tears down. The handover rebuild is the *application* stack a tester is pointed at. At the moment the framework says the work is testable — `/build-feature` Section 19, `/deliver` 6.7 step 5, `/fix` Section 10, `/revise-feature` Section 9 step 3 — it runs `docker compose up -d --build` where a compose file sits at the repo root, waits for the containers to come up, and writes into the PR description the commit SHA the image was built from. Before that existed, Docker assets were created once at scaffold and nothing ever rebuilt them, so a tester could work through the whole UAT script against an image that predates the feature and a stale PASS looked exactly like a real one. Three properties are worth knowing: a project with no compose file **says** it skipped rather than skipping silently; a failed build or an unhealthy stack is reported in the PR and the run summary and **never blocks the handover**; and the rebuilt stack is deliberately **not** an `- env:` line, so the teardown above never reaches it and it is still running when you go to test. Set `Handover rebuild: off` to switch it off, and put your own probe (an HTTP health route, say) in `Handover health check:` if container state is not the answer for your stack.

---

## CI/CD

> **GitHub is the reference implementation.** The plugin ships lint-checked workflow templates for GitHub only (`pr-tests.yml`, `auto-done.yml`, `notify-slack.yml`, and the optional `security-scan.yml` and `aikido-autofix.yml`) that `/sync-project` copies in and adapts. For GitLab and Bitbucket there is no shipped template: `/sync-project` generates `.gitlab-ci.yml` / `bitbucket-pipelines.yml` (including the security-scan job) from the GitHub templates as the reference to port. The pipeline behaviour described below is identical across providers; only GitHub has a canonical file to diff against today.


### PR Pipeline

Triggers on PR open and push (`opened`, `synchronize`, `reopened` — deliberately **not** the draft → ready conversion; the workflow file's own header says why):
- A first `changes` job works out whether **this push** changed code
- Runs unit tests, in their own job
- Runs integration tests (if enabled), in their own job
- Runs E2E tests (if enabled), in their own job, at the worker count from `CLAUDE.md` → Test Configuration → E2E → `Parallel workers`
- Validates `.claude/feature_map.md`, in its own job (`feature-map`)
- Reports one aggregate status check, `pr-tests`

> **The `feature-map` job is not a test tier, and its three differences are deliberate.** It runs `.claude/scripts/feature-map-validate.sh` — the copy `/init-project` vendored into this repo, because the plugin itself lives under `~/.claude/` where no CI runner can reach it — against `.claude/feature_map.md`. **It ignores the `changes` gate**, since a map edit with no code change is exactly the push it exists to catch and `.claude/…` counts as non-code there. **It has no feature toggle** and is not removed when a test tier is disabled. And **it is inside the `pr-tests` aggregate**, so a corrupt dependency graph fails the check your branch rule requires rather than one beside it. The job is a clean pass in a repository with no `.claude/feature_map.md`; where the map exists but the vendored validator is missing or incomplete it **fails**, because a check that cannot validate must never report green — run `/upgrade-project` in a local session to re-vendor it and commit `.claude/scripts/`.

> **Protect your default branch on the `pr-tests` check, not on a tier.** The three tiers run as concurrent jobs and each can legitimately skip, and **a required check whose job skips stays pending, which blocks the merge forever**. So the pipeline ends in one aggregate job that always runs and always reports — success when every tier passed or skipped, failure when any tier failed — and **the check to require on the default branch is the aggregate**, whose name is exactly `pr-tests`. Requiring `unit`, `e2e` or any other individual job instead is the mistake that deadlocks every PR in the repository.

> **Documentation and planning pushes run no tests, and no path filter is involved.** The `changes` job diffs the push itself (`before`..`after` on a push to an existing PR, the PR's diff when it is opened) and skips every tier when nothing outside `docs/`, `.claude/` and `*.md` changed — which is what stops a plan PR, or a push carrying only run statistics, from running the whole matrix. It is not a `paths-ignore:` filter, on purpose: GitHub matches those against the PR's *whole* diff rather than the push, so they cannot suppress that case, and they would leave the required check pending as well. Anything the gate cannot resolve (a force-push, a git failure) runs every tier.

> **Dependency and browser downloads are cached, behind a presence gate.** Each job detects which dependency files exist before restoring anything, because a cache configured with nothing to hash fails the run outright — which is the state a brand-new repository is in. The E2E browser download is cached separately and keyed on the test framework's version, since it is the larger of the two and changes far less often.

### Merge Pipeline

Triggers when PR is merged to main:
- Extracts feature ID from branch name (`feature/{FEATURE_ID}-*`)
- Reads `.claude/project_state.json` for the feature's `external_id` and the `done` status name
- Calls the tracker's REST API to transition the feature to Done (using the repository secret)
- Validates UAT Gherkin scenarios are well-formed (if enabled)

> **Work-item source routing:** the merge pipeline decides what to update from `work_item_source` in `.claude/project_state.json`, not from which files exist. Under `local` it does not call a tracker API at all — it sets `status: done` in `docs/issues/{ID}.md` and commits that back to the default branch (a `[skip ci]` commit), so no tracker API key or secret is needed. Under `tracker` it only transitions the tracker item. Under `hybrid` an item registered in `project_state.json` → `features` is tracker-resident, so the pipeline transitions that (authoritative) twin **and** flips a `docs/issues/{ID}.md` shadow copy if one exists; an unregistered ID is local-only and just gets the file flip. See `.claude/rules/work_items.md`.

> **UAT step:** validates that each `e2e/uat/scenarios/*.feature` file is well-formed Gherkin; it does not run them as browser tests, and is a clean no-op when UAT is off. See [Notes & edge cases → Why UAT is validated, not executed](#why-uat-is-validated-not-executed).

> **Branch prefix:** the auto-Done pipeline matches the `feature/{FEATURE_ID}-{slug}` branch name, which `branch-guard.sh` hard-enforces in-session. See [Notes & edge cases → Branch prefix and auto-Done](#branch-prefix-and-auto-done) if you dispatch with a different prefix.

### Required Secrets

> See [Prerequisites → Repository Secrets](#3-repository-secrets-for-cicd) above for exact names and setup instructions.

### Security scanning (Aikido)

Security scanning is optional, controlled by the **Security Scanning** toggle in `CLAUDE.md` → Feature Toggles (`ENABLED` blocks on findings, `OPTIONAL` reports without blocking, `DISABLED` skips it). It uses [Aikido](https://www.aikido.dev/), which scans for vulnerable dependencies (SCA), exposed secrets, IaC issues, SAST, malware, and license risks. There are four approaches:

- **Native PR gating (recommended):** enable it from the Aikido dashboard. Aikido scans the PR diff on its own infrastructure and posts a check, with no workflow file and no CI minutes.
- **CI release gate:** the `security-scan.yml` workflow `/sync-project` adds, which runs the Aikido local scanner on the default branch (needs the `AIKIDO_API_KEY` repository secret).
- **Local, no repo or CI required:** run `/security-scan` to scan the working directory with the same local scanner.
- **Auto-remediation (optional, opt-in):** the `aikido-autofix.yml` workflow `/sync-project` adds. On each PR it runs the local scanner report-only and, if there are findings at or above the threshold, dispatches Claude (with this plugin installed) to run `/security-fix`, which fixes them on the PR branch and pushes. It does **not** gate — native PR gating stays the merge block — and is enabled per repo via the `AIKIDO_AUTOFIX` repository Variable. Needs `AIKIDO_API_KEY` plus a Claude auth secret (`ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN`).

The default policy blocks on newly introduced findings at or above High severity; because Aikido compares the branch diff, a pre-existing backlog does not block new work.

**Full setup (creating the Aikido account, retrieving the token, the dashboard click-paths, and branch protection) is in the plugin's [security scanning guide](https://github.com/bemayker/mayker-dev-plugin/blob/main/docs/security-scanning.md).** Policy and triage live in the plugin's `security_standards.md`; act on a finding with `/fix {ID}`.

---

## Configuring the Framework

### For a New Project

1. Create a repo from `mayker-dev-template` and open it in Claude Code. It prompts you to install the `mayker-dev` plugin (the template commits the marketplace bootstrap), so approve that once.
2. Add MCP connections (`claude mcp add --scope project ...`); skip the tracker if Work Item Source is `local`.
3. Run `/init-project`. It generates `CLAUDE.md` and the `.claude/settings.json` permissions from the plugin, then stops so you can fill in `CLAUDE.md` (project description, tech stack, test config, MCP names). The generated file defaults to `Source: tracker`; if you want `local` work items, set `Source: local` now, before running `/sync-project`.
4. Run `/sync-project` to finish: for `tracker` source it maps statuses, imports work items, builds the dependency graph, and generates CI and docs. For `local` source there is no tracker import, so you manage work as files under `docs/issues/` (the incremental flow); CI and the auto-Done file-flip are still generated.
5. Commit and push all generated files.
6. Add repository secrets (see Prerequisites).
7. Build and merge the scaffold feature first, then dispatch every item whose dependencies are Done (or set `Autonomy: autonomous` and dispatch `/deliver` once instead of steps 5 to 7).

### What NOT to Edit

The commands, skills, subagents, and hooks are provided by the `mayker-dev` plugin, not files in this repo, so there is nothing to edit here. `.claude/rules/*.md` is materialized from the plugin by `/init-project` and is overwritten on every run, so do not hand-edit it: change a standard in the plugin and re-materialize.

`.claude/settings.json` is generated by `/init-project` from the plugin, but its allow/deny lists and autonomy posture are then yours to tune. To change pipeline behaviour, a gate script, or a standard, edit the plugin rather than editing files in this repo.

## Framework distribution and modes

### Distribution

The framework ships as the `mayker-dev` plugin (private `mayker` marketplace). The plugin owns commands, skills, agents, hooks, and the rule standards; this repo owns configuration only. Update with `claude plugin update mayker-dev@mayker`.

### Updating the framework in this repo

The plugin updates independently of your project, and several files in this repo are things the plugin *materialized* here rather than files it owns at runtime — the always-on standards under `.claude/rules/`, `CLAUDE.md`, `.gitignore`, `.claude/settings.json`, the CI workflows, `.claude/feature_map.md`, `.claude/project_state.json` and these docs. **A plugin update refreshes none of them.** To pull a new plugin version into this repo:

1. `claude plugin marketplace update mayker`, then `claude plugin update mayker-dev@mayker`. The catalog pins `mayker-dev` to a release tag, so the plugin update on its own reads a cached catalog and finds nothing newer: refresh the catalog first, or you stay on the version you already have with no error to tell you so.
2. Run `/upgrade-project --dry-run` locally, read the report, then run `/upgrade-project`. It re-materializes the seven always-on rules into `.claude/rules/` (each stamped with the generating plugin version), then applies the plugin's migration ledger: one **targeted edit** per outstanding change, so your customized CI workflows and your own `CLAUDE.md` content survive. Anything it will not do automatically is reported as `MANUAL` with the exact text and the command to inspect, and it never prompts, so it is also safe in a Routine or a GitHub Action. **One caveat there, and it is about writes rather than prompts:** re-materializing the rules writes into `.claude/`, and an unattended session (Routine, GitHub Action, headless `claude -p`) has those writes auto-declined by Claude Code itself — above `.claude/settings.json`, above `--allowedTools`, above any hook, so no permission setting turns it on. A repo whose rules are already current is unaffected; a **stale** one stops and tells you to re-run `/upgrade-project` locally and approve the writes, rather than reporting an upgrade it did not perform. Run it locally after a plugin update and the question never arises.
3. Review the diff, then commit and push so cloud sessions pick up the new standards.
4. **Read the report's closing line.** `/upgrade-project` covers what no re-run heals. `.claude/project_state.json` and these docs are regenerated by a `/sync-project` re-run instead, and an absent `.claude/settings.json` or a missing `.gitignore` entry by an `/init-project` re-run — that re-run only ever **adds what is absent**, so a `permissions` block you already have is never rewritten and a change to the shipped one reaches you through the ledger instead — and the report tells you when they predate the installed plugin. The two commands are complementary; a clean migration list is not the same claim as "fully current".
   - **The boundary is per artifact, not per file, and `CLAUDE.md` is the one file on both sides of it.** A full re-run also re-derives `CLAUDE.md` → Test Configuration → **Backing Services** in full, and fills a **`Test gate command:`** that is missing, a placeholder, or `auto`. Those two blocks therefore never get a migration entry, so a clean migration list says nothing about them — which is exactly the case where a `/upgrade-project` report alone would leave you believing your `CLAUDE.md` is current. Every *other* field in `CLAUDE.md` does reach you through the ledger.

There is one heal path. The narrower `/init-project refresh-rules` sub-run, which did exactly one thing (the seven rules), was retired in plugin 0.3.84: `/upgrade-project` runs that same re-materialization as its first step and then covers the rest.

If you skip step 2, you are not silently stuck about the rules at least: every pipeline command compares the `materialized-from` stamps in `.claude/rules/` against the installed plugin version at start, and on a mismatch warns, uses the plugin's current standards for that session, and points at the heal path. Nothing warns you about the other artifacts, which is what the migration ledger is for. Never hand-edit `.claude/rules/*.md`: those copies are overwritten on every re-materialization.

To refuse a migration deliberately, add it to `.claude/project_state.json` → `framework.declined` as `{ "id": "...", "reason": "..." }`. No command writes that list; it is yours, and it is the only way to silence a `MANUAL` item permanently.

### Project mode

- `new`: the original flow. `sync-project` imports the backlog, builds the dependency graph, recommends a scaffold feature, and generates CI.
- `existing`: `sync-project` discovers the codebase (stack, layout, test setup, conventions) into `CLAUDE.md`, skips scaffolding and CI generation, and never overwrites host config. Plan, build, and refactor follow `existing_codebase.md`: match existing patterns, scope review and coverage to the diff, and never restructure existing code as part of a change.

### Work item source

- `tracker`: features and status live in the issue tracker via MCP (default).
- `local`: work items are markdown files under `docs/issues/` (schema in `work_items.md`). No tracker MCP required; status lives in each file's frontmatter and is set to done when the PR merges.
- `hybrid`: tracker items resolve from the tracker, everything else from `docs/issues/`.

### Autonomy

- `assisted` (default): the human-gated loop documented throughout this guide, plan review and PR merge are yours.
- `autonomous`: `/deliver` drives the whole backlog per `.claude/rules/autonomy.md`; see [Autonomous mode](#autonomous-mode-deliver). Combines freely with either Project Mode and any Work Item Source (the GitHub MCP becomes hard-required).

### Worktrees

`CLAUDE.md` → **Worktrees** decides where `/plan-feature`, `/build-feature`, `/revise-feature` and `/fix` do their work (full rules: `.claude/rules/workflow_triggers.md` Section 4.1). `/deliver` ignores it and always uses per-item worktrees, and so do the batch commands `/plan-features` and `/build-features`: items running side by side cannot share one checkout.

- `per-feature` (what `/init-project` writes for a new project): the item's work happens in a git worktree at `.claude/worktrees/{ID}`, created by the first command that needs it and reused by the rest. Your primary checkout is never switched to a feature branch, so it stays clean and usable while a build runs, and two items can proceed side by side. The branch guard and the test gate follow the work into the worktree.
- `off` (what `/init-project` writes for an existing codebase): the commands check the feature branch out in the primary working copy. Older projects with no `Worktrees:` line behave this way too.

The directory is gitignored. Removal is yours, since you own the merge: `git worktree remove .claude/worktrees/{ID}` after the PR lands, or `git worktree prune` to clear entries whose directory is already gone. Leaving one in place costs nothing, the item's next command reuses it. Before switching an existing codebase to `per-feature`, check that a fresh worktree carries what your builds need: gitignored env files, local secrets, and generated assets do **not** come along, and installed dependencies (`node_modules/`, virtualenvs) are per-worktree.

---

## Troubleshooting

Common first-run problems and the fix. Deeper, rarer edge cases are in [Notes & edge cases](#notes--edge-cases).

**The plugin did not install when I opened the repo.** The auto-install prompt comes from the committed `.claude/settings.json` (`extraKnownMarketplaces` + `enabledPlugins`). If it did not appear, install by hand: `claude plugin marketplace add bemayker/mayker-marketplace` then `claude plugin install mayker-dev@mayker`. Both repos are private, so you need GitHub read access first.

**The plugin clone asks for credentials or fails to authenticate.** The plugin is fetched over HTTPS through your git credential helper. Run `gh auth login` (or cache a PAT in your credential helper) and retry. No SSH key is needed.

**The GitHub MCP fails to authenticate, or reports "does not support dynamic client registration".** GitHub's MCP endpoint does not support the OAuth flow Claude Code uses. Authenticate with a Personal Access Token in a header instead (see [MCP connections](#1-mcp-connections-mandatory)); do not use the interactive "Authenticate" path for GitHub.

**The issue-tracker MCP shows connected but agents cannot read items.** OAuth trackers (ClickUp, Linear, Jira) need a browser approval: run `/mcp` in a session and complete it, choosing the right workspace. `claude mcp list` showing "connected" means the server is reachable, not that you have authorized it.

**`/init-project` "did nothing", it just told me to fill in `CLAUDE.md`.** That is its whole job, and it is not a first pass of anything: it generates `CLAUDE.md`, `.claude/settings.json`, `.claude/rules/` and the framework `.gitignore` entries, names the sections you must complete, and stops. The command that finishes setup is **`/sync-project`**, and running `/init-project` again on an initialized repo does nothing by design. Both are interactive; do not run either in a cloud or unattended surface.

**A pipeline command stops with "Run /sync-project first".** `.claude/project_state.json` is missing or was never committed. Run `/sync-project` locally (`/init-project` first if the repo has no `CLAUDE.md`), then commit and push the generated `.claude/` files: cloud sessions clone the repo and need them present. (`/diagnose`, `/fix`, `/security-scan`, and `/security-fix` are the commands that do not require `project_state.json`.)

**A cloud session committed on a `claude/...` branch and auto-Done never fired.** The `branch-guard` hook blocks commits on unrecognized branches (such as `claude/*`) in-session, but a branch pushed another way can slip through. Ensure work lands on `feature/{ID}-{slug}`; for recovery see [When auto-Done fails after a merge](#when-auto-done-fails-after-a-merge).

**A cloud run stopped to ask for a permission.** The allow-list in `.claude/settings.json` is missing a tool the run needed, often an `mcp__<server>__*` entry. `/sync-project` syncs the MCP allow-list to your `.mcp.json`; if you added a server later, re-run it (or add the entry by hand). Never store secrets in `.claude/settings.json`.

---

## Notes & edge cases

Deeper rationale and edge cases pulled out of the happy path above. You do not need these for a normal run.

### Slack notifications (opt-in)

If `/sync-project` generated the PR notification pipeline (`notify-slack.yml`, section 6.3 of that skill), it is opt-in and off by default. It runs in CI, so it fires reliably where an in-session Stop hook would be killed first. Enabling it takes three steps, all required: (1) add a repository **Variable** `NOTIFY_SLACK` = `true` (Variables tab, not Secrets); (2) add a repository **Secret** `SLACK_WEBHOOK_URL` with a Slack Incoming Webhook URL (Secrets tab; the Incoming Webhooks app must be permitted in your workspace); (3) push the workflow file from a **local** CLI, since workflow files need a token with the `workflow` scope that cloud-session tokens lack. Verify without a PR via the Actions tab -> "Notify Slack on PR" -> "Run workflow" (the `workflow_dispatch` trigger posts a test message). The job always runs and its log states why it did or did not post; a missing toggle or secret is reported as a notice/warning, **not** a failed check, so a half-finished setup never shows as a red X.

**What the messages say, and why nothing in them is asserted.** Each message carries a headline plus the context it could actually read: the work item ID (parsed from the branch the same way the auto-Done pipeline parses it), the lifecycle phase, the branch, the CI result for the PR head, and the item's **live** tracker status. The merge message says "Merged and marked Done" only when the tracker really does read the mapped Done status by the time it is read; when it does not, the message names the status that is actually there, and when the tracker cannot be read at all the message says only "Merged". That is deliberate: auto-Done is a **separate** workflow on the same merge event, it can fail or be skipped for a missing secret, and a Slack channel claiming a status change that never happened is worse than one that says less. For the same reason a draft PR is announced as "Plan draft ready" only when it carries the `plan-review` label a plan PR gets — a `/fix` or `/deliver` build PR is a draft too — and a fact the workflow could not read is left out of the message rather than guessed. Reading the tracker status reuses the tracker secret above; with no secret, no `.claude/project_state.json`, or `Work Item Source: local`, the message simply omits the status and the job log says which of those it was. None of those misses turns the check red.

### Why UAT is validated, not executed

The `.feature` files under `e2e/uat/scenarios/` are acceptance-criteria artifacts and have no Cucumber/BDD step definitions, so they are not executable by `playwright test` (the executable browser checks are the `*.spec.ts` E2E specs, run by the PR Test pipeline). The merge pipeline therefore **validates** that each scenario is well-formed Gherkin rather than driving a browser. Do not point `npx playwright test` at `e2e/uat`: Playwright's `testDir` is the E2E spec directory, finds no tests there, and exits 1 ("No tests found"). The step is guarded on the presence of `e2e/uat/scenarios/*.feature`, so it is a clean no-op when UAT generation is off. Want truly executable UAT? Add a BDD runner (e.g. `playwright-bdd`) and generate step definitions next to the `.feature` files.

### Branch prefix and auto-Done

The auto-Done pipeline runs in CI, not in Claude Code, so it uses the tracker REST API (not MCP). It matches the `feature/{FEATURE_ID}-{slug}` branch name. The `/plan-feature` and `/build-feature` skills set this branch name, and the `branch-guard.sh` hook hard-enforces it in-session by blocking commits/pushes on an unrecognized branch (it allows `feature/*` plus the `refactor/*` and `test/*` prefixes the standalone commands use, and the base branches), even when the dispatch surface starts the session on an auto-generated `claude/<slug>` branch (Claude Code on the web and Routines). If you intentionally dispatch with a different prefix, adjust `branch-guard.sh` and align the branch regex in the auto-Done pipeline accordingly.

### When auto-Done fails after a merge

The merge to main is the source of truth, not the tracker transition. If the PR merges but the auto-Done step fails (an expired or missing tracker API key, a tracker outage, or a branch name the regex could not parse), the code is safely on main but the work item is stranded in its previous status (usually In Review). The merge is **not** rolled back and nothing is lost; only the status label is stale. To recover:

1. **Read the failed job log** (Actions tab on GitHub, Pipelines on GitLab/Bitbucket). It states which step failed and why, the same precheck pattern the Slack job uses.
2. **If it was a transient failure or a fixed secret:** re-run the job. On GitHub, Actions -> the failed run -> "Re-run jobs". The transition is idempotent (it sets a status, it does not toggle), so re-running is safe.
3. **If the branch name did not match:** the feature ID could not be parsed from the branch. Set the item to Done by hand in the tracker this once, then ensure future branches use `feature/{FEATURE_ID}-{slug}` (the `branch-guard.sh` hook enforces this in-session; a manually pushed branch can still bypass it).
4. **Local work-item source:** the equivalent failure is the file-flip commit not landing, most often because the default branch is protected and the CI bot is not allowed to push to it. Allow the `github-actions` bot to bypass the branch protection (GitLab/Bitbucket: grant the CI user push access to the protected branch), then re-run the job; or set `status: done` in `docs/issues/{ID}.md` by hand and commit it with `[skip ci]`.
5. **Hybrid source, a green job that only warned:** for a tracker-resident item with a local shadow file, a missing tracker secret is a warning, not a failure — the job flips the file, stays green, and logs `::warning::TRACKER_API_KEY not set`. The authoritative twin is then still at its pre-merge status, so read the job log rather than the check mark: add the secret and re-run the job (or transition the twin by hand). The log line `Marked {ID} done on: …` names exactly which side(s) were updated.

A stale status never blocks merging or building; dependency checks read the tracker (or the local file) live, so once the status is corrected, dependent items proceed normally.

### Hotfixes and rollbacks

The lifecycle (plan → review → build → review → revise → merge → Done) is forward-only by design, but production fixes still fit it without a special mode:

- **Hotfix:** treat it as a normal small work item. Create a `docs/issues/{ID}.md` (or a tracker item), then run `/fix {ID}` on its `feature/{ID}-{slug}` branch. All the build-time gates (self-review, test gate, refactor gate) and the auto-Done flip still apply, so a hotfix is just a fast trip through the same pipeline. If the fix turns out larger than expected, `/fix` will stop and recommend `/plan-feature`.
- **Reverting a merged feature:** open a normal revert PR (`git revert <merge-commit>` on a `feature/{ID}-revert-{slug}` branch, or your provider's "Revert" button followed by renaming the branch to the `feature/` prefix so auto-Done and the gates apply). Record it as its own work item so the revert is tracked and reviewed like any other change rather than force-pushed onto main.
- **What not to do:** do not force-push to main or rewrite merged history (the deny-list in `.claude/settings.json` blocks the common force-push flags for agents: `--force`, `-f`, and `--force-with-lease`; the same discipline applies to humans). Roll forward with a revert or a hotfix instead.

### Merge conflicts between concurrent features

Independent features run on their own `feature/` branches and merge one at a time, so a later branch can fall behind `main` and conflict with what already merged. `build-feature` deliberately does **not** auto-rebase (see Branch Setup: it fetches `main` for reference but never rebases on its own); reconciling against a moved `main` is a human-triggered step.

**What the fetch is read for.** Both `/plan-feature` and `/build-feature` compare the plan's File Manifest against what has landed on `main` since the branch's base, and report a `[merged-since]` notice naming every overlapping file and the commits that changed it. At plan time the plan is adjusted against `main` as it now stands; at build time it is a **flag, not a stop** — the build proceeds, the notice goes in the PR description, and a `replan` verdict recommends re-running `/plan-feature {ID}` before you merge. Nothing is ever rebased, merged or re-scoped for you on the strength of it, and a check that cannot run says so in one `[merged-since] fail-open:` line rather than reporting the plan as current. So a PR carrying that notice is telling you the plan predates part of `main`: read it before approving.

When a feature's PR shows conflicts, or its CI fails only because `main` advanced:

1. **Locally:** `git checkout {branch}`, `git fetch origin main`, then `git rebase origin/main` (or `git merge origin/main` if you prefer a merge commit), resolve conflicts, and push. The branch keeps its `feature/` prefix, so `branch-guard` and `test-gate` still apply and the push re-runs the suite.
2. **Or via the pipeline:** merge `main` into the branch, then dispatch `/revise-feature {ID}` to let the `builder` reconcile the change against what merged.

Use the `shared_risk_notes` column in `feature_map.md` to spot the file overlaps most likely to conflict: review those features' PRs together and merge the lower-risk one first. If two independent features touch the same files heavily, sequence them (merge one, rebase the other) rather than building both blindly in parallel. In autonomous mode the `/deliver` scheduler enforces exactly this: flagged pairs are serialized, and a stale or conflicting PR branch is updated via the GitHub MCP (or merged locally in the item's worktree) before the merge verdict.
