<!-- materialized-from: mayker-dev v0.3.132; do not edit, regenerate with /upgrade-project -->
# Work items

## 1. Sources

A *work item* is a unit of work: a feature, bug, performance issue, or chore. Its source is set by `CLAUDE.md` Work Item Source:

- `tracker`: items live in the issue tracker (ClickUp, Linear, Jira) via MCP. This is the default and matches the original framework behaviour.
- `local`: items live as files under `docs/issues/` in the repo. No tracker MCP is required.
- `hybrid`: resolve from the tracker if the ID exists there, otherwise from `docs/issues/`.

**A tracker with no human-readable key of its own gets framework-assigned IDs, from the same prefix set as a local item.** ClickUp without custom task IDs enabled is the common case: its items carry an opaque external ID and nothing a human can quote. `/sync-project` Section 2 then assigns `FEAT-{n}` — or `BUG-`/`PERF-`/`CHORE-` where the tracker's own type or label marks the item as one — and **writes that ID back onto the tracker item**, so the ID is not hostage to one repo's `project_state.json`. The assignment order, the carrier that holds it, and the rule that only a human-approved run ever writes it are in `mcp_integration.md` Section 1.5; do not restate them here and do not derive a second assignment rule anywhere.

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
pr: https://github.com/acme/shop/pull/412   # optional; written once by the command that opens the PR
depends_on: []
scaffold: false      # optional; true marks the one foundational item built first (see Section 6)
---

## Description / expected behaviour
...

