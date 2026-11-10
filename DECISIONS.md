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

## Run deliver-20261110T014719Z

- [run] ingest: 5 nodes (TEST-09, TEST-08, BUG-01, BUG-04, TEST-10); 7 done dropped (TEST-01..05, FEAT-1, BUG-05), 30 cancelled dropped as unmapped (none a dependency of a node).
- [run] label-ignored=BUG-01 (mayker:to-verify on todo counts only on done); BUG-01 stays a node and is built.
- [run] resume: all 5 nodes at 6.1. Ground truth: no feature branch on the remote, no item PR, no plan artifact, no item code on main (#678 reset the code of #674/#675).
- [run] BUG-01 ready on FEAT-1=complete in the tracker although FEAT-1's server_time code is absent from main; its plan must manifest server_time.py and main.py.
- [run] serialization (provisional, from map notes): TEST-09 before BUG-01 (main.py), TEST-08 before BUG-04 (LandingPage.tsx), BUG-04 before TEST-10 (LandingPage.tsx); re-judged on the plans' File Manifests.
- [run] order: TEST-09 (wave 2), then wave 3 by chain (TEST-08:2, BUG-01:1, BUG-04:0), then TEST-10 (wave 4). Round 1 plan dispatches: TEST-09, TEST-08, BUG-01 (cap 3; plans run in parallel regardless of overlap). BUG-04 queued for the next free slot.
- [run] merged this run so far: BUG-01 (#679, 5618c3f, to_verify: deployed-only criterion 3), TEST-09 (#680, 61039ee), TEST-08 (#681, f2d4e6f). Checkpoints after BUG-01 and TEST-08 passed on the integrated main.
- [run] BUG-04 admitted to planning when BUG-01 freed its slot; TEST-10 admitted once TEST-08 and TEST-09 merged (taken after BUG-04: wave 4 vs wave 3).
- [run] TEST-10 and BUG-04 run concurrently, no serialization. Rationale: whole-manifest union comparison (all phases) has an empty intersection, and neither plan touches the flagged LandingPage.tsx; CHORE-02 overlaps four TEST-10 files and is held behind TEST-10 if dispatched.
- [run] merged: BUG-04 (#682, 75ca40e), TEST-10 (#683, b6d039b). Checkpoints after BUG-04 and TEST-10 passed on the integrated main. All five nodes merged; no item blocked, no item unmerged-green.
- [run] Section W final boundary step 1: no follow-up filed. Sources read for all five merged items: known-improvements (no RECOMMENDED finding left unapplied: TEST-08 R1 and TEST-10 R1 applied, TEST-08 R2 declined with evidence from its Verify line; every remaining entry OPTIONAL) and unaddressed-comments (none).
- [re-ingest, final boundary] nodes=0. item-status.sh: items=42 nodes=0 done=11 to_verify=1 unmapped=30 link=0 labels-ignored=0, over a fresh full listing of ClickUp list 901524718831 (38 tasks, all in the registry) plus 4 local-only items. The backlog is drained; nothing to dispatch.
- [re-ingest] BUG-01 reads to_verify (complete + mayker:to-verify) and is dropped from the graph as merged-awaiting-verification; it stays for a human to verify on the deployed environment and remove the label.
- [re-ingest] No item filed since the run start: registered=none, no feature_map row or cell written, no register publish. feature-map-validate: valid (42 rows, 43 edges); feature-map-propose: 0 wave proposals, 0 checkpoint proposals.
- [run] TEST-08 standards provenance MISMATCH (information only): the reviewer report cites workflow_triggers.md as provenance without reporting reading it.
