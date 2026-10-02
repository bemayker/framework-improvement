<!-- materialized-from: mayker-dev v0.3.250; do not edit, regenerate with /upgrade-project -->
<!--
  Universal standard. Loaded at launch from .claude/rules/ (always on). Do not edit per project.
  Slash-command mapping, operational behaviour, git conventions.
-->

# Workflow Triggers & Operational Behaviour

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

The plan / build / review split is expressed with dedicated subagents provided by the plugin (`planner`, `builder`, `reviewer`). The skills delegate to them by name:

| Subagent | Role | Permissions |
| --- | --- | --- |
| `planner` | Architect plans (used by `/plan-feature`, `/plan-features`, `/deliver`) | Read-mostly; writes only plan artifacts under `.claude/artifacts/` |
| `builder` | Implementation + tests, and CI-failure fixes (used by `/build-feature`, `/build-features`, `/revise-feature`, `/fix`, `/watch-pr`, `/deliver`) | Read/write code, run tests, commit and push |
| `reviewer` | Self-review against `review_standards.md`, plus a narrowed second pass over what that review could not cover (`review_standards.md` Section 6.4); used by `/build-feature`, `/build-features`, `/fix`, `/security-fix`, `/deliver` | Read-only; cannot edit, run, or commit |
| `orchestrator` | Autonomous scheduling and verdicts for `/deliver` | Read-mostly; writes only run artifacts and decision logs; spawns nothing |

The reviewer only reports; the builder fixes. Each reviewer dispatch carries the run's observed test results (`.claude/artifacts/run/handover/{ID}-run.md`) and run id, so a prediction contradicting an observed pass is never BLOCKING (`review_standards.md` Sections 4 and 6.1). The orchestrator only decides; the `/deliver` session executes its verdicts.

**No `model` argument on a dispatch.** Spawn every subagent with **no** `model` argument on the Agent/Task call. A per-invocation `model` outranks the agent definition's own `model:` pin, so passing one silently runs that step on a tier nothing chose: nothing refuses it, the run reports success, and the mandated planning or review tier simply did not happen. The tier is `agents/*.md`'s, and only `agents/*.md`'s.

## 3. Operational Behaviour

- **No TODO placeholders:** Do not generate code with "TODO: Implement logic" or similar. Write the full implementation.
- **Response format:** Be concise. Use Markdown for all code blocks.
- **MCP:** The issue tracker MCP is required only when Work Item Source is `tracker` or `hybrid`. The Git provider path is keyed on the provider: its mapping file names either the provider's command-line tool (no provider MCP call) or the provider's MCP. Each skill verifies what it needs at startup, reusing `project_state.json` → `git_provider.effective_path` (`mcp_integration.md` Section 5.0).
- **Config required:** the seven pipeline commands stop without `.claude/project_state.json`. `mcp_integration.md` Section 0 lists them, the six exceptions and the stop message.
- **Autonomy compatible:** only `/init-project` and `/sync-project` have human checkpoints. Run both in a local interactive session, never on an unattended surface (Routines, CI jobs, headless `claude -p`). `/sync-project` refuses an unattended invocation (`hooks/lib/surface-detect.sh`; an `unknown` surface proceeds and is reported). `/upgrade-project` is the maintenance path that is safe there: it never prompts, never applies a `manual` migration, and writes `.claude/rules/` and `.claude/scripts/` only through `hooks/lib/materialize.sh`. Never answer a materialization stop with a permission grant, a hook `allow` or a write route of your own. On an unattended surface, name a command `/mayker-dev:<command>` and check the run's recorded product, never the exit code alone: `claude -p` exits 0 on `Unknown command`.
- **Keeping a repo current after a plugin update:** `claude plugin update` refreshes nothing the plugin materialized into the repo. Run both of the other two. `/upgrade-project` applies the `migrations/` ledger (`CLAUDE.md`, the CI workflows, the `feature_map.md` structure) and re-stamps `.claude/rules/`. A `/sync-project` re-run regenerates `project_state.json` and the project docs, and is the only heal for `CLAUDE.md`'s Backing Services block and a missing or `auto` `Test gate command:`.
- **Autonomy mode:** `CLAUDE.md` → Autonomy selects the operating model. `assisted` (default): humans review plan PRs, set Ready for Build, and review and merge implementation PRs; the batch commands change how many items move, not who approves. `autonomous`: `/deliver` drives the backlog per `autonomy.md`, self-approves plans and merges by its own verdict, and hard-stops unless the toggle reads `autonomous`. Quality gates are identical in both modes.
- **Permissions:** Autonomous runs rely on the permission posture in `.claude/settings.json` so agents do not block on approvals. See `docs/DEVELOPMENT.md` → Permissions & Autonomy.

## 4. Git Conventions

- **Branching:** One branch per work item, prefix `feature/`, named in `feature_map.md` (tracker features) or the work item's frontmatter (local items). `/refactor` and `/generate-tests` use `refactor/` and `test/`. `/upgrade-project`, `/sync-project` and `/diagnose` land their output on `chore/mayker-{command}-...`, and `/deliver` its own non-item landings on `chore/mayker-deliver-{run_id}-{purpose}`. `branch-guard.sh` allows those prefixes and `main`/`master`/`develop`, and blocks every other branch, including a `chore/` name outside `mayker-`.
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

