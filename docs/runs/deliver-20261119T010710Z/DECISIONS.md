# Decisions (cross-cutting): deliver-20261119T010710Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261119T010710Z

- [run] run=deliver-20261119T010710Z ingest: 42 items read (37 tracker from the session's probe, 4 local, TEST-02 resolved from the tracker under hybrid); nodes=TEST-08,TEST-09,TEST-10,BUG-01,BUG-04 per item-status.sh (nodes=5 done=7 to_verify=0 unmapped=30 link=0 labels-ignored=1).
- [run] label-ignored=BUG-01 (mayker:to-verify on todo: the label counts only on done, so the item reads as todo); BUG-01 stays a todo node and is built.
- [run] unmapped (30 items, "cancelled" maps to null): TEST-06, TEST-07, BUG-02, BUG-03, TEST-11..TEST-15, CHORE-01..CHORE-06, FEAT-2..FEAT-14, CHORE-1, BUG-06; dropped from the graph, never scheduled or written to.
- [run] Resume: all five nodes take the full lifecycle from 6.1. Commits #911 (BUG-04) and #912 (TEST-10) are on main but reset #915 followed them; no feature/* remote head, no node PR, no plan artifact and no worktree exists, and the tracker reads "to do" for both, so ground truth says not delivered.
- [run] BUG-01 treated as ready: its dependency FEAT-1 is complete in the tracker, though its server_time code is absent from main after the reset. Readiness follows status; the map's shared-risk note already tells BUG-01 to recreate the router.
- [run] Registry and map: registered=none; feature_map.md valid and not written. No register publish needed.
- [run] Serialization: TEST-09 before BUG-01 (main.py), TEST-08 before BUG-04 and BUG-04 before TEST-10 (LandingPage.tsx), from shared_risk_notes. Plans run in parallel (plans write only artifacts); build holds re-judged on whole-feature File Manifest unions once plans exist.
- [run] No cycle detected; no edge dropped.
- [run] Merged: TEST-09 (PR 916, a5357b27), BUG-01 (PR 917, 97f1b156, to_verify via mayker:to-verify), TEST-08 (PR 918, a116f048), in orchestrator merge order; auto-done runs 44436696999, 44436715190, 44436730823 all succeeded.
- [run] Checkpoint after merges: due=yes items=TEST-08,BUG-01 verdict=pass head=a116f048 (64 pytest passed 14 skipped + 34 vitest passed).
- [run] Wave boundary (wave 2 drained): follow-ups filed none (every known improvement on 916/917/918 is OPTIONAL; no unaddressed comments).
- [re-ingest, wave boundary after wave 2] Whole backlog re-read (38 tracker tasks, 4 local files): items=42 nodes=2 done=9 to_verify=1 unmapped=30. No item filed since run start; registered=none; map and registry not written.
- [readiness] BUG-04 ready (TEST-03 done); TEST-10 newly ready (TEST-08 and TEST-09 done at a116f048, checkpoint pass). Wave is an ordering key only, so TEST-10 takes a free slot beside wave 3's BUG-04.
- [serialization] BUG-04 and TEST-10 stay a shared-risk pair on frontend/src/components/LandingPage.tsx and its test; plans run concurrently, builds serialized BUG-04 first, re-judged on the union of both File Manifests.
- [run] Out-of-wave-order dispatch note: round 1 planned BUG-01 and TEST-08 (wave 3) beside TEST-09 (wave 2) because slots were free and no other lower-wave item was ready.
- [run] Serialization lifted: BUG-04 and TEST-10 whole-feature File Manifests are disjoint (BUG-04: NoteForm.tsx, NoteForm.test.tsx, its own E2E/UAT files; TEST-10: version.ts, version.test.ts, AppFooter.tsx, AppFooter.test.tsx, LandingPage.test.tsx, TEST-08 E2E spec, its own UAT files). The orchestrator's TEST-10 verdict named a LandingPage.test.tsx overlap from shared_risks without reading BUG-04's plan; BUG-04's plan line 20 states LandingPage.tsx and LandingPage.test.tsx are not touched. Builds run concurrently; Phase D smoke runs are held one at a time (ports).
- [run] TEST-10 Phase D held behind BUG-04: smoke run ports
- [run] Merged: BUG-04 (PR 920, bb8e3629, auto-done run 44439257835 succeeded) and TEST-10 (PR 921, 05b8eb98, auto-done run 44439513100 succeeded); checkpoint due=yes items=TEST-10,BUG-04 verdict=pass head=05b8eb98. BUG-04-db torn down.
- [run] TEST-10 CI attempt 1 red (integration): psycopg UniqueViolation pg_type_typname_nsp_index (notes) at fixture setup in every backend integration test, a concurrent CREATE TABLE race in the CI database; classified infra/flake. gh run rerun --failed refused by GitHub (Resource not accessible by personal access token); mapping fallback empty commit 0a207021 re-triggered; attempt 2 green. The race lives in the shared integration fixture and can recur on any PR.
- [run] Final boundary: follow-ups filed none (BUG-04 and TEST-10 RECOMMENDED findings were applied by their gates; no unaddressed comments).
- [re-ingest, final boundary] main 05b8eb98: items=42 nodes=0 done=11 to_verify=1 unmapped=30 link=0 labels-ignored=0; registered=none; map valid (42 rows, 43 edges); graph empty, run proceeds to its report. BUG-01 remains to_verify for a human check on the deployed environment.
