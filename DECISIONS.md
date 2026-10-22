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

## Run deliver-20261022T104205Z

- [ingest] Scope FEAT-4 only: its sole depends_on TEST-01 is done (local frontmatter) and it has no tracker dependencies, so the graph is one node; FEAT-5 stays out of scope. Readiness: todo + dep done + scaffold done → ready; wave 2 is an ordering key only.
- [ingest] No map or registry write: FEAT-4 already registered (123k99cytrg) with a row carrying wave 2, checkpoint ✅ and its FEAT-4/FEAT-5 main.py shared-risk note; propose.sh returned 0/0, validate passed (31 rows, 32 edges). registered=none, so no Section L register publish before dispatch.
- [resume] FEAT-4 resumes at 6.1 (full lifecycle): no remote branch, no PR, no artifacts, no worktree.
- [schedule] Round 1: dispatch FEAT-4 (only ready node, wave 2, no lower-wave item in scope); no serialization hold.
- [merge] FEAT-4: PR #255 squash-merged at 96c0433 on the orchestrator's merge verdict (self-review PASS 0/0/0, CI 7/7 green, criteria met, no comments, escalation bar not triggered). Auto-Done run 39771206632 succeeded; full-suite checkpoint verdict=pass at 96c0433.
- [boundary] Section W step 1: no follow-ups filed (PR #255 known improvements: none; no unaddressed comments).
- [ingest] Re-ingest (Section W step 2): FEAT-4 complete, TEST-01 done, scope drained to 0 nodes; registered=none; propose 0/0 over 31 rows. FEAT-5 stays out of scope (ID-scoped run, FEAT-4 does not depend on it).
- [report] Section 8: report.md composed by the orchestrator, whose own staging Write was blocked twice by a harness hook ("Subagents should return findings as text, not write report files."); the session staged and wrote it through run-dir.sh stage-in write-run. Framework defect to raise with the maintainer, not filed in the project tracker.
- [report] Stats Degraded: step 5 and the Section W re-ingestion marker (3.orchestrator #2) overlap by 99s, a marker-writer defect of this session; the run total stands.
