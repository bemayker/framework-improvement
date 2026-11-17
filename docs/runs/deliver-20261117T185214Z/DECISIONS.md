# Decisions (cross-cutting): deliver-20261117T185214Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261117T185214Z

- [ingest] run=deliver-20261117T185214Z nodes=TEST-08,TEST-09,TEST-10,BUG-01,BUG-04 (items=42, done=7, to_verify=0, unmapped=30, link=0). Statuses come from item-status.sh over a live read of 38 tracker items and 5 local files.
- [ingest] label-ignored=BUG-01 (mayker:to-verify on todo: the label counts only on done, so the item reads as todo). BUG-01 stays a node and is built.
- [ingest] unmapped=30 items at tracker status "cancelled" (maps to null in reverse_status_mapping); dropped from the graph; none is a dependency of a node.
- [ingest] registered=none. Every tracker item is already in the registry and the map, so no register publish precedes the first dispatch.
- [ingest] feature_map.md not written: valid (42 rows, 43 edges), 0 wave proposals, 0 checkpoint proposals, 0 empty shared_risk_notes cells.
- [schedule] ready order TEST-09 (wave 2, chain 2), TEST-08 (wave 3, chain 2), BUG-01 (wave 3, chain 1), BUG-04 (wave 3, chain 0); TEST-10 (wave 4) waits on TEST-08 and TEST-09. Round 1 dispatches the first three at the cap of 3.
- [serialize] BUG-04 held behind TEST-08, and never concurrent with TEST-10: all three plausibly edit frontend/src/components/LandingPage.tsx.
- [serialize] BUG-01 planned alongside TEST-09; its build is held behind TEST-09's merge only if both File Manifests list backend/app/main.py.
- [resume] all 5 nodes start at Section 6.1: 0 remote feature/* heads, 0 node PRs, no plan artifacts, no worktrees.
- 2026-11-17 [run=deliver-20261117T185214Z] TEST-09, TEST-08 and BUG-01 plans self-approved on first pass (orchestrator verdicts logged in each item's decisions.md).
- 2026-11-17 [run=deliver-20261117T185214Z] TEST-09 and BUG-01 not serialized: whole-manifest unions disjoint (TEST-09 does not edit backend/app/main.py; BUG-01 does not edit docker-compose.yml or .env.example).
- 2026-11-17 [run=deliver-20261117T185214Z] TEST-08 not serialized against TEST-09 or BUG-01. Rationale: whole-manifest unions are disjoint for both pairs; the flagged TEST-08/TEST-09 shared risk is a runtime dependency on /api/version whose TEST-09 change is additive (commit field) and TEST-08 reads only version.
- 2026-11-17 [run=deliver-20261117T185214Z] [merge] BUG-01 merged (#848, squash 3e4fa86f); tracker complete + mayker:to-verify (deployed-only repro; awaits human verification). Checkpoint verdict=pass at 3e4fa86f.
- 2026-11-17 [run=deliver-20261117T185214Z] [merge] TEST-09 merged (#847, squash 2c073671); tracker complete. Checkpoint not due.
- 2026-11-17 [run=deliver-20261117T185214Z] [merge] TEST-08 merged (#849, squash f875d1d3); tracker complete. Checkpoint verdict=pass at f875d1d3 (first run of TEST-08 together with TEST-09 on main).
- 2026-11-17 [run=deliver-20261117T185214Z] [wave-2 boundary] Follow-ups: none filed. known-improvements: the merged PRs #847 and #848 list only OPTIONAL findings (never a source); unaddressed-comments: none.
- 2026-11-17 [run=deliver-20261117T185214Z] [ingest wave-2 boundary] nodes=TEST-08,TEST-10,BUG-04 (items=42 done=8 to_verify=1 unmapped=30 link=0 labels-ignored=0); registered=none; feature_map.md and project_state.json unchanged (map valid, 0 wave proposals, 0 checkpoint proposals).
- 2026-11-17 [run=deliver-20261117T185214Z] [schedule] TEST-08 merged during the re-ingest; BUG-04 (wave 3) and TEST-10 (wave 4) now ready. Both are planned in parallel (plans write only artifacts); their builds are serialized on frontend/src/components/LandingPage.tsx unless the two File Manifests turn out disjoint.
