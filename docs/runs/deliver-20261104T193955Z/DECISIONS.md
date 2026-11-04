# Decisions (cross-cutting): deliver-20261104T193955Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261104T193955Z

- [run] Graph: 5 nodes (TEST-08, TEST-09, TEST-10, BUG-01, BUG-04); 7 done dropped, 30 cancelled unmapped. BUG-01's mayker:to-verify ignored at "to do" (label-ignored=BUG-01), scheduled as a todo node.
- [run] Map reconcile: no rows added, registered=none; 0 wave and 0 checkpoint proposals; validator passed on 42 rows.
- [run] Serialization TEST-09 / BUG-01 on backend/app/main.py: BUG-01 planned concurrently, its build held behind TEST-09's merge unless the File Manifest unions prove disjoint.
- [run] Serialization TEST-08 / BUG-04 on frontend/src/components/LandingPage.tsx: BUG-04 held until TEST-08 merges; TEST-08 takes the slot on chain length (TEST-08 -> TEST-10).
- [run] Round 1: plan TEST-09, TEST-08, BUG-01 (3 slots). Every 3-subset of the four ready items holds a flagged pair, so the third slot plans BUG-01 instead of building into an overlap.
- [run] Resume: no feature/ branch, PR, artifact or worktree exists for any node; all five start at 6.1.
- [run] BUG-01 plan self-approved, Repro class deployed-only (to_verify after merge, PR takes mayker:to-verify).
- [run] TEST-09 plan self-approved. BUG-01 build hold released: whole-feature File Manifest unions of TEST-09 (12 files) and BUG-01 (10 files) are disjoint; backend/app/main.py is in BUG-01's only. Re-apply the hold if a BUG-01 re-plan adds a file in TEST-09's union.
- [run] TEST-08 plan self-approved. BUG-04 hold behind TEST-08 kept, re-based from LandingPage.tsx to frontend/src/api/notes.ts and frontend/src/components/LandingPage.test.tsx; BUG-04 may plan when a slot frees, build held until TEST-08 merges or the unions are shown disjoint.
- [run] Round 2: builds dispatched for TEST-09 (Phase B), BUG-01 (Phase B), TEST-08 (Phase A); merged-since clean on all three (base=3e00ad2 forced, commits=0).
- [run] Merge verdicts: TEST-09, BUG-01, TEST-08 merged in PR order #547 (f542b6a), #548 (b8e3073), #549 (8488648), squash; all cleared autonomy.md Section 5; manifests pairwise disjoint. mergeable read UNKNOWN before #548 and #549 (provider recomputing); both merges succeeded.
- [run] BUG-01 merged into to_verify (complete + tag mayker:to-verify): criterion 3 is a deployed-only human check; revertable fix, not the escalation bar.
- [run] Post-merge: auto-done runs 41902632341, 41902648342, 41902664780 succeeded; checkpoint BUG-01 and TEST-08 verdict=pass on head 8488648 (pytest 62 passed 14 skipped, vitest 37 passed); TEST-09 not-due.
- [run] Wave-2 boundary: follow-ups filed none (TEST-09 known improvements all OPTIONAL; BUG-01 and TEST-08 none outstanding; no unaddressed comments).
- [run] Wave-2 re-ingest: 2 nodes (BUG-04, TEST-10); no new task; registered=none; validator passed on 42 rows.
- [run] Round 3: plan BUG-04 and TEST-10 concurrently; TEST-10 build held until BUG-04 merges or the whole-feature manifest unions are disjoint (candidate overlap LandingPage.test.tsx).
