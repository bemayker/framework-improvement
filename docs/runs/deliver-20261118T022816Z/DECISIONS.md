# Decisions (cross-cutting): deliver-20261118T022816Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261118T022816Z

- [ingest] run=deliver-20261118T022816Z nodes=TEST-08,TEST-09,TEST-10,BUG-01,BUG-04 (item-status.sh: items=42 nodes=5 done=7 to_verify=0 unmapped=30 link=0 labels-ignored=1). Whole backlog, no scope.
- [ingest] label-ignored=BUG-01 (mayker:to-verify on todo: the label counts only on done, so the item reads as todo). BUG-01 is a todo node and is built.
- [ingest] unmapped=30 cancelled items dropped from the graph; none is a dependency of a node.
- [ingest] registered=none; feature_map.md not written (propose: 42 rows, 0 wave proposals, 0 checkpoint proposals). No register publish needed.
- [ingest] TEST-10 (#880) and BUG-04 (#879) were merged by an earlier run and removed by the reset #883 (main d7663f0d); tracker reads "to do", no branch/PR/artifact survives. Both built from zero (Section 6.1).
- [ingest] BUG-01 is ready (FEAT-1 complete) although backend/app/routers/server_time.py is absent after the reset; build it, its plan must recreate the route it fixes. Serialized against TEST-09 on backend/app/main.py.
- [ingest] Provisional serialization from shared_risk_notes: TEST-09 before BUG-01 (main.py), TEST-08 before BUG-04 (LandingPage.tsx), TEST-10 against BUG-04 (LandingPage.tsx); re-checked against plan File Manifests.
- [ingest] Planned order: 1. TEST-09 || TEST-08; 2. BUG-01 || BUG-04; 3. TEST-10. Wave is an ordering key only.
- [schedule] Round 1 dispatches plans for TEST-09, TEST-08, BUG-01 (plan phases may run in parallel; build serialization applies from 6.3).
- [schedule] BUG-01 plan self-approved (orchestrator, logged in item decisions.md); repro classified deployed-only.
- [schedule] TEST-09 plan self-approved. Lifted the provisional TEST-09/BUG-01 serialization: the two File Manifests share no path on the union of all phases (TEST-09 leaves backend/app/main.py untouched; version router already registered on main d7663f0d).
- [schedule] Round 2: TEST-09 and BUG-01 cut from origin/main@d7663f0d into worktrees; merged-since clean for both (base=d7663f0d forced, commits=0); Phase B dispatched concurrently. TEST-08 plan verdict in flight.
- [schedule] TEST-08 plan self-approved (fifth criterion from the tracker correction judged scope-contained); built in parallel with TEST-09 and BUG-01 (3 of 3 slots).
- [merge] TEST-09 #884 squash 86061716, TEST-08 #886 squash be43bd71, BUG-01 #885 squash d6321661 (deployed-only; label mayker:to-verify). Orchestrator merge verdicts logged per item; order TEST-09, TEST-08, BUG-01 (no shared path).
- [post-merge] auto-done succeeded for all three (runs 44226008617, 44226036487, 44226053001); TEST-09 and TEST-08 complete, BUG-01 complete + tag mayker:to-verify (to-verify arm). Checkpoints: TEST-08 pass, BUG-01 pass (head d6321661); TEST-09 not-due.
- [wave-2] Follow-ups: none filed (every merged item's known improvements are OPTIONAL; no unaddressed comments).
- [ingest] Re-ingestion at the wave-2 boundary: item-status items=42 nodes=2 done=9 to_verify=1 unmapped=30; nodes BUG-04, TEST-10. registered=none; map not written (0 wave, 0 checkpoint proposals; valid 42 rows, 43 edges).
- [schedule] BUG-04 and TEST-10 plan in parallel; builds provisionally serialized BUG-04 before TEST-10 (LandingPage.tsx note, LandingPage.test.tsx overlap); hold re-checked against the union of both File Manifests. The TEST-08/BUG-04 hold closed with TEST-08's merge.
- [publish] wave-2: PR #887 merged (arm=opened merge=merged); checkout returned to main@c9f192a4.
- [schedule] BUG-04 plan self-approved (title-derived criteria, scope-contained); repro local-automated (NoteForm component test).
- [schedule] TEST-10 plan self-approved; residual doubt on criterion 2's reading (pending/failed stays "Task Notes" per TEST-08) logged for a human. Lifted the provisional BUG-04/TEST-10 build serialization: 0 shared paths on the union of all phases.
- [schedule] Round 6: BUG-04 and TEST-10 cut from origin/main@c9f192a4; merged-since clean for both (commits=0); Phase A dispatched concurrently.
- [schedule] TEST-10 Phase D held behind BUG-04: smoke run ports (released when BUG-04's Phase D returned).
- [merge] BUG-04 #888 squash 6c728544 (repro before fail -> after pass), TEST-10 #889 squash 1381bd71. Orchestrator merge verdicts logged per item; no shared path.
- [post-merge] auto-done succeeded for both (runs 44228970937, 44228989585); both complete. Checkpoints BUG-04 pass, TEST-10 pass (head 1381bd71). BUG-04-db torn down.
- [wave-4] Follow-ups: none filed (no RECOMMENDED known improvements left; no unaddressed comments).
- [ingest] Final-boundary re-ingest (main @ 1381bd71): items=42 nodes=0 done=11 to_verify=1 unmapped=30; registered=none; map valid, not written. Graph empty: proceeding to the report.
