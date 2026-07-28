<!-- materialized-from: mayker-dev v0.3.34; do not edit, regenerate with /init-project refresh-rules -->
<!--
  Universal standard. Imported into CLAUDE.md (always on). Do not edit per project.
  Autonomous decision authority, decision log, merge policy, escalation bar,
  GitHub-MCP-only git, repository creation policy. Inert unless CLAUDE.md
  Autonomy is `autonomous`.
-->

# Autonomy standard

## 1. When this applies

This rule governs behaviour when `CLAUDE.md` → Autonomy is set to `autonomous`: the `/deliver` run drives the whole backlog with no human action after setup. When Autonomy is `assisted` (the default) this rule is inert and the original human-gated lifecycle applies: humans review plan PRs, move items to Ready for Build, review implementation PRs, and merge.

The only human inputs to an autonomous project are one-time setup: the filled-in `CLAUDE.md` (tech stack, MCP configuration, test configuration, toggles) and the architecture notes or documents. After that, the framework decides and acts on its own.

## 2. Decision authority

The framework infers intent and chooses what a thoughtful senior engineer would choose, instead of stopping to ask. Concretely:

- **Underspecified inputs:** derive the missing detail from the work item's text, `CLAUDE.md` (description, stack, architecture notes), the existing code, and the standards, in that order. Pick the simplest choice that satisfies the acceptance criteria; never gold-plate (`user_story_alignment.md` still applies in full).
- **Never block on ambiguity.** An autonomous run must not prompt, wait for input, or park an item because something is unclear. Decide, record, proceed.
- **Self-approved plans:** the plan produced by the `planner` is approved by the framework itself after checking it against the standards and every acceptance criterion. There is no human plan gate in autonomous mode; the `plan_review` and `ready_for_build` states are passed through automatically.
- **AI final merge call:** the framework merges its own PRs when the merge conditions in Section 5 hold. No human approval is awaited.

Authority removes **human** gates only. Every quality gate stays enforced: the test gate and branch guard hooks, the read-only self-review, the refactor gate, and all standards. Autonomy is never a licence to disable a failing test, weaken a gate, skip review findings, or merge red.

## 3. Decision log

Every non-trivial decision is recorded with a one- or two-line rationale, so a human can audit the run afterwards:

- **Per item:** `.claude/artifacts/{ID}/decisions.md`, one dated entry per decision (interpretation of an ambiguous criterion, a self-approved plan, a chosen library, a CI fix strategy, a merge verdict, a skipped-merge escalation).
- **Cross-cutting:** `DECISIONS.md` at the repository root, for calls that affect more than one item (status mapping chosen without approval, a new repository created, a dependency inferred between items, a concurrency serialization, retirement of an assumption).

Entry format:

```markdown
- {YYYY-MM-DD} [{ID or run}] {Decision}. Rationale: {one or two lines}.
```

A decision that is only a normal application of the standards (for example "wrote unit tests for the service layer") is trivial and not logged. If in doubt, log it.

## 4. Escalation bar (the only pause)

The single situation in which the framework does not act is a **genuinely irreversible and ambiguous** action that cannot be made safe. Both conditions must hold:

- **Irreversible:** cannot be undone with a revert PR or a follow-up change. Examples: a destructive data migration on a shared or production database (dropping or truncating populated tables, lossy column changes), rotating or deleting production secrets, deleting a repository or force-erasing history, an outbound action with external side effects that cannot be recalled.
- **Ambiguous:** the intent cannot be inferred confidently from the work item, `CLAUDE.md`, the architecture notes, or the code.

When only one condition holds, act: an ambiguous but reversible choice is decided and logged (Section 2); an unambiguous but irreversible action that the item clearly requires is performed carefully (with a backup or expand-and-contract migration pattern where possible). When both hold, prefer the reversible path (for example additive migration instead of destructive, a new secret name instead of rotating one). If no reversible path exists, complete everything else, leave the PR green but unmerged, record the blocker in the decision log, and report it in the final run report. Do not fail the run for it, and do not merge it.

## 5. Merge policy (autonomous)

