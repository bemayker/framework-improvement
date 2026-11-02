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

## Run deliver-20261102T222558Z

- [run] Ingestion: 42 items read (37 tracker, 5 local; TEST-02 resolved from the tracker per hybrid). Nodes BUG-04, BUG-01, TEST-10, TEST-09, TEST-08; 30 cancelled items unmapped and dropped. Rationale: cancelled maps to null in reverse_status_mapping.
- [run] BUG-01 label-ignored (mayker:to-verify on a todo item counts only on done). Rationale: readiness label rule.
- [run] Map and registry not written: no missing row or entry, 0 wave and 0 checkpoint proposals; registered=none, no register publish. Rationale: nothing to reconcile.
- [run] Resume: all five nodes start at 6.1. Rationale: no feature branch, PR, artifact or worktree exists; reset commit ba107df undid merges #485 to #489.
- [run] Planned build serialization from shared risk: BUG-01 behind TEST-09 (main.py), BUG-04 behind TEST-08 (LandingPage.tsx), TEST-10 behind BUG-04 (LandingPage.tsx). Confirmed or cleared at plan time on the File Manifest union.
- [run] Round 1 dispatch: plans for TEST-09 (wave 2), TEST-08 and BUG-01 (wave 3). Rationale: Section 5 step 2 lets items in their plan phase run in parallel; the shared-risk holds bind builds only, so the third slot is filled by the next ready item in order (BUG-01 before BUG-04 by ID-independent chain/priority tie, both wave 3).
- [run] Merged: BUG-01 (#493, fce45c7; to_verify via mayker:to-verify, criterion 3 left for a human on the deployed environment), TEST-09 (#494, 584c5c4), TEST-08 (#495, 95cc449). Rationale: orchestrator merge verdicts, all autonomy.md Section 5 conditions met, CI green 7/7 each.
- [run] Builds of BUG-01 and TEST-09 ran concurrently. Rationale: whole-manifest unions share no file (the feature map's main.py note for TEST-09 was stale).
- [run] Checkpoints: BUG-01 verdict=pass head=584c5c4; TEST-08 verdict=pass head=95cc449 (command uv run --directory backend pytest -q && npm --prefix frontend test; 14 database-backed tests skipped in every local run, no backing database provisioned).
- [run] Wave-2 boundary: follow-ups filed: none (BUG-01 and TEST-09 known improvements are OPTIONAL only; no unaddressed comments). Re-ingest: nodes BUG-04, TEST-10; registered=none; map unchanged.
- [run] Next round: BUG-04 and TEST-10 plans in parallel; builds serialized BUG-04 first on LandingPage.tsx unless the approved manifest unions are disjoint.
- [run] Playwright Chromium installed by TEST-08's refactor gate so its E2E specs could execute locally (7 passed). Rationale: discharge the reviewer's RECOMMENDED Verify line; the project's own pinned Playwright version.
- [run] TEST-10 Phase D held behind BUG-04: smoke run ports
- [run] Run publish: wave-2 arm=opened merge=merged pr=https://github.com/bemayker/framework-improvement/pull/496 (docs-only, pr-tests tiers skipped; whether pr-tests was a required check at merge time was not read).
- [run] Merged: BUG-04 (#497, 2647569; repro before fail -> after pass), TEST-10 (#498, 43c8736; criterion 2 satisfied under the recorded interpretation: pending and failure show "Task Notes", not the version). Rationale: orchestrator merge verdicts, CI green 7/7 each.
- [run] BUG-04 and TEST-10 built concurrently. Rationale: whole-manifest unions disjoint (orchestrator); the feature map's LandingPage.tsx flag did not materialize.
- [run] Checkpoints: BUG-04 verdict=pass head=2647569; TEST-10 verdict=pass head=43c8736. BUG-04's push gate ran the database-backed tests for the first time in this run (pytest 76 passed, 0 skipped) against its Postgres container BUG-04-db, torn down at 6.10.
- [run] Final boundary: follow-ups filed: none (TEST-08 and TEST-10 known improvements are OPTIONAL only; BUG-04 has none; no unaddressed comments). Final re-ingest: nodes=none, registered=none, no new item.
- [run] Final-boundary wave record (Section W step 3) folded into the Section 8 report publish. Rationale: both land this run's DECISIONS slice and item decisions at docs/runs/deliver-20261102T222558Z, so a separate publish would duplicate the report publish seconds apart.
- [run] Left for a human: BUG-01 criterion 3 (deployed CDN check; tracker complete with mayker:to-verify); five merged feature branches remain on origin; TEST-04 UAT script port literals 8000/5173 (OPTIONAL on #495).
