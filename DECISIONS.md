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

## Run deliver-20261125T083205Z

- [ingest] nodes=TEST-08,TEST-09,TEST-10,BUG-01,BUG-04 from item-status.sh (items=54 nodes=5 done=7 to_verify=0 unmapped=42 link=0 labels-ignored=1); whole backlog, no scope.
- [ingest] label-ignored=BUG-01 (mayker:to-verify on todo: the label counts only on done, so the item reads as todo). BUG-01 is a node and is built.
- [ingest] unmapped= on 42 cancelled items ("cancelled" maps to null in reverse_status_mapping); none is a dependency of a node.
- [ingest] registered=none; feature_map.md not written; validator: valid, 54 rows.
- [schedule] order TEST-09, TEST-08, BUG-01, BUG-04, TEST-10 by wave, then chain, then ID; priority unset on all five.
- [serialize] BUG-04 held behind TEST-08: shared_risk_notes on both rows name frontend/src/components/LandingPage.tsx. BUG-01 takes the third slot instead.
- [serialize] BUG-01 and TEST-09: conditional on backend/app/main.py; decided at manifest comparison.
- [risk] BUG-04 has an empty tracker description and no acceptance criteria; the planner assumes and records a scope change.
- [risk] BUG-01 criterion 3 is human verification on the deployed environment; expected to end at to_verify.
- [plan] TEST-09, BUG-01, TEST-08 plans self-approved on first pass by the orchestrator (logs in each item's decisions.md).
- [serialize] BUG-01 and TEST-09 build concurrently, no serialization: union-of-all-phases comparison of both File Manifests finds no shared path; TEST-09 does not modify main.py or test_main_unit.py.
- [serialize] BUG-04 stays held behind TEST-08: TEST-08's manifest now names frontend/src/api/notes.ts and LandingPage.test.tsx, which BUG-04 plausibly edits.
- [repro] BUG-01 classified deployed-only: the edge cache exists only on the deployed environment; no Test environments row configured.
- [status] TEST-09 skipped the on hold (ready_for_build) tracker write between plan review and in progress; BUG-01 and TEST-08 passed through it.
- [merge] TEST-09 merged #1014 squash f247a9bb on the orchestrator's verdict (5 conditions met); auto-done run 45579563872 succeeded; tracker complete.
- [merge] BUG-01 merged #1015 squash 9b4aedbe on the orchestrator's verdict; deployed-only repro, PR labelled mayker:to-verify before conversion; auto-done run 45579582708 succeeded; tracker complete + tag mayker:to-verify (awaits a human check on the deployed environment).
- [merge] TEST-08 merged #1016 squash c480a825 on the orchestrator's verdict; auto-done run 45579759470 succeeded; tracker complete.
- [checkpoint] BUG-01 head=9b4aedbe verdict=pass; TEST-08 head=c480a825 verdict=pass; TEST-09 not-due. Each backend run skipped 14 database-backed tests: no database was provisioned for the checkpoint.
- [wave] boundary after waves 2 and 3 drained (BUG-04 remains in wave 3, now unheld). Follow-ups: none filed: every RECOMMENDED finding of the three merged items was applied by its refactor gate, and no comment was unaddressed at merge.
- [context] ctx=342669 window=1000000 pct=34 model=claude-opus-5-5 verdict=ok wall=ok elapsed_h=0.3 bound=continue
- [framework] bash-shape-guard refused two subagent greps of plugin files (plugin-read) and one session call carrying $? (variable); each was re-routed through the shipped shape, none was substituted. run-env.sh --probe reported listening=no for an IPv4-only uvicorn on 8010 that was serving requests.
- [ingest] re-ingest at the wave boundary (main c480a825): [item-status] items=54 nodes=2 done=9 to_verify=1 unmapped=42 link=0 labels-ignored=0; nodes BUG-04 and TEST-10, both ready, full lifecycle from 6.1; registered=none; map valid, 54 rows, not written.
- [serialize] BUG-04 hold behind TEST-08 lifted by its merge; replaced by a conditional build hold on the flagged pair BUG-04 and TEST-10 (LandingPage.tsx): both plan concurrently, builds serialized BUG-04 first if the whole-feature File Manifests share any file.
- [schedule] order BUG-04 (wave 3, chain 0), then TEST-10 (wave 4, chain 1).
- [plan] BUG-04 plan self-approved on first pass; criteria derived from the title (empty tracker description), client-side-only reading accepted as a reversible guess. TEST-10 plan revised once (it missed LandingPage.test.tsx and the TEST-08 E2E spec, both broken by its own change), re-plan approved.
- [serialize] BUG-04 and TEST-10 built concurrently: union-of-all-phases File Manifests disjoint; LandingPage.tsx touched by neither.
- [merge] BUG-04 merged #1018 squash b20d1084 (repro before fail -> after pass); auto-done run 45582254539 succeeded; tracker complete.
- [merge] TEST-10 merged #1019 squash 8d1ae58b (criterion 2 built to the recorded reading); auto-done run 45583122871 succeeded; tracker complete.
- [checkpoint] BUG-04 head=b20d1084 verdict=pass; TEST-10 head=8d1ae58b verdict=pass. The checkpoint ran with no database (14 backend tests skipped each time); the push gates of BUG-04 and TEST-10 ran them against Postgres: 75 passed, 0 skipped.
- [teardown] BUG-04-db and TEST-10-db removed after their merges.
- [wave] final boundary: follow-ups none filed (every RECOMMENDED finding applied; no comment unaddressed at merge). Re-ingest: [item-status] items=54 nodes=0 done=11 to_verify=1 unmapped=42; registered=none; map valid, not written.
- [context] ctx=499655 window=1000000 pct=49 model=claude-opus-5-5 verdict=ok wall=ok elapsed_h=0.7 bound=continue
- [framework] feature-map-waves.sh printed different chain= lines seconds apart on an unchanged map (9 then 16 entries). bash-shape-guard refused several composed subagent calls with a cd segment; each was re-run in an allowed shape.
