# Decisions (cross-cutting): deliver-20261024T023412Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261024T023412Z

- [run] Ingestion: scope FEAT-8 plus unfinished dependencies resolved to one node; TEST-01 (sole depends_on, scaffold) is done in local frontmatter, so FEAT-8 is ready and the scaffold gate passes. Wave 2 is an ordering key and did not enter readiness.
- [run] Reconcile: FEAT-8 already had a map row and a registry entry from /sync-project 0.3.443; nothing registered, no pre-dispatch register publish owed. Map valid (34 rows, 35 edges). Proposals: 0 wave, 0 checkpoint. Shared-risk inference: no pair in a one-node scope, 0 notes.
- [FEAT-8] Resume: no branch, PR, artifacts or worktree exist, so the item takes the full lifecycle from 6.1.
- [run] Scheduling: FEAT-8 dispatched alone; its shared-risk note names only complete or cancelled rows. The fixed {"version": "1.0"} versus existing version.py contradiction is carried to the planner and the plan verdict, not held at scheduling.
- [FEAT-8] Merged: PR #308 squash e8d905a on the orchestrator's merge verdict (autonomy.md Section 5, all five conditions); auto-Done run 40056442229 succeeded, ClickUp complete. Full-suite checkpoint at e8d905a: pass.
- [run] Section W step 1 (final boundary, wave 2): follow-ups filed none; known-improvements source read (FEAT-8 PR #308: OPTIONAL only), unaddressed-comments source read (none).
- [run] Section W step 2 re-ingestion over scope FEAT-8: FEAT-8 and TEST-01 done; graph has zero nodes; registered=none; proposals 0 wave, 0 checkpoint; map valid (34 rows, 35 edges).
- [run] Re-ingestion snapshot appended to .claude/artifacts/run/graph.md rather than written over it, so the run-start graph and resume map stay in the run record.
- [run] The item branch feature/FEAT-8-api-version-json-version remains on origin at d98a84a after the squash merge; no step of this run deletes it.
- [run] Section W step 3 publish wave-2: arm=opened merge=merged, PR https://github.com/bemayker/framework-improvement/pull/309, branch chore/mayker-deliver-20261024T023412Z-wave-2; pr-tests was a required check on main at merge time (repository ruleset: required_status_checks [pr-tests]).
- [run] Section W step 4: no node dispatchable or in flight after re-ingestion; the run goes to Section 8.
