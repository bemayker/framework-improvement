# Decisions (cross-cutting): deliver-20261029T181219Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261029T181219Z

- [ingest] Graph: 5 nodes (TEST-09, TEST-08, BUG-01, BUG-04, TEST-10), 2 live edges, no cycles; scaffold TEST-01 done. Cancelled tracker items (TEST-06/07, BUG-02/03, TEST-11..15, CHORE-01..06, FEAT-2..13) are not nodes.
- [ingest] Reconcile: no missing rows, registered=none, 0 wave and 0 checkpoint proposals; shared-risk analysis inferred the 4 empty cells (all cancelled rows) and appended 3 partner cells, 0 new pairs among nodes; map re-validated.
- [resume] All five nodes at 6.1: no feature branch on origin or locally, no PR, no artifacts, no worktree.
- [schedule] Round 1: TEST-09, TEST-08, BUG-01 in parallel (wave, then chain length, then ID). BUG-01's build held behind TEST-09 unless their approved manifests are disjoint on backend/app/main.py.
- [serialize] BUG-04 held until TEST-08 merges (LandingPage.tsx); TEST-10 after TEST-08 and TEST-09, serialized after BUG-04 (LandingPage.tsx).
- [note] BUG-04 has no description or acceptance criteria in the tracker; planner assumptions go in the plan and PR. BUG-01 carries mayker:to-verify; its merge takes the to_verify arm.
- [merge] BUG-01 merged (#384, dd22f72) on the orchestrator's verdict; tracker complete + mayker:to-verify (to_verify arm; deployed-only repro). Checkpoint pass at d84c0bb.
- [merge] TEST-09 merged (#385, d84c0bb) on the orchestrator's verdict; tracker complete. Checkpoint not due.
- [merge] TEST-08 merged (#386, 39c15ae) on the orchestrator's verdict, without a branch update: the main commits since its CI were disjoint from its files. Tracker complete. Checkpoint pass at 39c15ae.
- [wave] Wave 2 drained (TEST-09). Follow-ups filed: none; known-improvements read for BUG-01, TEST-09 and TEST-08 (every RECOMMENDED finding was applied at the gate; TEST-09's one OPTIONAL is not a source); unaddressed-comments read (none).
- [re-ingest] Wave-2 boundary: tracker re-read (35 tasks, all registered, none mayker:link, none new); BUG-01, TEST-09, TEST-08 merged and dropped; graph is 2 nodes (BUG-04, TEST-10), both ready, 0 edges, no cycles; registered=none; 0 wave and 0 checkpoint proposals; map re-validated.
- [shared-risk] Narrowed the BUG-04/TEST-10 overlap on the merged code: TEST-08 did not touch LandingPage.tsx, BUG-04's fix lives in NoteForm.tsx, TEST-10's in AppFooter.tsx and api/version.ts; the only plausible shared file is LandingPage.test.tsx. Appended to both rows' shared_risk_notes.
- [resume] BUG-04 and TEST-10 both at 6.1: no branch, PR, artifacts or worktree.
- [schedule] Round 2: BUG-04 and TEST-10 planning in parallel (wave 3 before wave 4 for slot order). Builds concurrent only if the approved File Manifests are disjoint; else TEST-10's build waits for BUG-04's merge.
- [note] BUG-04 still has no description or acceptance criteria; planner assumptions go in the plan and PR. Both items are authored test checkpoints; each merge runs the full suite at 6.10.