A PR is merged, via the GitHub MCP `merge_pull_request` and by the framework's own decision, when **all** of the following hold:

1. Self-review is clean: the reviewer's verdict line reports `blocking=0` (`review_standards.md` Section 6.2), i.e. no unresolved BLOCKING findings.
2. All CI checks on the PR have completed and are green. Never merge with checks pending or failing. The PR is opened as a draft and converted to ready for review only once they are (deliver Sections 6.6 and 6.7 step 5), so a still-draft PR at merge time means the checks never settled — and GitHub refuses to merge a draft in the first place.
3. Every acceptance criterion of the work item is satisfied by the implementation.
4. All PR review comments (human or bot) have been addressed in code or answered with a reply, and no unresolved change request remains.
5. The Section 4 escalation bar is not triggered.

The merge method is `CLAUDE.md` → Autonomy → Merge method (default `squash`). After merging, the framework verifies the work item transitioned to Done on its **authoritative** side (`work_items.md` Sections 3-4: the tracker twin for a tracker-resident item, the file for a local one) and performs the transition itself via the tracker MCP or the local frontmatter — both, for a `hybrid` item that has a twin and a shadow file — if CI could not, then recomputes the dependency graph so dependents unblock.

## 6. Git operations: GitHub MCP only

In autonomous mode, **every remote git operation goes through the custom GitHub MCP** (registered as `github` in `.mcp.json`). No `git push`, `git fetch` from remotes for write purposes, and no `gh` CLI for remote actions. The assisted-mode degradation to the `gh` CLI does not apply: if the GitHub MCP is unavailable, the run stops before starting (this is a setup failure, not a mid-run prompt). The exact operation-to-tool mapping is in `mcp_integration.md` Section 7.

Local, non-remote git remains allowed and expected: reading files, `git worktree` for per-item isolation (always on in an autonomous run, whatever `CLAUDE.md` → Worktrees says — that toggle governs the assisted commands, `workflow_triggers.md` Section 4.1), local branches, local commits, and local test runs. The deterministic hooks gate both push paths: a Bash `git push` and a GitHub MCP push (`push_files`, `create_or_update_file`, `delete_file`) each trigger the branch guard and the test gate.

## 7. Repository policy

- **Default target:** the repository in `CLAUDE.md` → MCP Configuration → Repository. New work lands there on `feature/{ID}-{slug}` branches.
- **New repository:** created only when a work item (or a coherent group of items) is a genuinely separately-deployable product or service: its own runtime and deploy lifecycle, no shared code with the primary repository, and the item or architecture notes say so or clearly imply it. Ambiguous cases default to a branch on the primary repository (reversible; extraction to a repo later is cheap, merging repos back is not). Record the call either way.
- **Organization:** new repositories are always created under the **`bemayker`** organization (or the `CLAUDE.md` → Autonomy → Default organization override) via the GitHub MCP `create_repository`, then initialized per `skills/deliver/SKILL.md`: default branch, base structure, the PR-tests and auto-Done pipelines, and a record in `project_state.json` → `repositories` so later items target the right repo.
- **Repository creation toggle:** `CLAUDE.md` → Autonomy → Repository creation (`allowed` | `primary-only`). Under `primary-only`, everything is a branch on the primary repository and would-be-new-repo work is flagged in the decision log instead.

## 8. Bounded retries

Autonomous loops are bounded so a run always terminates:

- CI failure fixing: at most `CLAUDE.md` → Autonomy → CI fix attempts (default 3) diagnose-fix-push cycles per PR. On exhaustion, record the blocker, leave the PR unmerged, continue the run.
- Self-review fixes: max 2 cycles (unchanged from `review_standards.md`).
- Review-comment rounds: max 3 fetch-address-reply cycles per PR, then treat remaining threads as the CI-exhaustion case.
- Status polling: poll with backoff per the waiting policy (`workflow_triggers.md` Section 2.1, applied in the deliver skill Section 6.7); a pipeline that never completes within the poll budget is treated as a failure.

An item that exhausts its retries is reported as blocked, never silently dropped and never merged red.
