# Decisions (cross-cutting): deliver-20261109T204823Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261109T204823Z

- [ingest] nodes=BUG-04,BUG-01,TEST-10,TEST-09,TEST-08 from item-status.sh (items=42 nodes=5 done=7 unmapped=30). The 30 unmapped items read "cancelled", which maps to null in reverse_status_mapping; dropped from the graph, not scheduled.
- [ingest] label-ignored=BUG-01 (mayker:to-verify on todo: the label counts only on done, so the item reads as todo). BUG-01 stays a todo node and is built.
- [ingest] registered=none; feature_map.md valid and unwritten (0 rows added, 0 wave proposals, 0 checkpoint proposals, 0 shared-risk cells empty). No register publish before round 1.
- [ingest] No cycle. Scaffold TEST-01 is done, gate passes. All dependencies of TEST-09, TEST-08, BUG-01 and BUG-04 are done; TEST-10 is blocked by TEST-08 and TEST-09.
- [resume] All 5 nodes: full lifecycle from 6.1 (0 remote feature/ branches, 0 PRs, 0 worktrees, 0 plan artifacts).
- [schedule] Round 1 order: TEST-09 (wave 2), then wave 3 by chain length: TEST-08 (chain 2), BUG-01 (chain 1), BUG-04 (last).
- [schedule] Round 1 dispatch: plans for TEST-09, TEST-08 and BUG-01 (cap 3). BUG-01's plan runs beside TEST-09's because items in their plan phase may always run in parallel (Section 5 step 2); its build stays serialized behind TEST-09 on the flagged shared risk (backend/app/main.py) until the File Manifest unions are compared. BUG-04 serialized behind TEST-08 (LandingPage.tsx).
- 2026-11-09 [run] [schedule] Lifted the build serialization of BUG-01 behind TEST-09; the two builds run concurrently. Rationale: the whole-manifest unions are disjoint (overlap=0 of 10 and 12 entries); the flagged shared risk on backend/app/main.py was a pre-plan guess that TEST-09's plan refutes (main.py unchanged, version router already registered), and BUG-01 touches neither docker-compose.yml nor config.py.
- 2026-11-09 [run] [plan] TEST-09 and BUG-01 plans self-approved by the orchestrator; both in 6.4 Phase B. BUG-01 reproduction classified deployed-only (edge cache exists only on the deployed environment).
- 2026-11-09 [run] [schedule] TEST-08 builds concurrently with TEST-09 and BUG-01. Rationale: whole-feature File Manifests (union of all phases) are disjoint, frontend and e2e against backend, compose and env files; TEST-09's response change is additive and TEST-08 reads only `version`.
- 2026-11-09 [run] [merge] TEST-09 merged (PR #672, squash 78c3ab3); auto-done: run 42699045664 succeeded; tracker complete. BUG-01 merged (PR #671, squash 649c590) with mayker:to-verify; auto-done: run 42699193278 succeeded; tracker complete + tag mayker:to-verify (awaiting human verification on the deployed environment).
- 2026-11-09 [run] [checkpoint] BUG-01 test_checkpoint: verdict=pass head=649c590 (pytest 62 passed, 14 skipped; vitest 26 passed). TEST-09 not-due.
- 2026-11-09 [BUG-04, TEST-08] Serialization hold on BUG-04 behind TEST-08 released; BUG-04's build starts while PR #673 is in CI. Rationale: the hold rested on the map's LandingPage.tsx guess, and neither plan modifies that file; the unions of all phases of the two File Manifests (6 and 14 files) share 0 files. Phase D smoke runs remain one at a time (TEST-08's is done).
- 2026-11-09 [run] [merge] TEST-08 merged (PR #673, squash dfb3c70); auto-done: run 42700249052 succeeded; checkpoint verdict=pass head=dfb3c70. BUG-04 merged (PR #674, squash 6a768bb); auto-done: run 42702031049 succeeded; checkpoint verdict=pass head=6a768bb; BUG-04-db torn down. TEST-10 merged (PR #675, squash 38c252d); auto-done: run 42702731789 succeeded; checkpoint verdict=pass head=38c252d.
- 2026-11-09 [run] [schedule] TEST-10 build started concurrent with BUG-04: whole-manifest unions disjoint (9 and 6 entries, overlap 0); the inferred LandingPage.tsx flag lifted because neither plan touches it.
- 2026-11-09 [run] [follow-ups] Section W step 1 (final boundary): none filed. known-improvements: every RECOMMENDED finding was applied by its refactor gate (TEST-08, BUG-04); remaining entries are OPTIONAL (TEST-09, TEST-08, TEST-10). unaddressed-comments: none.
- run=deliver-20261109T204823Z Section W step 2 re-ingest (final boundary, main 38c252d): 42 items read (38 tracker, 4 local), nodes=0 by item-status.sh (done=11 to_verify=1 unmapped=30). Graph empty; nothing to dispatch; run proceeds to the report.
- BUG-01 reads to_verify (complete + mayker:to-verify) and is dropped from the graph as merged-awaiting-verification, not rescheduled; it is left for a human on the report.
- No new tracker item since the last ingest: registered=none, no map row added, 0 wave and 0 checkpoint proposals. feature_map.md and project_state.json untouched by this run.
