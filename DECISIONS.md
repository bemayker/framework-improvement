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

## Run deliver-20261119T001937Z

- [run] Ingest: 42 items read (38 tracker, 4 local); nodes=TEST-08,TEST-09,TEST-10,BUG-01,BUG-04; 7 done and 30 cancelled dropped (cancelled maps to null in reverse_status_mapping).
- [BUG-01] mayker:to-verify label ignored on a todo item; merged fix #904 (5dce121e) was removed from main by reset #907 (49c5d32d), so the item is rebuilt from 6.1.
- [run] Resume: all five nodes start at 6.1. Merged PRs #903/#904/#905 were reverted by reset #907; code on main and tracker status agree they are unfinished.
- [BUG-01] Dependency FEAT-1 is complete in the tracker but its server_time code is absent from main; readiness follows status, so the plan must recreate the router.
- [run] Registry and map: nothing missing, registered=none; map valid, 0 wave and 0 checkpoint proposals.
- [run] Dispatch order (cap 3): TEST-09 (wave 2), TEST-08 (wave 3, chain 2), BUG-01 (wave 3, chain 1); BUG-04 (wave 3) held behind TEST-08 on LandingPage.tsx; TEST-10 (wave 4) waits on TEST-08 and TEST-09.
- [run] Serialization: TEST-09/BUG-01 builds serialize if both whole-feature manifests list backend/app/main.py, decided at plan verdict.
- [run] Order: BUG-01 checkpoint (dd171eb8) and TEST-08 checkpoint (c9764f34) passed; TEST-10 admitted after TEST-08 and TEST-09 merged; BUG-04 and TEST-10 run concurrently (whole-feature manifests disjoint, orchestrator verdicts).
- [run] TEST-10 Phase D held behind BUG-04: smoke run ports (BUG-04's refactor gate may re-run its E2E spec on the configured Base URL; held conservatively although that dispatch is not a Phase D).
- [run] Final boundary (wave 4): follow-ups filed none; known-improvements source read for all five merged items (no RECOMMENDED left unapplied: BUG-04's two applied at its gate, TEST-08's one discharged by its own Verify-by-running check), unaddressed-comments source read (none).
- [run] Final-boundary re-ingest: 42 items (38 tracker from a fresh listing, 4 local); nodes=0 done=11 to_verify=1 unmapped=30; registered=none; map valid, 0 proposals. The run ends with the graph empty.
- [BUG-01] Merged and complete with tracker tag mayker:to-verify: not verified until a human runs the deployed check and removes the label.
- [run] BUG-06 carries mayker:to-verify on a cancelled item; not a pending verification.