Batch independent work into one Bash call per exec turn, in a shape the permission layer can grant. Treat every shape rule as a correctness rule: on an unattended surface a refused command prompts nobody, and its step silently does not run.

### 5.1 Never emit these shapes

No prefix rule grants these shapes, and the framework does not ship the bare `Bash` grant that would (5.5). `tests/bash-command-shape.test.sh` Part 8 checks every command block the plugin ships against them (5.4).

- **No `$(…)` command substitution, and no backticks.** Take a value from a prior call's printed output as a literal, or from a helper script that computes it. Use the script whenever the value is a fact about the moment the call runs, such as a timestamp.
- **No `.`, `source` or `eval`.** Run a shared library instead: `bash ~/.mayker/mayker-dev/hooks/lib/<script>.sh …`.
- **No `cd` segment.** Use `git -C <dir>`, an explicit path argument, or a tool's root flag (`uv run --directory <dir>`, `npm --prefix <dir>`, `make -C <dir>`). This binds a configured command such as `CLAUDE.md` → `Test gate command:` too, because a session runs it as well as the hook.
- **No path outside the working directories.** The plugin cache is the exception, through the two shipped `permissions.additionalDirectories` entries (5.8), and the read fence setting disables that route (5.6). Running a program through the pointer is allowed; a read through it is judged on the resolved target. Read the installed version with `bash ~/.mayker/mayker-dev/hooks/lib/plugin-version.sh`.
- **No quoted string containing `git push`.** Spell a search pattern so it cannot contain the phrase.
- **No `${…}` brace expansion, and no `$CLAUDE_PLUGIN_ROOT` in a Bash command.** Name a plugin script through the pointer, unquoted: `bash ~/.mayker/mayker-dev/hooks/lib/<script>.sh …` (5.7).
- **No variable expansion other than `$HOME` and `$PWD`:** not an assigned variable, `"$@"`, `$1` or `$?`. Put the value in as a literal, or compute it inside a script. A `$` inside single quotes is not an expansion.
- **No compact JSON, or brace group holding a quote and a comma, outside single quotes, and a heredoc body counts as outside.** Pass a JSON record as a single-quoted argument or on a `printf` pipe into the script. Space a JSON example inside a document (`{"now": "…", "timezone": "UTC"}`).
- **No environment-assignment prefix** (`NAME=value command`), and no leading `env`. A recorded backing service reaches a test command through `bash ~/.mayker/mayker-dev/hooks/lib/run-env.sh --id {ID} --run-id {RUN_ID} -- <test command>`.
- **No trailing `&&` or `||`, and no command over 10,000 characters.** Write a long document as one `write-*` call, then `append-*` calls, each under 10,000 characters and split at a heading (5.3).

### 5.2 What composes fine, and must not be "fixed"

Measured allowed, so do not re-spell them: pipes of two and three segments; `&&`, `||` and `;` chains; `2>&1`; a quoted `--jq` filter; a bare assignment segment; unbraced `$PWD` or `$HOME` inside a path; an unquoted `~/…` path (quoting it stops the tilde expanding); an absolute path inside the repository; and the provider tool's API call its mapping file names. A chain prompts only when one of its segments has no grant.

### 5.9 A refused command is reported, never substituted

When a command this framework tells you to run is refused by the permission layer, its step did not happen. Report it on that step's own line: `{field}: UNAVAILABLE (refused: {the refusal text, verbatim})`. Then:

1. Never substitute another mechanism and report its result as the check's.
2. Never re-spell the command until it lands. One identical retry, standalone, is fine.
3. Never keep the workaround private. A refusal of a shipped command is a framework defect: report it on the run line and to whoever maintains the framework, never into the consuming project's tracker.

On an attended surface, approving the prompt is fine. Treat a surface `hooks/lib/surface-detect.sh` reports as `unknown` as unattended.

## 6. Check output: a clean result names what it looked at

A check is anything whose result a report line, a PR body, a gate or a later step reads as pass, clean, current, not due or no findings.

1. **The verdict line names its inputs, the clean line included:** what was compared (as commits, not only names), how much there was (commits, entries, rows, items, tests per tier), and the scope chosen. `[merged-since] base=… ref=… commits=… overlap=…` is the shape.
2. **A report line relays those inputs**, or the check's line verbatim, never the bare token.
3. **An input that empties the comparison by construction is `indeterminate`, never clean:** a range whose base is its own ref, a scope of zero members, zero tests collected, zero checks watched, a missing target. Where empty is the real answer, the line says why (`n/a (fresh plan, branched from current main)`).
4. **An override of a computed input is named on the line as supplied** (`base=<sha> (forced)`), and rule 3 applies to it. A flag name keeps one meaning across the plugin's scripts.
5. **"Could not check" stays its own answer.** Exit 2 is never a pass, a fail-open prints one line naming its cause, and a refused command is `UNAVAILABLE` (5.9).
