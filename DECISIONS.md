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

## Run deliver-20261105T180408Z

- [run] Graph: 5 nodes (TEST-08, TEST-09, TEST-10, BUG-01, BUG-04) from item-status.sh; 30 cancelled items unmapped (null in reverse_status_mapping) and dropped; BUG-01's mayker:to-verify label ignored on a to-do item, so it is built (MDF-515).
- [run] Resume: all five nodes start at 6.1. Reset commit a7ddb99 removed their code and artifacts from main, no feature/* branch or PR exists, tracker status is to do; the earlier feat(TEST-08)/feat(TEST-10) commits are not resume evidence.
- [run] Map: no rows added, proposal returned 0/0, no empty shared-risk cell on a node row; registered=none, so no register publish before round 1.
- [run] Round 1: TEST-09, TEST-08, BUG-01 to planning (wave then chain ordering); BUG-04 held by the cap of 3 and, at build, behind TEST-08 if both manifests list LandingPage.tsx; BUG-01's build behind TEST-09's merge only if both manifests list backend/app/main.py.
- [run] Round 1 build serialization: TEST-09 and BUG-01 built concurrently; the plan verdict found their whole-manifest unions disjoint (TEST-09 does not edit backend/app/main.py: its router was already registered by TEST-05).
- [TEST-08] Review B1: the documentation check deleted the BUILD_COMMIT paragraph of docs/DEVELOPMENT.md that in-flight TEST-09 relies on; fixed in review fix round 1 (closed by re-pass 1). R1: the refactor gate restored docs/DEVELOPMENT.md to main, so TEST-08 no longer touches it and cannot conflict with BUG-01's paragraph.
- [BUG-01] Merged PR #590 at 3438ec1 (squash); deployed-only, so the tracker reads complete + mayker:to-verify: awaiting a human check on the deployed host. Checkpoint pass at 5f90f89.
- [TEST-09] Merged PR #591 at 27df8f0 without rebasing onto BUG-01's merge: manifests disjoint. Checkpoint not due.
- [TEST-08] Merged PR #592 at 8cd79ca (squash). Checkpoint pass at 82cd733.
- [run] BUG-04 admitted in round 3 when BUG-01's merge freed a slot (cap 3); plan approved on first pass (criteria derived from the empty item's title; repro local-automated). Manifest disjoint from TEST-08.
- [run] Wave boundary (wave 2 drained with TEST-09): follow-ups filed none (BUG-01 known improvements OPTIONAL only; TEST-09 none; TEST-08 all findings applied; no unaddressed comments). Re-ingest: 2 nodes (BUG-04 in flight, TEST-10 newly ready), registered=none, 0 wave / 0 checkpoint proposals, map valid.
- [run] TEST-10 dispatched to planning beside BUG-04 without a hold; the pair is re-checked at TEST-10's build dispatch (hold only if its manifest lists NoteForm.tsx or NoteForm.test.tsx).
- [BUG-04] Merged PR #594 at 40b7822 (squash); repro before fail -> after pass; RECOMMENDED review finding applied by the refactor gate. Checkpoint pass at f4a8522; teardown of BUG-04-db done.
- [TEST-10] Merged PR #595 at 51797a0 (squash); review clean, refactor gate 1 improvement. Checkpoint pass at d5f0b74. Criterion 2 interpretation (pending/failure read "Task Notes", version alone when the commit is unusable) accepted by the merge verdict as reversible.
- [run] Final boundary: follow-ups filed none (no RECOMMENDED finding left unapplied, no unaddressed comment). Re-ingest: nodes=none (done=11, to_verify=1 BUG-01, unmapped=30 cancelled), registered=none, 0 proposals, map valid. The run goes to Section 8.
- [run] Residual: five merged feature/ branches remain on origin (BUG-01, BUG-04, TEST-08, TEST-09, TEST-10); left for a branch cleanup.
