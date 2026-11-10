# Decisions (cross-cutting): deliver-20261110T122117Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261110T122117Z

- [ingest] run=deliver-20261110T122117Z nodes=TEST-08,TEST-09,TEST-10,BUG-01,BUG-04, taken from item-status.sh (items=42 nodes=5 done=7 to_verify=0 unmapped=30 link=0 labels-ignored=1), never from a reading of status plus label.
- [ingest] label-ignored=BUG-01 (mayker:to-verify on todo: the label counts only on done, so the item reads as todo). BUG-01 is a node and is built.
- [ingest] unmapped=30 items at tracker status "cancelled", which maps to null in reverse_status_mapping: TEST-06, TEST-07, BUG-02, TEST-11, BUG-03, CHORE-01, CHORE-02, CHORE-03, TEST-12, TEST-13, TEST-14, CHORE-04, TEST-15, FEAT-2, CHORE-05, FEAT-3, CHORE-06, FEAT-4, FEAT-5, FEAT-6, FEAT-7, FEAT-8, FEAT-9, FEAT-10, FEAT-11, FEAT-12, FEAT-13, CHORE-1, FEAT-14, BUG-06. Not nodes, named here so none is dropped silently.
- [ingest] TEST-02 resolved from the tracker (complete), not from docs/issues/TEST-02.md: hybrid source, and the ID is in the registry. The local file agrees (done).
- [ingest] registered=none; feature_map.md unchanged: all 38 tracker items have a registry entry and a row. Proposal re-run gave 0 wave and 0 checkpoint proposals; shared-risk analysis not run (no empty cell).
- [ingest] No cycle; 2 live edges (TEST-08 to TEST-10, TEST-09 to TEST-10). Order: TEST-09 (wave 2), then TEST-08, BUG-01, BUG-04 (wave 3, by chain 2, 1, 0), then TEST-10 (wave 4).
- [ingest] Serialization planned from existing shared_risk_notes: TEST-09 and BUG-01 (backend/app/main.py), TEST-08 and BUG-04 (LandingPage.tsx), TEST-10 and BUG-04 (LandingPage.tsx). To be confirmed against the union of each File Manifest once plans exist.
- [ingest] Resume: all five nodes take the last arm (full lifecycle from 6.1); no branch, PR, plan artifact or worktree exists for any of them.
- [ingest] BUG-04's tracker task has an empty description, so it has no acceptance criteria and no local docs/issues file. The planner must derive criteria from the title, and the plan verdict should check that the assumption is recorded.
- [ingest] BUG-01 depends on FEAT-1 (tracker complete), but backend/app/routers/server_time.py and its registration are absent from main (main.py registers only version, notes, health). The dependency edge is satisfied by status; the plan must recreate the route, as the map's own note says.
- [schedule] Round 1 dispatches plans for TEST-09, TEST-08, BUG-01 (Max parallel items 3; plan phases may run in parallel, conflict holds apply from build on). BUG-04 waits for a free slot.
- [schedule] TEST-09 and BUG-01 built concurrently: their whole-manifest unions were disjoint (TEST-09 extended the existing /api/version and did not touch backend/app/main.py), so the planned main.py serialization was lifted.
- [schedule] BUG-04 build held behind TEST-08 (overlap on frontend/src/api/notes.ts and LandingPage.test.tsx); BUG-04 planned beside TEST-08 and built after TEST-08 merged. TEST-10 and BUG-04 then built concurrently (manifest union overlap 0).
- [merge] Merged in order: BUG-01 #698 (to_verify), TEST-09 #699, TEST-08 #700, BUG-04 #701, TEST-10 #702; every merge followed an orchestrator merge verdict and a green 7/7 check re-read; each test_checkpoint passed on the integrated main.
- [W] Final boundary: follow-ups filed none (no RECOMMENDED finding left unapplied by a refactor gate; no comment unaddressed at merge). OPTIONAL known improvements stay on their PRs (#698, #702).
- run=deliver-20261110T122117Z Section W step 2 (final boundary): re-ingested 42 items (38 tracker, 4 local-only); item-status.sh reads nodes=0 done=11 to_verify=1 unmapped=30. No item arrived since the first ingestion, so nothing is registered, no map row or cell is written, and the run proceeds to its report.
- [ingest] BUG-01 reads to_verify (tracker complete plus the label mayker:to-verify, no to_verify key in status_mapping); it is not verified until a human removes the label after the deployed check.
