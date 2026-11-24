<!-- materialized-from: mayker-dev v0.3.522; do not edit, regenerate with /upgrade-project -->
<!--
  Universal standard. Loaded at launch from .claude/rules/ (always on). Do not edit per project.
  Slash-command mapping, operational behaviour, git conventions.
-->

# Workflow Triggers & Operational Behaviour

> **Advice:** a rule here that names no hook, script or tool grant has no check; the reviewer grades it.

> **Not loaded at launch:** Section 2.1 in `${CLAUDE_PLUGIN_ROOT}/rules/workflow_triggers/waiting_policy.md`; Section 4.1 in `${CLAUDE_PLUGIN_ROOT}/rules/workflow_triggers/worktrees.md`; Sections 5.3 to 5.8 in `${CLAUDE_PLUGIN_ROOT}/rules/workflow_triggers/bash_shape.md` (the mayker-dev plugin). Read the named file before you apply or cite one of those sections.

> **Rules here, reasons there:** the full text behind these rules, with their measurements and history, is in `${CLAUDE_PLUGIN_ROOT}/rules/workflow_triggers/full_text.md` (Sections 1 to 4, 6) and `${CLAUDE_PLUGIN_ROOT}/rules/workflow_triggers/bash_refused_shapes.md` (Section 5). Read it before you cite or change a rule, or when one does not settle your case.

## 1. Command Reference

Commands come from the `mayker-dev` plugin, namespaced `/mayker-dev:<command>`, and each runs the skill of the same name.

| Command | Skill | Purpose |
| --- | --- | --- |
| `/mayker-dev:init-project [existing \| new]` | init-project | Setup part 1: `CLAUDE.md`, `.claude/settings.json`, the always-on rules, `.gitignore` entries (local, interactive) |
| `/mayker-dev:sync-project` | sync-project | Setup part 2, repeatable: MCP pre-flight, status mapping, backlog import, `feature_map.md`, `project_state.json`, CI, project docs (local, interactive) |
| `/mayker-dev:upgrade-project [--dry-run]` | upgrade-project | Carry a plugin update into the repo: re-materialize the rules, apply the migration ledger. Safe anywhere |
| `/mayker-dev:plan-feature {ID}` | plan-feature | Generate an architect plan for one work item |
| `/mayker-dev:build-feature {ID}` | build-feature | Implement one work item from an approved plan |
| `/mayker-dev:plan-features {IDs \| ready \| wave N}` | plan-features | Batch: one worktree and one draft plan PR per item |
| `/mayker-dev:build-features {IDs \| ready \| wave N}` | build-features | Batch: one worktree and one PR per approved item |
| `/mayker-dev:revise-feature {ID}` | revise-feature | Apply a revision based on PR review comments |
| `/mayker-dev:watch-pr [{ID \| PR}]` | watch-pr | Watch a PR's CI checks to completion and fix failures |
| `/mayker-dev:refactor frontend\|backend\|{ID} [--no-watch]` | refactor | Standalone code-quality scan and refactoring |
| `/mayker-dev:generate-tests {scope} [--tier] [--no-watch]` | generate-tests | Generate tests for a work item, module, or scope |
| `/mayker-dev:diagnose {scope}` | diagnose | Scan existing code for bugs, perf, and risks; write local work items |
| `/mayker-dev:fix {ID \| description}` | fix | Condensed plan+build for one work item, keeping the gates |
| `/mayker-dev:security-scan {scope}` | security-scan | Run an Aikido scan locally (no repo or CI required); route findings to `/fix` |
| `/mayker-dev:security-fix [findings-file]` | security-fix | Autonomously remediate Aikido findings on the current PR branch, keeping all quality gates |
| `/mayker-dev:waves [wave N]` | waves | Print the wave overview of `feature_map.md`. Read-only |
| `/mayker-dev:deliver [IDs \| wave N+]` | deliver | Autonomous mode only: drive the whole backlog to Done on the dependency graph, no human gates (`autonomy.md`) |

Follow the invoked skill's instructions exactly.

The batch commands run the single-item procedure per item, each in its own worktree, with every human gate intact (`${CLAUDE_PLUGIN_ROOT}/rules/batch_dispatch.md`). Only `/deliver` self-approves and merges.

## 2. Subagents

The plan / build / review split runs on the plugin's subagents `planner`, `builder`, `reviewer` and `orchestrator`. Each one's role and tool grant is its `agents/*.md` definition, which the Agent tool shows and enforces.

The reviewer only reports; the builder fixes. Each reviewer dispatch carries the run's observed test results (`.claude/artifacts/run/handover/{ID}-run.md`) and run id, so a prediction contradicting an observed pass is never BLOCKING (`review_standards.md` Sections 4 and 6.1). The orchestrator only decides; the `/deliver` session executes its verdicts.

**No `model` argument on a dispatch.** Spawn every subagent with **no** `model` argument on the Agent/Task call. A per-invocation `model` outranks the agent definition's own `model:` pin, so passing one silently runs that step on a tier nothing chose: nothing refuses it, the run reports success, and the mandated planning or review tier simply did not happen. The tier is `agents/*.md`'s, and only `agents/*.md`'s.

## 3. Operational Behaviour

