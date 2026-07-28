<!-- materialized-from: mayker-dev v0.3.34; do not edit, regenerate with /init-project refresh-rules -->
<!--
  Universal standard. Imported into CLAUDE.md (always on). Do not edit per project.
  Slash-command mapping, operational behaviour, git conventions.
-->

# Workflow Triggers & Operational Behaviour

## 1. Command Reference

The commands and skills are provided by the `mayker-dev` plugin; they are not files in this repo. Once the plugin is installed, commands are available namespaced as `/mayker-dev:<command>`, and each invokes the matching skill of the same name. The skill holds the full multi-phase procedure and also auto-loads by its description (including in Claude Code on the web and Routines).

| Command | Skill | Purpose |
| --- | --- | --- |
| `/mayker-dev:init-project` | init-project | One-time project setup (local, interactive) |
| `/mayker-dev:plan-feature {ID}` | plan-feature | Generate an architect plan for one work item |
| `/mayker-dev:build-feature {ID}` | build-feature | Implement one work item from an approved plan |
| `/mayker-dev:plan-features {IDs \| ready}` | plan-features | Batch: plan several items at once, one worktree and one draft plan PR each |
| `/mayker-dev:build-features {IDs \| ready}` | build-features | Batch: build several approved items at once, one worktree and one PR each |
| `/mayker-dev:revise-feature {ID}` | revise-feature | Apply a revision based on PR review comments |
| `/mayker-dev:watch-pr [{ID \| PR}]` | watch-pr | Watch a PR's CI checks to completion and fix failures (runs at the tail of build/revise/fix/refactor/generate-tests; standalone after e.g. a re-plan) |
| `/mayker-dev:refactor frontend\|backend\|{ID} [--no-watch]` | refactor | Standalone code-quality scan and refactoring |
| `/mayker-dev:generate-tests {scope} [--tier] [--no-watch]` | generate-tests | Generate tests for a work item, module, or scope |
| `/mayker-dev:diagnose {scope}` | diagnose | Scan existing code for bugs, perf, and risks; write local work items |
| `/mayker-dev:fix {ID \| description}` | fix | Condensed plan+build for one work item, keeping the gates |
| `/mayker-dev:security-scan {scope}` | security-scan | Run an Aikido scan locally (no repo or CI required); route findings to `/fix` |
| `/mayker-dev:security-fix [findings-file]` | security-fix | Autonomously remediate Aikido findings on the current PR branch, keeping all quality gates |
| `/mayker-dev:deliver [IDs]` | deliver | Autonomous mode only: drive the whole backlog to Done on the dependency graph, no human gates (`autonomy.md`) |

Follow the invoked skill's instructions exactly.

**The two batch commands are the single-item ones, N at a time.** `/plan-features` and `/build-features` run the `plan-feature` / `build-feature` procedure per selected item, each item in its own worktree, with every human gate of assisted mode intact: a plan batch ends at draft plan PRs (no plan is self-approved), a build batch ends at PRs handed over for review (nothing is merged). Their shared half — selection and the `ready` selector, refusals, conflict serialization, mandatory worktrees, the round loop, and the report — is defined once in `${CLAUDE_PLUGIN_ROOT}/rules/batch_dispatch.md`, an on-demand standard those two skills read at Load Context. Bulk delivery *with* self-approval and merging remains `/deliver` alone.

## 2. Subagents

The plan / build / review split is expressed with dedicated subagents provided by the plugin (`planner`, `builder`, `reviewer`). The skills delegate to them by name:

| Subagent | Role | Permissions |
| --- | --- | --- |
| `planner` | Architect plans (used by `/plan-feature`, `/plan-features`, `/deliver`) | Read-mostly; writes only plan artifacts under `.claude/artifacts/` |
| `builder` | Implementation + tests, and CI-failure fixes (used by `/build-feature`, `/build-features`, `/revise-feature`, `/fix`, `/watch-pr`, `/deliver`) | Read/write code, run tests, commit and push |
| `reviewer` | Self-review against `review_standards.md`, and in `/build-feature` a second narrowed pass over the UAT and documentation artifacts generated after that review (Phase H, `review_standards.md` Section 6.4) — used by `/build-feature`, `/build-features`, `/fix`, `/deliver` | Read-only; cannot edit, run, or commit |
| `orchestrator` | Autonomous scheduling and verdicts (used by `/deliver`): dependency graph, readiness, conflict serialization, plan self-approval, merge decisions, run report | Read-mostly; writes only run artifacts and decision logs; spawns nothing (the main session dispatches per its decisions) |

The reviewer is intentionally read-only so it cannot quietly fix what it is meant to critique. It reports findings back; the builder applies the fixes. The orchestrator is likewise decision-only: it cannot write code, push, or merge; the main `/deliver` session executes its verdicts, which keeps the decision record and the actions auditable separately.

### 2.1 Coordination timers and polling (the waiting policy)