## Acceptance criteria
- [ ] ...
```

ID prefixes by type: `FEAT-`, `BUG-`, `PERF-`, `CHORE-` (security findings from `/security-scan` use `SEC-`). Any `{WORK_ITEM_ID}` a command accepts may be a tracker ID or a local file ID. Throughout the skills, `{FEATURE_ID}` and `{WORK_ITEM_ID}` are interchangeable; feature is just the default type. The `scaffold` field is optional and defaults to `false`; it is only meaningful for `local`/`hybrid` items (Section 6). The `pr` field is optional too and is the `local` half of the work-item-to-PR link: the command that opens a PR for the item writes the URL there instead of calling a tracker (`mcp_integration.md` Section 5.4), and a file without it is a file whose item has no PR yet. A second PR opened against the same item (a `/refactor` or `/generate-tests` run) appends its URL rather than replacing the first. A complete, copyable sample lives at `examples/BUG-001-example.md` in the plugin.

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

**The round-trip invariant is enforced, not just documented.** A tracker status is written through `status_mapping` and read back through `reverse_status_mapping`, which is single-valued, so a framework status sharing a tracker status with another one is **unobservable**: the read returns the other one. `${CLAUDE_PLUGIN_ROOT}/hooks/lib/status-mapping-validate.sh {path-to-project_state.json}` checks a written mapping and exits 0 (valid), 1 (a violation, each naming the colliding pair, the framework status that became unobservable, and the unused tracker statuses available) or 2 (it could not check); `-q` prints violations only. Three statuses must each own a tracker status: **`ready_for_build`** is the only machine-readable record of a human's plan approval, **`in_progress`** is what distinguishes a resumable run from a fresh one (Section 8), and **`done`** is what every dependency edge and the readiness rule turn on (Section 7). A collision among `todo`, `planning`, `plan_review` and `in_review` is warned about, not failed: they all mean "not started or awaiting a human" and no gate turns on telling them apart. Since MDF-125 the same validator also fails a mapping that resolves a **working** framework status (`planning`, `plan_review`, `ready_for_build`, `in_progress`, `in_review`) onto a tracker status whose name marks it closed or cancelled (rule `terminal-status`, distinguishable in the output from the round-trip collision): such a mapping can be perfectly distinct and still make the first pipeline command move a live item to a terminal status. `todo` and the read direction (a closed-named tracker status reading back as a live framework status) are warned about rather than failed, and `done` mapping to a closed tracker status is the correct case and never fires. The full rationale and the observed failure are in `mcp_integration.md` Section 1.2.

Who runs it: `/sync-project` Section 1 refuses to present a colliding proposal and Section 5 validates the file it wrote, `/deliver` Section 2 applies the same rule to the mapping it adopts unattended, and every pipeline skill that reads or writes an item's status re-runs it at Load Context (`-q`, chained onto the rule-drift command so it costs no extra exec turn) and **warns once without blocking**. `/deliver` is the one exception: its Load Context treats exit 1 as a **setup STOP**, because an unattended run has nobody to read a warning and cannot finish — it re-reads live status on every readiness recomputation, so a collapsed gate makes it re-plan the same item forever or never unblock a dependent. Commands that never touch item status — `/watch-pr`, `/refactor`, `/generate-tests`, `/security-scan`, `/diagnose` — deliberately do not run it; that omission is scope, not drift. **There is no repair command and none may be added here:** `status_mapping` is pure configuration, so a named collision is a ten-second human edit to `.claude/project_state.json`, and an automated repair would have to re-read the tracker's status list, dragging tracker MCP auth and a new failure mode into a path whose only job is to warn (MDF-058 grooming decision; `feature_map.md` in Section 7 is the opposite case, which is why it gets a heal path and this does not).

**Done on merge.** A CI step (or a manual step) marks the item done when the PR merges. It runs outside Claude Code, so it uses the tracker's REST API, not MCP, and it routes on `work_item_source` in `project_state.json` — **not** on which files exist:

- `local`: sets `status: done` in `docs/issues/{ID}.md`. No tracker REST call or secret is needed.
- `tracker`: transitions the tracker item to the `status_mapping.done` status. No file is touched.
- `hybrid`: an ID in the `features` registry is tracker-resident, so its **authoritative** side is the tracker twin (Section 3) — transition it, **and** also flip `docs/issues/{ID}.md` when that file exists, so the shadow copy does not contradict the authority. An ID that is not in the registry is local-only and takes the file path. Flipping only the shadowed file would leave the authoritative status at pre-merge and block every dependent that resolves the item through the tracker.

The file flip pushes a commit to the default branch, so if the default branch is protected the CI bot must be allowed to bypass the protection (on GitHub, exempt the `github-actions` bot in the branch ruleset; on GitLab/Bitbucket, grant the CI user push access). **Any ruleset `/sync-project` Section P proposes already carries that exemption**, for this reason and stated there — so the case to watch for is a ruleset someone applied by hand, or one applied through GitHub's classic branch-protection API, which cannot exempt an app from a required pull request at all. Otherwise the push is rejected and the item stays in its pre-merge status until flipped by hand. The step fails loudly only when **no** side recorded the merge: a missing tracker secret (or `external_id`) errors under `tracker`, and under `hybrid` for an item with no local file, but degrades to a warning when the local flip still ran; a routed file path with no `docs/issues/{ID}.md` errors unless the tracker transition already succeeded.

## 5. MCP requirement by source

- `tracker` or `hybrid`: the issue tracker MCP is required, per `mcp_integration.md`.
- `local`: the issue tracker MCP is NOT required. The Git provider MCP stays recommended for PR and review-comment operations but degrades to the `gh` CLI (working path resolved and recorded per `mcp_integration.md` Section 5.0); if neither is present, PR-based steps fall back to a manual note in the work-item file.

## 6. Scaffold precedence for local items

In a new project the **scaffold** item creates the project structure, test infrastructure, and CI that every other item depends on, so it must be built and merged first. For `tracker` items this is the `scaffold: ✅` row in `feature_map.md`. Local items are not in `feature_map.md`, so the equivalent marker is an optional `scaffold: true` field in a single local item's frontmatter.

How the precedence gate (in `plan-feature` and `build-feature`) resolves the scaffold item, in order:

1. The `feature_map.md` row flagged `scaffold: ✅`, if one exists (tracker/hybrid).
2. Otherwise, the single `docs/issues/{ID}.md` whose frontmatter has `scaffold: true` (local/hybrid).
3. If neither exists, there is no scaffold item and the gate is skipped (this is the normal case for an existing codebase, and for a local `new`-mode project that does not need scaffold-first ordering).

When a scaffold item is found and is not the item being worked on, the gate resolves its status the usual way (frontmatter for a local item, tracker MCP for a tracker item) and blocks until it is `done`. Mark at most one item `scaffold: true`; if several are flagged, treat the lowest-ID one as the scaffold and warn. Items can still express ordinary ordering between each other with `depends_on` regardless of the scaffold flag.

## 7. Readiness and the dependency graph

Execution order is governed by the **dependency graph**, not by any grouping. The graph *is* `feature_map.md`: a flat seven-column table, one row per item, with the edges in `depends_on` (local items carry `depends_on`/`branch` in frontmatter instead and need no row). The column set and the per-column rules are defined once, in `${CLAUDE_PLUGIN_ROOT}/templates/feature_map.md` → `## Schema`; that template is the single source of truth and every generator materializes it rather than composing the table from memory. There are no waves; a wave was only ever a derived view of this graph and is no longer generated.

