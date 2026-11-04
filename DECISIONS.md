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

## Run deliver-20261104T003304Z

- [run] ingestion: 42 items resolved (38 tracker, 4 local), nodes=5 (TEST-08, TEST-09, TEST-10, BUG-01, BUG-04), done=7, unmapped=30 (all cancelled, mapped to null), link=0. Source: item-status.sh.
- [BUG-01] label-ignored: mayker:to-verify on a todo item counts only on done; BUG-01 scheduled as a todo node.
- [run] reconcile: 0 rows added, registered=none, 0 wave / 0 checkpoint proposals, 0 shared-risk cells inferred, map valid (42 rows, 43 edges). No register publish needed.
- [run] resume: every node starts the full lifecycle at 6.1 (no feature branch on origin, no item PR, no artifacts, no worktrees).
- [run] dispatch order: TEST-09, TEST-08, BUG-01 first (wave, chain, ID); BUG-04 held behind TEST-08 (shared risk LandingPage.tsx); BUG-01 build serialized after TEST-09 if both manifests list backend/app/main.py; TEST-10 blocked on TEST-08 and TEST-09.
- [run] round 1 to 3: TEST-09, TEST-08 and BUG-01 planned, built, reviewed and merged concurrently (no whole-manifest overlap; BUG-04 held only by the cap once TEST-08's approved plan left LandingPage.tsx untouched). Merged: TEST-08 #517 b4d4bb8, BUG-01 #518 84c1b02 (to_verify, deployed-only repro), TEST-09 #519 e6c97b8.
- [TEST-09] self-review BLOCKING 1 (README line 70) disproved in fix round 1 and accepted by re-pass 1; the first pass read the diff direction backwards.
- [run] checkpoint after BUG-01 and TEST-08: due=yes verdict=pass head=e6c97b8; TEST-09 not flagged (not-due).
- [run] Section W wave-2 boundary, step 1: no follow-ups filed. known-improvements: every merged PR lists none (TEST-08's RECOMMENDED finding was applied by its gate); unaddressed-comments: none at merge on any item.
- [run] Section W step 2 re-ingest: 42 items resolved, nodes=TEST-10,BUG-04 (done=9 to_verify=1 unmapped=30). Reconcile wrote nothing (registered=none, propose 0/0, map valid). BUG-04 and TEST-10 dispatched to planning concurrently; TEST-10's build serializes behind BUG-04's merge only if the approved whole-manifest unions share a file.
- [run] round 4 to 6: BUG-04 and TEST-10 planned, built, reviewed and merged concurrently (whole-manifest unions disjoint). TEST-10 Phase D held behind BUG-04: smoke run ports. Merged: TEST-10 #521 c651d8d, BUG-04 #522 90fa8ba.
- [BUG-04] self-review BLOCKING 1 (plan-recorded disabled button style missing) fixed in fix round 1 (1647c15) and closed by re-pass 1. Repro: before fail -> after pass. Tracker description empty; criteria derived from the title.
- [run] checkpoints after TEST-10 and BUG-04: due=yes verdict=pass head=90fa8ba.
- [run] Section W final boundary, step 1: no follow-ups filed. known-improvements: TEST-10 lists two OPTIONAL findings only, BUG-04 none; unaddressed-comments: none at merge.
- [run] Section W final boundary, step 2 re-ingest: 42 items resolved (38 tracker, 4 local); nodes=0 done=11 to_verify=1 unmapped=30; backlog drained. Reconcile wrote nothing (registered=none, propose 0/0, map valid 42 rows 43 edges). BUG-01 stays to_verify (complete with mayker:to-verify).
