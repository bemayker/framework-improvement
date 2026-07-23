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

- `tracker` or `hybrid`: look up `external_id` in `project_state.json`, fetch via the tracker MCP. For `hybrid`, if the ID is not in the tracker, fall back to the local file.
- `local`: read `docs/issues/{ID}.md`. Parse frontmatter (id, type, title, status, severity, branch, depends_on) and body (description, acceptance criteria).

If the item cannot be resolved from the configured source, stop with a clear message naming the ID and the source checked.

> **`/fix` resolves local files under any source.** `/fix {ID}` may read `docs/issues/{ID}.md` even when Work Item Source is `tracker` (it is the incremental escape hatch, and can also create the file from a free-text description), so a `BUG-`/`PERF-` item seeded by `/diagnose` is actionable by `/fix` without switching to `hybrid`. The full `/plan-feature` pipeline does **not** do this: under `tracker` it resolves IDs through the tracker, so to plan a local-only item set `hybrid` (or create the matching tracker item first).

**Branch and dependencies.** For tracker features these live in `feature_map.md`; for local items they live in the work-item frontmatter. Wherever a skill reads `feature_map.md` for a work item's `branch` or `depends_on`, read the frontmatter instead when the item is local.

## 4. Status handling

- `tracker` or `hybrid` (tracker item): update status via the tracker MCP using `status_mapping` (unchanged behaviour).
- `local`: update the `status:` field in the item's frontmatter file. No MCP call.

Done on merge: for local items, a CI step (or a manual step) sets `status: done` in the file when the PR merges. No tracker REST call or secret is needed. That CI step pushes the flip commit to the default branch, so if the default branch is protected the CI bot must be allowed to bypass the protection (on GitHub, exempt the `github-actions` bot in the branch ruleset; on GitLab/Bitbucket, grant the CI user push access). Otherwise the push is rejected and the item stays in its pre-merge status until flipped by hand.

## 5. MCP requirement by source

- `tracker` or `hybrid`: the issue tracker MCP is required, per `mcp_integration.md`.
- `local`: the issue tracker MCP is NOT required. The Git provider MCP stays recommended for PR and review-comment operations but degrades to the `gh` CLI; if neither is present, PR-based steps fall back to a manual note in the work-item file.

## 6. Scaffold precedence for local items

In a greenfield project the **scaffold** item creates the project structure, test infrastructure, and CI that every other item depends on, so it must be built and merged first. For `tracker` items this is the `scaffold: ✅` row in `feature_map.md`. Local items are not in `feature_map.md`, so the equivalent marker is an optional `scaffold: true` field in a single local item's frontmatter.

How the precedence gate (in `plan-feature` and `build-feature`) resolves the scaffold item, in order:

1. The `feature_map.md` row flagged `scaffold: ✅`, if one exists (tracker/hybrid).
2. Otherwise, the single `docs/issues/{ID}.md` whose frontmatter has `scaffold: true` (local/hybrid).
3. If neither exists, there is no scaffold item and the gate is skipped (this is the normal case for an existing codebase, and for a local greenfield project that does not need scaffold-first ordering).

When a scaffold item is found and is not the item being worked on, the gate resolves its status the usual way (frontmatter for a local item, tracker MCP for a tracker item) and blocks until it is `done`. Mark at most one item `scaffold: true`; if several are flagged, treat the lowest-ID one as the scaffold and warn. Items can still express ordinary ordering between each other with `depends_on` regardless of the scaffold flag.

## 7. Readiness and the dependency graph

Execution order is governed by the **dependency graph**, not by any grouping. `feature_map.md` is a flat table whose columns are `Feature ID`, `Title`, `depends_on`, `branch`, `scaffold`, and `shared_risk_notes` (local items carry `depends_on`/`branch` in frontmatter instead). There are no waves; a wave was only ever a derived view of this graph and is no longer generated.

**Readiness rule:** an item is *ready* to be worked on if and only if

1. its own status is `todo`, `planning`, `plan_review`, or `ready_for_build` (not already building, in review, or done), and
2. every ID in its `depends_on` resolves to `done` (Section 3 resolution, Section 4 status semantics), and
3. the scaffold gate passes: the item is itself the scaffold item, or the scaffold item is `done`, or no scaffold item exists (Section 6).

Readiness is recomputed from live status whenever a dependency reaches `done` (in autonomous runs, immediately after every merge), so newly-unblocked items can start at once. Items with no dependency relationship to each other are **independent** and may run in parallel, one branch and one session or subagent each; `shared_risk_notes` flags independent items likely to touch the same files, which should be serialized rather than run concurrently (the autonomous scheduler enforces this; in assisted mode it is dispatch advice).
