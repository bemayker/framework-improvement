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

## Run deliver-20261024T075247Z

- [run] Graph: 5 open nodes (TEST-09, TEST-08, BUG-04, TEST-10, BUG-01) from the live tracker listing; TEST-02/BUG-05 complete and 23 cancelled items dropped; 5 local items all done, scaffold TEST-01 done. No cycle.
- [run] BUG-01 held blocked for the run: its only dependency FEAT-1 is cancelled, which is neither done nor to_verify under the readiness rule; reported for a human (re-open FEAT-1 or re-point/cancel BUG-01).
- [run] No map write: all nodes have rows, proposal helper returned 0/0, registry holds all five IDs (registered=none, Feature ID write-back 0).
- [run] Shared risk inferred over the 4 empty cells; 0 notes written.
- [run] Round 1: TEST-09, TEST-08, BUG-04 to 6.1 in parallel (wave order 2,3,3; TEST-08 before BUG-04 on chain length). BUG-04 held at 6.3 behind TEST-08 on the map's shared-risk pair, to be confirmed on the manifest union.
- [run] Resume: fresh on every node (no feature branch, no item PR, no surviving unit); the pre-reset merges #324/#317 are not resume evidence.
- [run] Merged: TEST-09 PR #328 (88cb3f1), BUG-04 PR #329 (3dd4f2a), TEST-08 PR #330 (da9fa75); each on the orchestrator's merge verdict with all autonomy.md Section 5 conditions met. Test checkpoints after BUG-04 and TEST-08 passed on the integrated main.
- [run] Wave boundary (waves 2 and 3 drained): follow-ups filed none (no RECOMMENDED finding left unapplied, no comment unanswered at merge; OPTIONAL findings stay on their PRs).
- [run] Re-ingestion: graph reduced to TEST-10 (ready since TEST-08 and TEST-09 merged) and BUG-01 (blocked, depends_on FEAT-1 cancelled). registered=none, map not written, 0 proposals, 0 new shared-risk pairs.
- [run] Round 3: TEST-10 dispatched alone from 6.1, no hold (its shared-risk partners BUG-04 merged and CHORE-02 cancelled).
- [run] Wave-3 publish: [publish] arm=opened branch=chore/mayker-deliver-20261024T075247Z-wave-3 pr=https://github.com/bemayker/framework-improvement/pull/331 merge=merged (9a49388); pr-tests was a required check on main at merge time.
- [run] Merged: TEST-10 PR #332 (23fc827) on the orchestrator's merge verdict; checkpoint after TEST-10 passed on the integrated main.
- [run] Final boundary (wave 4 drained): follow-ups filed none (TEST-10's two RECOMMENDED findings were applied by its refactor gate; no comment unanswered at merge).
- [run] Re-ingestion (recomputation 3): BUG-01 is the only remaining node and stays blocked (depends_on FEAT-1, cancelled). Nothing dispatchable; the run proceeds to its report. Human action: revive FEAT-1, or re-point or cancel BUG-01.
- [run] Report: terminal state blocked; 4 delivered (TEST-09 #328, BUG-04 #329, TEST-08 #330, TEST-10 #332), 1 blocked (BUG-01 on cancelled FEAT-1). Stats carry a Degraded line: this session opened the 3.orchestrator re-ingestion windows inside the open step-W window, which the collector reads as an overlap (a marker-writer defect of this run, reported to the framework maintainers, not filed to the project tracker).
- [run] Standards provenance figures (15 of 37 dispatches) are self-reported, not measured.