This section is the single home of the delay policy for waiting on background subagents and external state. Skills and dispatching sessions reference it; never hardcode per-call delay literals in a skill step, a dispatch, or a wakeup prompt.

- **One idempotent fallback wakeup per background dispatch.** When a long-running subagent is dispatched in the background, schedule exactly one fallback wakeup at roughly 2x the expected duration of that phase (estimate from the item's scope, or from per-step statistics of earlier runs when available; never copy a fixed literal between dispatches). **Per dispatch means per dispatch, and a build is many:** each implementation phase is its own `builder` dispatch (build-feature's Phase dispatch note), so one item's build carries roughly six sized wakeups rather than one, and a batch multiplies that by the items in flight. That is the reason the sizing rule is written as an estimate per phase and not as a constant. The wakeup prompt MUST begin with this self-check, verbatim apart from the identifier: "If task {TASK_ID} already reported completion, stop this schedule (ScheduleWakeup stop) and end the turn." A stale wakeup then costs one tool call, never a re-read or re-reasoning of work that already completed.
- **Cancel on notification.** When a task notification arrives (completion or failure), the first action, before reading the result, updating any state, or dispatching the next step, is stopping every outstanding fallback timer that guarded that task. No fallback may outlive the completion it guards.
- **Adaptive polling for external state.** Waiting on state that sends no notification (CI checks, tracker transitions) never uses one long fixed timer sized to the worst case. Poll with short exponential backoff: first poll after 30 seconds, then multiply the delay by 1.5 per poll, capped at 2 minutes between polls. The calling skill sets the overall budget (for CI, 45 minutes per push: deliver Section 6.7 and the watch-pr skill Section 2) and treats exhaustion as failure. This bounds the reaction lag to at most one backoff step, so a settled result is acted on within about 2 minutes, instead of the remainder of a worst-case timer.

## 3. Operational Behaviour

- **No TODO placeholders:** Do not generate code with "TODO: Implement logic" or similar. Write the full implementation.
- **Response format:** Be concise. Use Markdown for all code blocks.
- **MCP:** The issue tracker MCP is required only when Work Item Source is `tracker` or `hybrid`; `local` source needs no tracker (see `work_items.md` and `mcp_integration.md`). The Git provider MCP is used for PRs and degrades to the `gh` CLI. Each skill verifies what it needs at startup — functionally, reusing the working path recorded in `project_state.json` → `git_provider.effective_path` (`mcp_integration.md` Section 5.0).
- **Config required:** The pipeline commands (`/plan-feature`, `/build-feature`, `/plan-features`, `/build-features`, `/revise-feature`, `/refactor`, `/generate-tests`) require `.claude/project_state.json` to exist. If missing, stop: "Run /init-project first to generate .claude/project_state.json." `/diagnose`, `/fix`, `/watch-pr`, `/security-scan`, and `/security-fix` are exceptions and do not require it (see `mcp_integration.md` Section 0); `/init-project` generates it.
- **Autonomy compatible:** All commands except `/init-project` are designed to run autonomously without human interaction during execution. Checkpoints that require human input exist only in `/init-project` (which is run in a local, interactive Claude Code session). Fully unattended surfaces (Routines, GitHub Actions, headless `claude -p`) cannot answer interactive prompts, do not run `/init-project` there.
- **Autonomy mode:** the `CLAUDE.md` → Autonomy toggle selects the operating model. `assisted` (default): humans review plan PRs, set Ready for Build, review and merge implementation PRs; one command per item, or one batch command for several items (`/plan-features`, `/build-features`), which changes how many items a session moves and nothing about who approves. `autonomous`: `/deliver` drives the whole backlog per `autonomy.md`, self-approves plans, monitors and fixes CI, handles review comments, and merges by its own verdict; `/deliver` hard-stops unless the toggle reads `autonomous`, so enabling autonomy is a reviewed, committed change. Quality gates are identical in both modes.
- **Permissions:** Autonomous runs rely on the permission posture in `.claude/settings.json` so agents do not block on approvals. See `docs/DEVELOPMENT.md` → Permissions & Autonomy.

## 4. Git Conventions

- **Branching:** One branch per work item, prefix `feature/`. The branch name is defined in `feature_map.md` (tracker features) or in the work item's frontmatter (local `docs/issues/` items). The standalone `/refactor` and `/generate-tests` commands instead use `refactor/` and `test/` branches respectively (they are not auto-Done work items); the `branch-guard.sh` hook allows these prefixes plus the base branches (`main`/`master`/`develop`) and blocks any other branch.
- **Commits:** Use semantic commit messages:
  - `feat({FEATURE_ID}): ...` for new features
  - `fix({FEATURE_ID}): ...` for bug fixes
  - `refactor({FEATURE_ID}): ...` for code-quality improvements
  - `test({FEATURE_ID}): ...` for test additions
  - `plan({FEATURE_ID}): ...` for architect plans
  - `chore: ...` for maintenance