- **Response format:** Be concise. Use Markdown for all code blocks.
- **Autonomy compatible:** only `/init-project` and `/sync-project` have human checkpoints; `/sync-project` refuses an unattended surface (`surface-detect.sh`), and `/upgrade-project` is the maintenance path that is safe there. Never answer a materialization stop with a permission grant, a hook `allow` or a write route of your own.
- **Keeping a repo current after a plugin update:** `rule-drift-check` names `/upgrade-project` when the repo lags the plugin; a `/sync-project` re-run regenerates `project_state.json`, the project docs and the plugin-owned CI workflows.
- **Autonomy mode:** `CLAUDE.md` → Autonomy selects the operating model. `assisted` (default): humans review plan PRs, set Ready for Build, and review and merge implementation PRs; the batch commands change how many items move, not who approves. `autonomous`: `/deliver` drives the backlog per `autonomy.md`, self-approves plans and merges by its own verdict, and hard-stops unless the toggle reads `autonomous`. Quality gates are identical in both modes.
- **Permissions:** Autonomous runs rely on the permission posture in `.claude/settings.json` so agents do not block on approvals. See `docs/DEVELOPMENT.md` → Permissions & Autonomy.

## 4. Git Conventions

- **Branching:** one branch per work item, named in `feature_map.md` or the local item's frontmatter. `branch-guard` refuses a commit or push on any other branch and names the allowed prefixes.
- **Commits:** Use semantic commit messages:
  - `feat({FEATURE_ID}): ...` for new features
  - `fix({FEATURE_ID}): ...` for bug fixes
  - `refactor({FEATURE_ID}): ...` for code-quality improvements
  - `test({FEATURE_ID}): ...` for test additions
  - `plan({FEATURE_ID}): ...` for architect plans
  - `chore: ...` for maintenance
- **Source of truth:** Git is the master record. Never rely on local IDE history as the final state.
- **Worktrees:** `/deliver`, `/plan-features` and `/build-features` always isolate each item in `.claude/worktrees/{ID}` (gitignored, removed after merge). The single-item commands do so when `CLAUDE.md` → Worktrees is `per-feature` (Section 4.1). From a worktree, remote operations use the Git provider working path only: on a command-line path, `git -C <worktree> push` plus that tool.

## 5. Bash command shape

Batch independent work into one Bash call per exec turn, in a shape the permission layer can grant: on an unattended surface a refused command prompts nobody, and its step silently does not run.

### 5.1 Refused shapes

`bash-shape-guard` refuses each shape the permission layer was measured to refuse and names the shipped route; the shapes and their reasons are in `bash_refused_shapes.md` (named above). Three routes it does not see: read a project file with the `Read` tool, `cat`, `head` or `grep`, never `sed` or `awk`; write under `.claude/` only through `bash ~/.mayker/mayker-dev/hooks/lib/run-dir.sh stage-in write-*|append-* <dir> <name> .mayker/staging/{name}` from a document you wrote at `.mayker/staging/{name}`, never with `Write` or `Edit`; and wait for CI only with `ci-poll.sh --wait`, never with `sleep` or a loop of your own.

### 5.9 A refused command is reported, never substituted

When a command this framework tells you to run is refused by the permission layer, its step did not happen. Report it on that step's own line: `{field}: UNAVAILABLE (refused: {the refusal text, verbatim})`. Then:

1. Never substitute another mechanism and report its result as the check's.
2. Never re-spell the command until it lands. One identical retry, standalone, is fine.
3. Never keep the workaround private. A refusal of a shipped command is a framework defect: report it on the run line and to whoever maintains the framework, never into the consuming project's tracker.
4. The same holds for a write or a wait the framework tells you to make, by any tool, and inside a dispatch: the dispatch returns the `UNAVAILABLE` line, and you carry it onto the step's line. `bash ~/.mayker/mayker-dev/hooks/lib/refusals.sh` lists every refusal of the session and its dispatches; `claude -p`'s `permission_denials` lists the session's only.

On an attended surface, approving the prompt is fine. Treat a surface `hooks/lib/surface-detect.sh` reports as `unknown` as unattended.

## 6. Check output: a clean result names what it looked at

A check is anything whose result a report line, a PR body, a gate or a later step reads as pass, clean, current, not due or no findings.

1. **The verdict line names its inputs, the clean line included:** what was compared (as commits, not only names), how much there was (commits, entries, rows, items, tests per tier), and the scope chosen. `[merged-since] base=… ref=… commits=… overlap=…` is the shape.
2. **A report line relays those inputs**, or the check's line verbatim, never the bare token.
3. **An input that empties the comparison by construction is `indeterminate`, never clean:** a range whose base is its own ref, a scope of zero members, zero tests collected, zero checks watched, a missing target. Where empty is the real answer, the line says why (`n/a (fresh plan, branched from current main)`).
4. **An override of a computed input is named on the line as supplied** (`base=<sha> (forced)`), and rule 3 applies to it. A flag name keeps one meaning across the plugin's scripts.
5. **"Could not check" stays its own answer.** Exit 2 is never a pass, a fail-open prints one line naming its cause, and a refused command is `UNAVAILABLE` (5.9).
