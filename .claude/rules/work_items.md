<!-- materialized-from: mayker-dev v0.3.31; do not edit, regenerate with /init-project refresh-rules -->
# Work items

## 1. Sources

A *work item* is a unit of work: a feature, bug, performance issue, or chore. Its source is set by `CLAUDE.md` Work Item Source:

- `tracker`: items live in the issue tracker (ClickUp, Linear, Jira) via MCP. This is the default and matches the original framework behaviour.
- `local`: items live as files under `docs/issues/` in the repo. No tracker MCP is required.
- `hybrid`: resolve from the tracker if the ID exists there, otherwise from `docs/issues/`.

## 2. Local work-item file

Path: `docs/issues/{ID}.md`. YAML frontmatter plus body:

```markdown
---
id: BUG-014
type: bug            # feature | bug | perf | chore
title: Cart total miscalculates with discount codes
status: todo         # todo | planning | plan_review | ready_for_build | in_progress | in_review | done
severity: high       # bugs/perf only; optional otherwise
branch: feature/BUG-014-cart-discount-total
depends_on: []
scaffold: false      # optional; true marks the one foundational item built first (see Section 6)
---

## Description / expected behaviour
...

## Acceptance criteria
- [ ] ...
```

ID prefixes by type: `FEAT-`, `BUG-`, `PERF-`, `CHORE-` (security findings from `/security-scan` use `SEC-`). Any `{WORK_ITEM_ID}` a command accepts may be a tracker ID or a local file ID. Throughout the skills, `{FEATURE_ID}` and `{WORK_ITEM_ID}` are interchangeable; feature is just the default type. The `scaffold` field is optional and defaults to `false`; it is only meaningful for `local`/`hybrid` items (Section 6). A complete, copyable sample lives at `examples/BUG-001-example.md` in the plugin.

## 3. Resolve work item (used by every pipeline skill at Load Context)

Given `{WORK_ITEM_ID}` and Work Item Source:

- `tracker` or `hybrid`: look up `external_id` in `project_state.json`, fetch via the tracker MCP, passing the pinned identifiers (`workspace_id`, project, team) from the same file on the call (`mcp_integration.md` Section 1.3). For `hybrid`, if the ID is not in the tracker, fall back to the local file.
- `local`: read `docs/issues/{ID}.md`. Parse frontmatter (id, type, title, status, severity, branch, depends_on) and body (description, acceptance criteria).

If the item cannot be resolved from the configured source, stop with a clear message naming the ID and the source checked.

> **`/fix` resolves local files under any source.** `/fix {ID}` may read `docs/issues/{ID}.md` even when Work Item Source is `tracker` (it is the incremental escape hatch, and can also create the file from a free-text description), so a `BUG-`/`PERF-` item seeded by `/diagnose` is actionable by `/fix` without switching to `hybrid`. The full `/plan-feature` pipeline does **not** do this: under `tracker` it resolves IDs through the tracker, so to plan a local-only item set `hybrid` (or create the matching tracker item first).

**Branch and dependencies.** For tracker features these live in `feature_map.md`; for local items they live in the work-item frontmatter. Wherever a skill reads `feature_map.md` for a work item's `branch` or `depends_on`, read the frontmatter instead when the item is local.

## 4. Status handling

- `tracker` or `hybrid` (tracker item): update status via the tracker MCP using `status_mapping`, passing the pinned identifiers from `project_state.json` (`mcp_integration.md` Sections 1.3 and 4).
- `local`: update the `status:` field in the item's frontmatter file. No MCP call.

Either way, skip the update when the item is already at the target status (idempotent resume, Section 8), and never let a status mutation be the session's first tracker call (`mcp_integration.md` Section 1.4).

**Done on merge.** A CI step (or a manual step) marks the item done when the PR merges. It runs outside Claude Code, so it uses the tracker's REST API, not MCP, and it routes on `work_item_source` in `project_state.json` — **not** on which files exist:

- `local`: sets `status: done` in `docs/issues/{ID}.md`. No tracker REST call or secret is needed.
- `tracker`: transitions the tracker item to the `status_mapping.done` status. No file is touched.
- `hybrid`: an ID in the `features` registry is tracker-resident, so its **authoritative** side is the tracker twin (Section 3) — transition it, **and** also flip `docs/issues/{ID}.md` when that file exists, so the shadow copy does not contradict the authority. An ID that is not in the registry is local-only and takes the file path. Flipping only the shadowed file would leave the authoritative status at pre-merge and block every dependent that resolves the item through the tracker.

The file flip pushes a commit to the default branch, so if the default branch is protected the CI bot must be allowed to bypass the protection (on GitHub, exempt the `github-actions` bot in the branch ruleset; on GitLab/Bitbucket, grant the CI user push access). Otherwise the push is rejected and the item stays in its pre-merge status until flipped by hand. The step fails loudly only when **no** side recorded the merge: a missing tracker secret (or `external_id`) errors under `tracker`, and under `hybrid` for an item with no local file, but degrades to a warning when the local flip still ran; a routed file path with no `docs/issues/{ID}.md` errors unless the tracker transition already succeeded.

## 5. MCP requirement by source

- `tracker` or `hybrid`: the issue tracker MCP is required, per `mcp_integration.md`.
- `local`: the issue tracker MCP is NOT required. The Git provider MCP stays recommended for PR and review-comment operations but degrades to the `gh` CLI (working path resolved and recorded per `mcp_integration.md` Section 5.0); if neither is present, PR-based steps fall back to a manual note in the work-item file.