- **Source of truth:** Git is the master record. Never rely on local IDE history as the final state.
- **Worktrees:** `/deliver` always isolates concurrent items in per-item worktrees under `.claude/worktrees/{ID}` (gitignored, removed after merge); remote operations from any worktree still go through the GitHub MCP only (`mcp_integration.md` Section 7). The assisted batch commands (`/plan-features`, `/build-features`) likewise always isolate, for the same reason. The single-item assisted commands do so when `CLAUDE.md` → Worktrees is `per-feature`, per Section 4.1 below.

### 4.1 Worktrees, the `Worktrees` toggle

`CLAUDE.md` → **Worktrees** decides where the assisted commands do their work. `/plan-feature`, `/build-feature`, `/revise-feature` and `/fix` all read it; `/deliver` ignores it and always uses per-item worktrees (`autonomy.md` Section 6), because parallel items cannot share a checkout. The batch commands `/plan-features` and `/build-features` ignore it for that same reason (`batch_dispatch.md` Section 4), including for a batch of one, so batch behaviour does not change with the size of the selection. Nothing about this is prompt-driven: the toggle is the only input, and a phrase in the user's message never turns it on or off.

- **`off`** — assume this when `CLAUDE.md` is absent or carries no Worktrees line: the command checks the feature branch out in the primary working copy. The original behaviour, unchanged in every detail.
- **`per-feature`** — the item's work happens in a git worktree at `.claude/worktrees/{ID}` (gitignored), created on first use and **reused** by every later command for that item.

Setup procedure, run once per command — once **per item** in a batch — right after the branch name is resolved and before anything is written:

1. Read the toggle. `off` → work in the primary checkout and skip the rest of this section. A batch run and an autonomous run skip this step entirely and always continue with step 2: the toggle does not apply to them.
2. Run `git worktree list --porcelain`. If a worktree is already checked out on `{branch}`, use **that** path, whatever it is named, and skip to step 5. Never create a second worktree for a branch, and never `git checkout` a branch another worktree holds: git refuses, and retrying around that refusal is worse than the problem it signals.
3. Otherwise create it:
   - **Branch exists** (locally or on the remote): `git fetch origin {branch}` when it is remote, then `git worktree add .claude/worktrees/{ID} {branch}`.
   - **Branch does not exist yet** (a fresh `/plan-feature` or `/fix`): `git fetch origin main` then `git worktree add -b {branch} --no-track .claude/worktrees/{ID} origin/main`. `--no-track` is mandatory for the same reason as on `git checkout -B`: the branch must never track `origin/main`, or a "Sync" push lands feature commits on main.
   - **`.claude/worktrees/{ID}` exists as a directory git does not know about** (a worktree removed by hand, or a copy): run `git worktree prune` once and retry. If the directory survives that, **STOP** and report the path. Never delete it: it may hold uncommitted work.
   - **`git worktree` is unavailable** (git older than 2.5) or the add fails for any other reason: fall back to the `off` behaviour for this run and say so in the summary. A missing worktree never blocks the lifecycle.
4. If this run has **already committed** work on the current branch of the primary checkout, finish it there and do not move to a worktree mid-run; note it in the summary. Moving would strand those commits.
5. From here on the worktree is the working directory: `cd` into it once, or prefix each command with `git -C {worktree}`. Read and write the item's files under that path — including `.claude/artifacts/{ID}/`, which is branch content — and run the tests there. The primary checkout keeps whatever branch it was on and is not touched.
6. The upstream assertion (`git branch --set-upstream-to=origin/{branch} {branch}` then `git rev-parse --abbrev-ref {branch}@{upstream}`, MUST print `origin/{branch}`) runs **in the worktree**, unchanged.
7. **Point the statistics collector at the worktree.** The step markers land in the worktree's `.claude/artifacts/{ID}/stats.jsonl`, so the in-session run at each skill's Summary must name it: `bash "${CLAUDE_PLUGIN_ROOT}/hooks/stats-collect.sh" --project {worktree}`. The session's `.claude/artifacts/run/session.json` may only exist in the primary checkout; when it does, pass its `transcript_path` too (`--transcript {path}`), otherwise the collector cannot resolve a transcript and reports the token metrics as ABSENT with a `**Degraded:**` line naming the cause, rather than writing zeros that read like a measurement. Statistics never block a run either way.
8. Report the worktree path in the command's summary, so the developer knows where the code is.

Removal is manual in assisted mode, since the human merges the PR: `git worktree remove .claude/worktrees/{ID}` after the merge (`git worktree prune` clears entries whose directory is already gone). A leftover worktree is harmless, the item's next command reuses it.

The deterministic hooks follow the work rather than the primary checkout: the branch guard judges the branch of the tree the commit or push actually runs in, and the test gate runs the suites in that same tree, on the `git push` path and the GitHub MCP push path alike (`hooks/branch-guard.sh`, `hooks/test-gate.sh`, both via `hooks/lib/worktree-resolve.sh`).
