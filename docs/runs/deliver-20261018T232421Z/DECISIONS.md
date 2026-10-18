# Decisions (cross-cutting): deliver-20261018T232421Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261018T232421Z

- 2026-10-18 [run] Graph built from 5 open tracker items; scaffold TEST-01 done; 16 cancelled tracker tasks reverse-map to null and are excluded as closed. Rationale: no open node depends on a cancelled item, so no edge needed rewriting or dropping; feature_map.md validated without reconcile.
- 2026-10-18 [run] Fresh run, no resume: no remote feature branch, open PR, plan artifact or worktree exists for TEST-08, TEST-09, TEST-10, BUG-01 or BUG-04; all start at 6.1. Rationale: prior PRs on those branches are MERGED or CLOSED from pre-reset runs and are not resumable state.
- 2026-10-18 [run] Round 1 dispatch order TEST-09, BUG-01, BUG-04 (wave 2, then wave 3 by ID; no priority field available). Rationale: fills the Max parallel items cap of 3 with a pairwise-disjoint set per shared_risk_notes.
- 2026-10-18 [run] Serialization: TEST-08 held behind BUG-04. Rationale: shared_risk_notes flags both on frontend/src/components/LandingPage.tsx; also no free slot this round. TEST-10 to be serialized against BUG-04 for the same file when it becomes ready.
- 2026-10-19 [run] Wave 2 boundary after TEST-09 merged. Follow-ups filed: none (BUG-01, TEST-09 and BUG-04 known improvements are all OPTIONAL or were applied; no unaddressed comments). Re-ingest found no new tracker item; graph unchanged: TEST-08 in flight, TEST-10 waits on TEST-08.
- 2026-10-19 [run] TEST-08 admitted to planning when BUG-01 merged, before BUG-04 merged. Rationale: plans may always run in parallel, and BUG-04 plan never touched LandingPage.tsx, so the shared-risk hold did not apply to the plan phase; BUG-04 merged before TEST-08 reached its build.
