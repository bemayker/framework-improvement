# Decisions (cross-cutting)

Autonomous-run decisions that affect more than one item (`autonomy.md` Section 3). Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

- 2026-09-03 [run deliver-20260903T125824Z] Added the edge TEST-08 depends_on TEST-05 to `.claude/feature_map.md` (row now `[TEST-04, TEST-05]`). Rationale: the TEST-08 plan consumes `GET /api/version`, which TEST-05 shipped, so it is a direct runtime dependency the schema's "direct dependencies only" rule wants recorded; TEST-05 is done, so the edge changes no readiness and no schedule.
- 2026-09-03 [run deliver-20260903T125824Z] Dispatched TEST-07 and TEST-08 concurrently in round 1 with no serialization hold. Rationale: TEST-07's whole-feature file set is under `backend/` and the union of every phase of TEST-08's File Manifest is under `frontend/src/`, `e2e/` and `.claude/artifacts/TEST-08/`; the only flagged pair involving TEST-07 is TEST-06, which is merged (PR #23), so nothing live overlaps.
- 2026-09-03 [run deliver-20260903T125824Z] Kept the `test_checkpoint` flags as written (TEST-07 and TEST-08 both `✅`, no new candidates). Rationale: the two are the graph's only sinks, no remaining item unblocks three or more rows, and a `✅` is never cleared by a recomputation.
- 2026-09-03 [run deliver-20260903T125824Z] TEST-07 merged first (PR #26 → ffbfc12); its test_checkpoint fired and passed (79 backend, 26 frontend tests on main), so admission stays open; readiness recomputed: no item newly unblocked (TEST-08 already in flight at 6.9, nothing else remains). Rationale: deliver 6.10 step 3 and Section 5.
- 2026-09-03 [run deliver-20260903T125824Z] TEST-08 merged second (PR #25 → a9695cc); its test_checkpoint fired on the integrated main (both merges present). Graph empty: no item remains, run proceeds to the report. Rationale: deliver 6.10 and Section 8.

- 2026-09-14 [deliver-20260914T095103Z] Run started under Autonomy `autonomous`; graph nodes FEAT-1, TEST-07, TEST-08 (all other items Done). Rationale: Section 2 skipped, `.claude/project_state.json` already present; rule stamps, status mapping and feature map all validated clean at Load Context.
- 2026-09-14 [run] Serialize TEST-07's build after FEAT-1's merge; dispatch TEST-07's plan concurrently. Rationale: both register a router in backend/app/main.py and edit backend/tests/unit/test_main_unit.py (whole-manifest union, MDF-048); a plan writes only its artifact directory so the plan phase carries no overlap.
- 2026-09-14 [run] Resolved FEAT-1 as plan_review rather than in_review despite the shared "to test" tracker status. Rationale: the branch carries plan commits only and PR #36 is a green draft; the read-back collision is tolerated by design and branch state is the disambiguator.
- 2026-09-14 [run] Dispatch order wave-ascending among ready items: FEAT-1 and TEST-07 (wave 2) then TEST-08 (wave 3); TEST-08 dispatched in the same round because no lower-wave item was ready for a build slot (TEST-07 held by the serialization above). Wave is an ordering key, never a gate.
- 2026-09-14 [TEST-07] Precondition in the 2026-09-07 tracker comment ("do not run /deliver until the revert has merged") verified satisfied: revert 0ac6818 (#29) is on main. Comment is a process note, not a feature change.
- 2026-09-14 [TEST-08] Tracker correction comment overrides acceptance criterion 2: the version is fetched from the backend at runtime via the existing GET /api/version (shipped by TEST-05), never from package.json. Carried into the planner dispatch verbatim.

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
