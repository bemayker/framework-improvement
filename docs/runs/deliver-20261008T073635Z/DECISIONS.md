# Decisions (cross-cutting): deliver-20261008T073635Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261008T073635Z

- 2026-10-08 [run] Pre-existing uncommitted `DECISIONS.md` diff found at start: the previous run's (deliver-20261007T214613Z) whole section had not landed with its report publish (#123). Kept in place; it lands with this run's publish.
- 2026-10-08 [run] Scope `/deliver TEST-15`: one node, ready (todo; TEST-14 done at a65e01c; scaffold TEST-01 done). depends_on inferred [TEST-14]: AC2 exercises DELETE (TEST-14) and AC3 the {id} route (TEST-12); the direct-only rule makes TEST-12 and TEST-03 transitive, matching the TEST-14 row's own [TEST-12].
- 2026-10-08 [run] TEST-15 registered in project_state.json through project-state-write.sh (id_carrier title_prefix, no write-back; registered_at 2026-10-08T07:40:11Z).
- 2026-10-08 [run] feature_map.md row for TEST-15 (and the CHORE-04 shared-risk half) UNAVAILABLE (refused: "Claude requested permissions to edit .../.claude/feature_map.md which is a sensitive file."). No shipped script writes a map row, so Section 3 step 3's reconcile has no write route under the `.claude/` refusal; framework defect for the maintainer, not filed in the tracker. feature-map-propose.sh not run (no row to propose over); wave and test_checkpoint unassigned. Run proceeds on the inferred row held in run/graph.md: depends_on [TEST-14] (done, readiness unaffected), branch feature/TEST-15-count-notes, shared risk with CHORE-04 (complete, no live conflict).
- 2026-10-08 [run] Round 1 dispatches TEST-15 to plan; 1/3 slots, no serialization. TEST-11 (in_review) is out of scope and untouched.
- 2026-10-08 [TEST-15] Merged PR #124 as 68b69ff (squash) on orchestrator verdict; 7/7 checks green, review blocking=0.
- 2026-10-08 [run] Auto-Done defect: run 37746618166 failed with `source='hybrid' in_registry=no ... docs/issues/TEST-15.md not found`. Cause: this run registered TEST-15 in project_state.json in the primary checkout only, and that change reaches main at the wave publish, after the item merges, so an item a run registers itself is invisible to the pipeline at its own merge. Backstop: ClickUp status complete, PR label mayker:done. Framework defect for the maintainer (ordering of registration vs merge), not filed.
- 2026-10-08 [run] Final boundary (unwaved: TEST-15 has no map row). Follow-ups: none filed (PR #124 lists no known improvements; the one RECOMMENDED finding was applied by the refactor gate; no unaddressed comments). Re-ingest: scope `/deliver TEST-15` holds no unfinished item; graph empty.
- 2026-10-08 [run] Leftover directory `.claude/worktrees/TEST-15`: unregistered by `git worktree remove`, deletion refused (`Permission denied`); gitignored. Decisions captured first (capture=TEST-15 entries=18 ref=4c351b7).