## 6. Scaffold precedence for local items

In a greenfield project the **scaffold** item creates the project structure, test infrastructure, and CI that every other item depends on, so it must be built and merged first. For `tracker` items this is the `scaffold: ✅` row in `feature_map.md`. Local items are not in `feature_map.md`, so the equivalent marker is an optional `scaffold: true` field in a single local item's frontmatter.

How the precedence gate (in `plan-feature` and `build-feature`) resolves the scaffold item, in order:

1. The `feature_map.md` row flagged `scaffold: ✅`, if one exists (tracker/hybrid).
2. Otherwise, the single `docs/issues/{ID}.md` whose frontmatter has `scaffold: true` (local/hybrid).
3. If neither exists, there is no scaffold item and the gate is skipped (this is the normal case for an existing codebase, and for a local greenfield project that does not need scaffold-first ordering).

When a scaffold item is found and is not the item being worked on, the gate resolves its status the usual way (frontmatter for a local item, tracker MCP for a tracker item) and blocks until it is `done`. Mark at most one item `scaffold: true`; if several are flagged, treat the lowest-ID one as the scaffold and warn. Items can still express ordinary ordering between each other with `depends_on` regardless of the scaffold flag.

## 7. Readiness and the dependency graph

Execution order is governed by the **dependency graph**, not by any grouping. The graph *is* `feature_map.md`: a flat six-column table, one row per item, with the edges in `depends_on` (local items carry `depends_on`/`branch` in frontmatter instead and need no row). The column set and the per-column rules are defined once, in `${CLAUDE_PLUGIN_ROOT}/templates/feature_map.md` → `## Schema`; that template is the single source of truth and every generator materializes it rather than composing the table from memory. There are no waves; a wave was only ever a derived view of this graph and is no longer generated.

**The schema is enforced, not just documented.** `${CLAUDE_PLUGIN_ROOT}/hooks/lib/feature-map-validate.sh {path}` checks a written map against that template and exits 0 (valid), 1 (violations, each naming the row, the rule and the consequence) or 2 (it could not check). Every step that **writes** the file runs it and refuses to proceed on a non-zero exit (`init-project` Section 4, `deliver` Section 2 step 5 and Section 3 step 3), and the `feature-map-guard` PostToolUse hook re-runs it advisorily on any other write, including a hand edit. Run it yourself before trusting a map you did not just generate: a blank `depends_on`, a `scaffold` cell reading `true` instead of `✅`, or a `branch` missing its `feature/{ID}-` prefix all render fine and all break a different gate silently.

**Readiness rule:** an item is *ready* to be worked on if and only if

1. its own status is `todo`, `planning`, `plan_review`, or `ready_for_build` (not already building, in review, or done), and
2. every ID in its `depends_on` resolves to `done` (Section 3 resolution, Section 4 status semantics), and
3. the scaffold gate passes: the item is itself the scaffold item, or the scaffold item is `done`, or no scaffold item exists (Section 6).

Readiness is recomputed from live status whenever a dependency reaches `done` (in autonomous runs, immediately after every merge), so newly-unblocked items can start at once. Items with no dependency relationship to each other are **independent** and may run in parallel, one branch and one session or subagent each; `shared_risk_notes` flags independent items likely to touch the same files, which should be serialized rather than run concurrently (the autonomous scheduler enforces this; in assisted mode it is dispatch advice).

## 8. Idempotent resume (a re-dispatch never repeats completed work)

Commands get interrupted — an auth stop (`mcp_integration.md` Section 1.4), a killed session, a cloud surface timing out — and the recovery is always the same: **re-dispatch the same command**. That only works if every numbered section of a pipeline skill is idempotent: when a re-dispatched run reaches a section whose outcome already exists, it verifies and **reuses** the outcome instead of redoing the work. (The observed failure this prevents: the US-CC-03 plan session was re-dispatched after an OAuth stall and repeated the entire run from zero, context load and all tracker fetches included — analysis F10.)

The canonical checks, applied by every pipeline skill at the section they belong to:

- **Branch:** `{branch}` already exists (locally or on the remote) → fetch/checkout and reuse it; never recreate it, reset it, or invent a suffixed variant.
- **Status:** the item is already at the section's target framework status → skip the update entirely (no tracker call, no frontmatter write; `mcp_integration.md` Section 4).
- **Plan artifact:** `.claude/artifacts/{ID}/plan.md` exists and this is not an explicit re-plan (plan-feature Section 3.1) → skip regeneration and use the existing plan (same for `shared_risks.md`).
- **Commits:** the section's output is already committed on the branch (clean working tree for those paths, the section's semantic commit present in `git log`) → skip the commit; already pushed → skip the push (but still run the upstream assertion where the skill requires it).
- **PR:** a PR already exists for the branch → update it; never open a duplicate.

Reads are not the concern — a fresh session must re-derive where it stands, and does so with the **one** batched read pass of `mcp_integration.md` Section 1.3 (which doubles as the auth pre-flight, Section 1.4 there). What must never repeat is a **mutation**: a second status write to the same value, a duplicated commit, a second PR, a regenerated plan.

**Auditability:** the skill's Summary lists which sections were skipped as already done — `Resumed: {sections skipped as already done} | fresh run` — so a resumed run is distinguishable from a fresh one at a glance.
