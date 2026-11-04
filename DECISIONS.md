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

## Run deliver-20261104T193955Z

- [run] Graph: 5 nodes (TEST-08, TEST-09, TEST-10, BUG-01, BUG-04); 7 done dropped, 30 cancelled unmapped. BUG-01's mayker:to-verify ignored at "to do" (label-ignored=BUG-01), scheduled as a todo node.
- [run] Map reconcile: no rows added, registered=none; 0 wave and 0 checkpoint proposals; validator passed on 42 rows.
- [run] Serialization TEST-09 / BUG-01 on backend/app/main.py: BUG-01 planned concurrently, its build held behind TEST-09's merge unless the File Manifest unions prove disjoint.
- [run] Serialization TEST-08 / BUG-04 on frontend/src/components/LandingPage.tsx: BUG-04 held until TEST-08 merges; TEST-08 takes the slot on chain length (TEST-08 -> TEST-10).
- [run] Round 1: plan TEST-09, TEST-08, BUG-01 (3 slots). Every 3-subset of the four ready items holds a flagged pair, so the third slot plans BUG-01 instead of building into an overlap.
- [run] Resume: no feature/ branch, PR, artifact or worktree exists for any node; all five start at 6.1.
- [run] BUG-01 plan self-approved, Repro class deployed-only (to_verify after merge, PR takes mayker:to-verify).
- [run] TEST-09 plan self-approved. BUG-01 build hold released: whole-feature File Manifest unions of TEST-09 (12 files) and BUG-01 (10 files) are disjoint; backend/app/main.py is in BUG-01's only. Re-apply the hold if a BUG-01 re-plan adds a file in TEST-09's union.
- [run] TEST-08 plan self-approved. BUG-04 hold behind TEST-08 kept, re-based from LandingPage.tsx to frontend/src/api/notes.ts and frontend/src/components/LandingPage.test.tsx; BUG-04 may plan when a slot frees, build held until TEST-08 merges or the unions are shown disjoint.
- [run] Round 2: builds dispatched for TEST-09 (Phase B), BUG-01 (Phase B), TEST-08 (Phase A); merged-since clean on all three (base=3e00ad2 forced, commits=0).
- [run] Merge verdicts: TEST-09, BUG-01, TEST-08 merged in PR order #547 (f542b6a), #548 (b8e3073), #549 (8488648), squash; all cleared autonomy.md Section 5; manifests pairwise disjoint. mergeable read UNKNOWN before #548 and #549 (provider recomputing); both merges succeeded.
- [run] BUG-01 merged into to_verify (complete + tag mayker:to-verify): criterion 3 is a deployed-only human check; revertable fix, not the escalation bar.
- [run] Post-merge: auto-done runs 41902632341, 41902648342, 41902664780 succeeded; checkpoint BUG-01 and TEST-08 verdict=pass on head 8488648 (pytest 62 passed 14 skipped, vitest 37 passed); TEST-09 not-due.
- [run] Wave-2 boundary: follow-ups filed none (TEST-09 known improvements all OPTIONAL; BUG-01 and TEST-08 none outstanding; no unaddressed comments).
- [run] Wave-2 re-ingest: 2 nodes (BUG-04, TEST-10); no new task; registered=none; validator passed on 42 rows.
- [run] Round 3: plan BUG-04 and TEST-10 concurrently; TEST-10 build held until BUG-04 merges or the whole-feature manifest unions are disjoint (candidate overlap LandingPage.test.tsx).
- [run] Section L wave-2 publish: arm=opened merge=merged PR #550 (chore/mayker-deliver-20261104T193955Z-wave-2); pr-tests was a required check on main at merge time.
- [run] BUG-04 plan self-approved; Repro class local-automated (npm --prefix frontend test -- src/components/NoteForm.test.tsx).
- [run] TEST-10 plan self-approved. TEST-10 hold behind BUG-04 released: whole-feature File Manifest unions disjoint (BUG-04: NoteForm.tsx, NoteForm.test.tsx and its own e2e/uat files; TEST-10: version.ts, version.test.ts, AppFooter.tsx, AppFooter.test.tsx, LandingPage.test.tsx and its own e2e/uat files); CHORE-02 cancelled. Both build concurrently.
- [run] Round 3 builds: BUG-04 Phase A and TEST-10 Phase A dispatched; merged-since clean on both (base=0515c74 forced, commits=0).
- [run] TEST-10 Phase D held behind BUG-04: smoke run ports
- [run] Merged BUG-04 (PR #551, squash -> 158f6aa) on the orchestrator's verdict: autonomy.md Section 5 held on all five conditions; repro before fail -> after pass; manifest disjoint from in-flight TEST-10.
- [run] Merged TEST-10 (PR #552, squash -> af29e17) on the orchestrator's verdict: all five Section 5 conditions held; BUG-04's intervening merge is file-disjoint.
- [run] Post-merge: auto-done runs 41906093081 (BUG-04) and 41906597535 (TEST-10) succeeded; checkpoints BUG-04 (head 158f6aa) and TEST-10 (head af29e17) verdict=pass. BUG-04-db torn down.
- [run] Final boundary: follow-ups filed none (BUG-04 known improvements none; TEST-10 known improvements one OPTIONAL only; no unaddressed comments).
- [run] FINAL re-ingest: 0 nodes; fresh list read (38 tasks, all registered, none new); BUG-04 and TEST-10 drop as done; BUG-01 stays to_verify; 30 cancelled tasks unmapped; registered=none; validator passed on 42 rows; map not written.
- [run] Run ends at the final boundary: graph empty, nothing blocked, no follow-up filed.
- [run] Report dispatch: every block line written in its facts' arm; Waves, Test checkpoints (flagged set) and Decisions of note read from feature_map.md and DECISIONS.md; Shared risk takes the not-run arm (0 cells inferred) with this run's 3 serialized pairs named; Standards provenance summed to 14 of 20 dispatches.
- [run] Fallback wakeups: none scheduled (background dispatches awaited by notification, waiting policy 2.1).
