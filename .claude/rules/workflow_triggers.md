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
| `/mayker-dev:revise-feature {ID}` | revise-feature | Apply a revision based on PR review comments |
| `/mayker-dev:refactor frontend\|backend\|{ID}` | refactor | Standalone code-quality scan and refactoring |
| `/mayker-dev:generate-tests {scope} [--tier]` | generate-tests | Generate tests for a work item, module, or scope |
| `/mayker-dev:diagnose {scope}` | diagnose | Scan existing code for bugs, perf, and risks; write local work items |
| `/mayker-dev:fix {ID \| description}` | fix | Condensed plan+build for one work item, keeping the gates |
| `/mayker-dev:security-scan {scope}` | security-scan | Run an Aikido scan locally (no repo or CI required); route findings to `/fix` |
| `/mayker-dev:security-fix [findings-file]` | security-fix | Autonomously remediate Aikido findings on the current PR branch, keeping all quality gates |
| `/mayker-dev:deliver [IDs]` | deliver | Autonomous mode only: drive the whole backlog to Done on the dependency graph, no human gates (`autonomy.md`) |

Follow the invoked skill's instructions exactly.

## 2. Subagents

The plan / build / review split is expressed with dedicated subagents provided by the plugin (`planner`, `builder`, `reviewer`). The skills delegate to them by name:

| Subagent | Role | Permissions |
| --- | --- | --- |
| `planner` | Architect plans (used by `/plan-feature` and `/deliver`) | Read-mostly; writes only plan artifacts under `.claude/artifacts/` |
| `builder` | Implementation + tests (used by `/build-feature`, `/revise-feature`, `/fix`, `/deliver`) | Read/write code, run tests, commit and push |
| `reviewer` | Self-review against `review_standards.md` (used by `/build-feature`, `/fix`, `/deliver`) | Read-only; cannot edit, run, or commit |
| `orchestrator` | Autonomous scheduling and verdicts (used by `/deliver`): dependency graph, readiness, conflict serialization, plan self-approval, merge decisions, run report | Read-mostly; writes only run artifacts and decision logs; spawns nothing (the main session dispatches per its decisions) |

The reviewer is intentionally read-only so it cannot quietly fix what it is meant to critique. It reports findings back; the builder applies the fixes. The orchestrator is likewise decision-only: it cannot write code, push, or merge; the main `/deliver` session executes its verdicts, which keeps the decision record and the actions auditable separately.

## 3. Operational Behaviour

- **No TODO placeholders:** Do not generate code with "TODO: Implement logic" or similar. Write the full implementation.
- **Response format:** Be concise. Use Markdown for all code blocks.
- **MCP:** The issue tracker MCP is required only when Work Item Source is `tracker` or `hybrid`; `local` source needs no tracker (see `work_items.md` and `mcp_integration.md`). The Git provider MCP is used for PRs and degrades to the `gh` CLI. Each skill verifies what it needs at startup.
- **Config required:** The pipeline commands (`/plan-feature`, `/build-feature`, `/revise-feature`, `/refactor`, `/generate-tests`) require `.claude/project_state.json` to exist. If missing, stop: "Run /init-project first to generate .claude/project_state.json." `/diagnose`, `/fix`, `/security-scan`, and `/security-fix` are exceptions and do not require it (see `mcp_integration.md` Section 0); `/init-project` generates it.
- **Autonomy compatible:** All commands except `/init-project` are designed to run autonomously without human interaction during execution. Checkpoints that require human input exist only in `/init-project` (which is run in a local, interactive Claude Code session). Fully unattended surfaces (Routines, GitHub Actions, headless `claude -p`) cannot answer interactive prompts, do not run `/init-project` there.
- **Autonomy mode:** the `CLAUDE.md` → Autonomy toggle selects the operating model. `assisted` (default): humans review plan PRs, set Ready for Build, review and merge implementation PRs, one command per item. `autonomous`: `/deliver` drives the whole backlog per `autonomy.md`, self-approves plans, monitors and fixes CI, handles review comments, and merges by its own verdict; `/deliver` hard-stops unless the toggle reads `autonomous`, so enabling autonomy is a reviewed, committed change. Quality gates are identical in both modes.
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
- **Worktrees (autonomous):** `/deliver` isolates concurrent items in per-item worktrees under `.claude/worktrees/{ID}` (gitignored, removed after merge). Remote operations from any worktree still go through the GitHub MCP only (`mcp_integration.md` Section 7).