**`test_checkpoint` is the one thing the graph cannot say, and it is authored rather than derived** (MDF-071). The graph says what blocks what; it has no way to say "this group of work is complete", which is what a wave used to mark and what a full local test run needs as its boundary. Nothing else provides one: the push gate runs a *scoped* suite on a feature branch and CI runs everything against one PR at a time, so the whole suite never runs against a locally integrated main. A `✅` in that column says it does, once, when that item merges — advisory in `/build-feature` and `/build-features`, blocking in `/deliver` 6.10, which admits no newly unblocked item after a red checkpoint. `/sync-project` Section 3 and `/deliver` Section 3 **propose** candidates (sinks, and items that unblock three or more rows) with the reason and a decision confirms them; **any number of rows may be flagged**, unlike `scaffold`. This is not a wave model returning: it is the primitive one would be built on, and no grouping, ordering or readiness meaning attaches to the flag.

**The schema is enforced, not just documented.** `${CLAUDE_PLUGIN_ROOT}/hooks/lib/feature-map-validate.sh {path}` checks a written map against that template and exits 0 (valid), 1 (violations, each naming the row, the rule and the consequence) or 2 (it could not check). Every step that **writes** the file runs it and refuses to proceed on a non-zero exit (`sync-project` Section 4, `deliver` Section 2 step 6 and Section 3 step 3), and the `feature-map-guard` PostToolUse hook re-runs it advisorily on any other write, including a hand edit. A blank `depends_on`, a `scaffold` cell reading `true` instead of `✅`, or a `branch` missing its `feature/{ID}-` prefix all render fine and all break a different gate silently.

**The readers check too, and they warn rather than block.** Every write path and the repo's own CI validate the map on the way *out*; until MDF-147 nothing validated it on the way *in*, so a map corrupted between two sessions was consumed as fact by the very commands whose readiness, branch, scaffold and checkpoint decisions come out of it, and CI reported it only at push time — after the work was planned and built against the wrong edges. So the seven pipeline skills that read the graph (`build-feature`, `build-features`, `plan-feature`, `plan-features`, `fix`, `revise-feature`, `deliver`) re-run the validator at Load Context with `-q`, chained onto the rule-drift command so it costs no extra exec turn, and **warn once without blocking**. `/deliver` is the one exception and for the same reason as the status mapping in Section 4: its Load Context treats exit 1 as a **setup STOP**, because an unattended run has nobody to read a warning and Section 3 builds its whole schedule out of this table. A missing map is not a finding — `local` items legitimately have none, so a `cannot check: file not found` line is silent — and any other exit 2 is reported, because a check that could not run is never a pass. **A reader never repairs**: it names the heal below and stops there.

**A structural fault has a heal path; a row fault does not, and the difference is the whole reason this file gets one and `status_mapping` (Section 4) does not.** A map generated before the schema became a validator has no `## Schema` block and no `## Work items` heading, and **nothing re-materializes an existing map's structure** — `/sync-project` Section 10 adds rows and preserves the ones already there, and `/deliver` Section 2 skips setup once `project_state.json` exists — so it fails the validator forever, and since the check runs in the repo's own CI it fails every pull request with it. The heal is one command, from the repo root:

```bash
bash "${CLAUDE_PLUGIN_ROOT}/hooks/lib/feature-map-repair.sh" .claude/feature_map.md
```

It **adds** the template's `## Schema` block and the `## Work items` heading where they are absent, replaces the table's header and separator rows with the current schema's, appends the empty cells a newer column needs, and stamps the file `materialized-from`. Every existing cell survives byte-for-byte, including a `shared_risk_notes` value holding an escaped `\|`, and **no row is ever regenerated from `project_state.json`**: this table is the only record of `depends_on`, `branch`, `scaffold`, `shared_risk_notes` and `test_checkpoint` together, so rebuilding rows would silently drop whatever the state file does not carry. It is idempotent, and it exits on the validator's own contract — 0 valid, 1 structure repaired but rows still carry data faults, 2 it would not touch the file at all. `/upgrade-project` **reports** this defect and names that command (`migrations/0.3.107-01-feature-map-structure`); it never performs the repair itself, because a structural rewrite of a file carrying the project's own data must not happen on an unattended run. Row faults stay the human's: the validator names each one with its row and its consequence, and guessing at data is exactly what this script refuses to do.

**Outside a session, the consuming repo runs its own vendored copy** (MDF-047). `/init-project` Section V vendors the validator and its schema source as `.claude/scripts/feature-map-validate.sh` and `.claude/scripts/feature_map.template.md`, and `pr-tests.yml`'s `feature-map` job runs them on every pull request. That is the only check on the one path none of the three above can see: a human editing rows in an editor and pushing. Prefer the vendored path in anything a CI runner might execute — `${CLAUDE_PLUGIN_ROOT}` resolves under `~/.claude/`, which no runner has — and treat its exit 2 as a failure everywhere, because a check that cannot validate must never report green.

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
- **The work-item link comment:** the item already carries a framework comment naming **this PR's URL** → post nothing. **The key is the PR URL, not the item** (`mcp_integration.md` Section 5.4). Dedup on the item would suppress the legitimate second comment when `/refactor` or `/generate-tests` opens its own PR against an item that already has one; dedup on the URL gives exactly one comment per distinct PR, which is the correct granularity. A re-plan, a resumed run, a batch re-dispatch, a body update, a draft to ready conversion and a `/deliver` retry therefore all add nothing. An item carrying six identical bot comments is worse than one carrying none, and it is the observable failure mode of this link.

Reads are not the concern — a fresh session must re-derive where it stands, and does so with the **one** batched read pass of `mcp_integration.md` Section 1.3 (which doubles as the auth pre-flight, Section 1.4 there). What must never repeat is a **mutation**: a second status write to the same value, a duplicated commit, a second PR, a regenerated plan.

**Auditability:** the skill's Summary lists which sections were skipped as already done — `Resumed: {sections skipped as already done} | fresh run` — so a resumed run is distinguishable from a fresh one at a glance.

## 9. What an item's artifact directory may commit

`.claude/artifacts/{ID}/` holds two kinds of file and the kinds have opposite git requirements. Check a new artifact against this section before adding it, rather than deciding per skill.

**Branch content — committed, and never ignored:** `plan.md`, `shared_risks.md`, `review_scope.md`, `review_scope_artifacts.md`, `review_scope_gate.md`, `uat_script.md`, `refactor_report.md`, `decisions.md`. Section 8's resume check reads `plan.md` **from the branch**, and the read-only reviewer dispatches are scoped by the path of a manifest they cannot regenerate, so an ignore that hides any of these makes every resumed run replan from zero and leaves a review unauditable. Never ignore `.claude/artifacts/{ID}/` wholesale, in a repo `.gitignore` or in a directory-level one (`hooks/lib/run-dir.sh`: `ensure_run_dir` is for a machine-local directory and is never called on a work-item unit; `ensure_stats_dir` is the one for this directory).

**"Committed" needs a named committer, and for four of these it is not the dispatch that wrote the file.** Not being ignored is necessary and is not sufficient: a file nothing stages is untracked, which reaches no PR *and* leaves the tree dirty for the next command's clean-tree pre-flight. Every entry above therefore names where it enters a commit, and a new entry does the same or it is not added:

| Artifact | Written by | Committed by |
|---|---|---|
| `plan.md`, `shared_risks.md` | the `planner` dispatch | `/plan-feature` Section 10, its own directory stage |
| `uat_script.md` | the Phase G dispatch | that dispatch's own `test({ID}): add UAT...` commit |
| `refactor_report.md` | the refactor gate | the gate's own commit, on both paths: `/refactor` Section 6 and `/build-feature` Section 13 steps 7-8 (`refactoring_standards.md` Section 8). Never the Section 17 manifest commit, whose pathspec names its two manifests and excludes this one; that the gate's commit may carry it is what Phase H's `.claude/artifacts/` detection exclusion buys |
| `review_scope.md`, `review_scope_artifacts.md`, `review_scope_gate.md` | the **dispatching session**, before a reviewer dispatch | that session, in `chore({ID}): record review scope manifests` immediately before the push (`/build-feature` Section 17, `/fix` Section 8, `/security-fix` Section 6) — one commit per run, carrying nothing else |
| `decisions.md` | `/deliver` 6.7 step 4 on a blocked item | nothing local: `/deliver` pushes contents through `push_files`, which is that path's commit |

Two rules follow, and both are cheap to check and expensive to rediscover. **A manifest written by the session rather than by a dispatch has no commit of its own unless one is stated**, because every phase commit belongs to a dispatch and each dispatch commits only its own files — which is how `review_scope.md` came to be asserted "committed with the branch" by a skill and committed by nobody for eight versions (MDF-129). And **that commit belongs after the last write, not chained onto the generation**: a review section can be re-entered on a self-fix cycle, so a commit per generation puts several commits carrying one subject on the branch, and leaving it to whichever phase commit comes next is the non-determinism the one-commit-per-phase rule exists to prevent.

**Statistics — machine-local, and never committed to a feature branch, on either mode's push path.** `stats.jsonl` and `stats_summary.{json,md}` are a measurement of the run that produced them, not a product of it. The rule is a rule and not a preference because a branch with an open PR turns every one of those writes into a full test-matrix run: a push of a statistics file fires `pull_request: synchronize`, and a `paths-ignore` filter cannot suppress it, since a pull request's changed-file list is computed from a **three-dot** diff and therefore keeps matching the code the PR already contains. Both push paths need their own half of the guarantee, because they fail differently:

- **Assisted (`/build-feature`, `/plan-feature`, `/fix`, `/revise-feature`, `/refactor`, `/generate-tests`, `/security-fix`)** stages and commits locally, so an ignore is the whole mechanism and no second publish route is needed — the human reads the table in the session Summary. **That ignore has two halves and the repo-level one alone is not sufficient.** `/init-project` Section C step 4's `.claude/artifacts/*/stats.jsonl` and `.claude/artifacts/*/stats_summary.{json,md}` entries reach an already-initialized repository only when someone re-runs `/init-project` (`migrations/README.md` "Adding one" step 3: `.gitignore` is re-run-healed and `/upgrade-project` deliberately ships no entry for it), so in a repository whose `.gitignore` predates 0.3.69 they are simply absent. The runtime half needs no re-init: **every command that creates a work-item unit directory creates it through `ensure_stats_dir`** — all eight of them, in the first call that touches the unit — and that helper writes a directory-level `.gitignore` naming exactly `stats.jsonl`, `stats_summary.json`, `stats_summary.md` and itself, never `*`, never overwriting one the project already put there. A statistics file is consequently ignored twice once both halves are in place, which is the intended shape rather than redundancy to tidy up. A new creator of a work-item unit uses the same helper or it reinstates the defect.
- **Autonomous (`/deliver` 6.6)** pushes through the GitHub MCP's `push_files`, which sends contents through the API and **ignores `.gitignore` entirely**, so that path filters the statistics paths out of its payload explicitly and `/deliver` Section 8 publishes them to the **default** branch instead, where no pull request is gated on them.

A new machine-local artifact is added to both halves, or it is not added.
