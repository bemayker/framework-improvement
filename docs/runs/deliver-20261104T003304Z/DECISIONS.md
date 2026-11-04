# Decisions (cross-cutting): deliver-20261104T003304Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261104T003304Z

- [run] ingestion: 42 items resolved (38 tracker, 4 local), nodes=5 (TEST-08, TEST-09, TEST-10, BUG-01, BUG-04), done=7, unmapped=30 (all cancelled, mapped to null), link=0. Source: item-status.sh.
- [BUG-01] label-ignored: mayker:to-verify on a todo item counts only on done; BUG-01 scheduled as a todo node.
- [run] reconcile: 0 rows added, registered=none, 0 wave / 0 checkpoint proposals, 0 shared-risk cells inferred, map valid (42 rows, 43 edges). No register publish needed.
- [run] resume: every node starts the full lifecycle at 6.1 (no feature branch on origin, no item PR, no artifacts, no worktrees).
- [run] dispatch order: TEST-09, TEST-08, BUG-01 first (wave, chain, ID); BUG-04 held behind TEST-08 (shared risk LandingPage.tsx); BUG-01 build serialized after TEST-09 if both manifests list backend/app/main.py; TEST-10 blocked on TEST-08 and TEST-09.
- [run] round 1 to 3: TEST-09, TEST-08 and BUG-01 planned, built, reviewed and merged concurrently (no whole-manifest overlap; BUG-04 held only by the cap once TEST-08's approved plan left LandingPage.tsx untouched). Merged: TEST-08 #517 b4d4bb8, BUG-01 #518 84c1b02 (to_verify, deployed-only repro), TEST-09 #519 e6c97b8.
- [TEST-09] self-review BLOCKING 1 (README line 70) disproved in fix round 1 and accepted by re-pass 1; the first pass read the diff direction backwards.
- [run] checkpoint after BUG-01 and TEST-08: due=yes verdict=pass head=e6c97b8; TEST-09 not flagged (not-due).
- [run] Section W wave-2 boundary, step 1: no follow-ups filed. known-improvements: every merged PR lists none (TEST-08's RECOMMENDED finding was applied by its gate); unaddressed-comments: none at merge on any item.
- [run] Section W step 2 re-ingest: 42 items resolved, nodes=TEST-10,BUG-04 (done=9 to_verify=1 unmapped=30). Reconcile wrote nothing (registered=none, propose 0/0, map valid). BUG-04 and TEST-10 dispatched to planning concurrently; TEST-10's build serializes behind BUG-04's merge only if the approved whole-manifest unions share a file.
- [run] round 4 to 6: BUG-04 and TEST-10 planned, built, reviewed and merged concurrently (whole-manifest unions disjoint). TEST-10 Phase D held behind BUG-04: smoke run ports. Merged: TEST-10 #521 c651d8d, BUG-04 #522 90fa8ba.
- [BUG-04] self-review BLOCKING 1 (plan-recorded disabled button style missing) fixed in fix round 1 (1647c15) and closed by re-pass 1. Repro: before fail -> after pass. Tracker description empty; criteria derived from the title.
- [run] checkpoints after TEST-10 and BUG-04: due=yes verdict=pass head=90fa8ba.
- [run] Section W final boundary, step 1: no follow-ups filed. known-improvements: TEST-10 lists two OPTIONAL findings only, BUG-04 none; unaddressed-comments: none at merge.
- [run] Section W final boundary, step 2 re-ingest: 42 items resolved (38 tracker, 4 local); nodes=0 done=11 to_verify=1 unmapped=30; backlog drained. Reconcile wrote nothing (registered=none, propose 0/0, map valid 42 rows 43 edges). BUG-01 stays to_verify (complete with mayker:to-verify).
