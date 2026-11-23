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

## Run deliver-20261123T201421Z

- [run] Ingestion: 52 items resolved (48 tracker, 4 local); nodes TEST-08, TEST-09, TEST-10, BUG-01, BUG-04; 40 cancelled items unmapped and dropped; scaffold TEST-01 done; registered=none.
- [run] BUG-01 carries mayker:to-verify on a todo status; the label counts only on done, so it is built as todo.
- [run] BUG-04 and TEST-10 take the full lifecycle: reset #963 reverted #959/#960, the tracker reads to do and no branch, PR or artifact survives.
- [run] Round 1 dispatch order: TEST-09 (wave 2), TEST-08 (wave 3, chain 2), BUG-01 (wave 3, chain 1) planned in parallel; BUG-04 waits for a free slot (Max parallel items 3). Build serialization pairs pending File Manifests: TEST-09/BUG-01 (main.py), TEST-08/BUG-04 and TEST-10/BUG-04 (LandingPage.tsx).
- [run] Plans for TEST-09, TEST-08 and BUG-01 ran in parallel. TEST-09's manifest does not list backend/app/main.py, so the TEST-09/BUG-01 serialization pair cleared and both built concurrently. TEST-08's manifest does not list LandingPage.tsx, so TEST-08/BUG-04 and TEST-10/BUG-04 cleared as well.
- [run] Merged: BUG-01 (#964, to_verify: deployed-only reproduction, tracker complete + mayker:to-verify), TEST-09 (#965), TEST-08 (#966). Checkpoints: BUG-01 pass at 7cb167b6, TEST-08 pass at 6f0d54e4; TEST-09 not due.
- [run] BUG-04 admitted to planning when BUG-01's slot freed (out of strict order only in that its wave-3 peers were already in flight); TEST-10 admitted once TEST-08 and TEST-09 merged.
- [run] Wave-2 boundary: follow-ups filed none (no RECOMMENDED finding left unapplied: BUG-01 had none, TEST-09 and TEST-08 applied theirs in the refactor gate; no comment unaddressed). Re-ingest: 52 items, nodes=TEST-10,BUG-04, registered=none, 0 wave and 0 checkpoint proposals.
- [run] Framework defect observed (reported, not filed): a builder found `bash /Users/.../.mayker/mayker-dev/hooks/lib/run-env.sh --probe 5183` refused three times by the permission layer while the `~/.mayker/...` spelling ran.
- [run] Wave-2 record published as PR #967. publish.sh first returned merge=refused while the required `changes` check was still pending; the PR was handed back to the script with `--pr` and it merged (arm=adopted merge=merged).
- [run] TEST-10 plan verdict revised once: LandingPage.test.tsx mocks fetchBackendVersion with the old return shape and was missing from the manifest. Re-plan added it (9 entries) and the re-check approved.
- [run] Merged: BUG-04 (#968). Repro before fail -> after pass. Checkpoint pass at 792aa04c. Wave 3 drained (BUG-01, TEST-08, BUG-04).
- [run] Wave-3 boundary: follow-ups filed none (BUG-04's review and refactor gate had no findings; no comment unaddressed). Re-ingest: 52 items, nodes=TEST-10, registered=none, 0 proposals. TEST-10's branch was cut at e1baa32a, one commit behind main; file sets disjoint from BUG-04.
- [run] Wave-3 record published as PR #969 (merged).
- [run] Merged: TEST-10 (#970), one commit behind main at merge (BUG-04's 792aa04c, disjoint files, provider CLEAN). Checkpoint pass at 6a195a42. Wave 4 drained.
- [run] Final boundary: follow-ups filed none (TEST-10's one RECOMMENDED finding applied by its gate; no comment unaddressed). Re-ingest: [item-status] items=52 nodes=0 done=11 to_verify=1 unmapped=40, registered=none. The graph is empty; the run proceeds to Section 8.
