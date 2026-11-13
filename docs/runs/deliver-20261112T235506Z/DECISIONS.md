# Decisions (cross-cutting): deliver-20261112T235506Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261112T235506Z

- [run] Ingestion: 12 items resolved (8 non-cancelled tracker, 4 local). Nodes TEST-08, TEST-09, TEST-10, BUG-01, BUG-04; 7 done dropped; cancelled tracker items are not nodes.
- [BUG-01] mayker:to-verify label on a todo item is ignored (counts only on done); BUG-01 stays a todo node and is built.
- [run] Resume: all five nodes start at 6.1. Reset commit 0418677 (#741) removed their code and plan artifacts from main; no feature branch, open PR, artifact directory or worktree survives.
- [run] Registry and map: registered=none, no register publish. 0 wave and 0 checkpoint proposals. Map valid at 42 rows, not written.
- [run] Shared-risk serialization pairs from existing notes: TEST-09 and BUG-01 (backend/app/main.py), TEST-08 and BUG-04 (LandingPage.tsx), TEST-10 and BUG-04 (LandingPage.tsx).
- [run] Order: TEST-09 (wave 2), then wave 3 by longer chain (TEST-08, BUG-01, BUG-04), then TEST-10 (wave 4, after TEST-08 and TEST-09). Round 1 plans TEST-09, TEST-08, BUG-01 in parallel; builds of BUG-01 held behind TEST-09 and BUG-04 behind TEST-08.
- [run] Conflict rule: TEST-09 and BUG-01 built concurrently; their whole-manifest unions were disjoint (TEST-09 extends the existing /api/version and does not modify backend/app/main.py), so the map note's main.py serialization did not apply.
- [run] Serialization: BUG-04 build held behind TEST-08 (orchestrator, overlap on notes.ts and LandingPage.test.tsx in the plan-time reading); released when TEST-08 merged at 9c91fa1. BUG-04's final manifest touched only NoteForm files.
- [run] Smoke-run hygiene: TEST-08's Phase D left its compose stack (project test-08) up on the configured ports; torn down by the session before the next Phase D. Later Phase D dispatches were told to stop their own stack.
- [run] Merged: TEST-09 #743 (b8c9cfd), BUG-01 #742 (0522812, to_verify: tracker complete with tag mayker:to-verify), TEST-08 #744 (9c91fa1), BUG-04 #745 (1f7a512), TEST-10 #746 (1624901). Checkpoints passed after BUG-01, TEST-08, BUG-04 and TEST-10.
- [run] Final boundary (wave 4, the last that drained): Follow-ups: none filed. known-improvements: every RECOMMENDED finding was applied by its gate (TEST-08's two); all remaining known improvements are OPTIONAL. unaddressed-comments: none (every merged PR had 0 comments; the one actionable tracker comment per TEST-08 and TEST-09 was addressed and answered).
- [run] Final-boundary re-ingest (Section W step 2): 42 items resolved (38 tracker, 4 local-only), nodes=0 done=11 to_verify=1 unmapped=30. Graph empty; the run proceeds to the report. registered=none; 0 wave and 0 checkpoint proposals; map and registry not written.
- [BUG-01] reads to_verify (tracker complete with tag mayker:to-verify): merged, awaiting human verification on the deployed environment.
- [run] Observation: the merged feature/ heads of BUG-01, BUG-04, TEST-08, TEST-09 and TEST-10 remain on origin after their squash merges; not deleted by this run.
- [run] Observation: the hand-authored prose line under feature_map.md's table (line 200) is stale against the tracker; left alone (outside the rows the writer owns).
