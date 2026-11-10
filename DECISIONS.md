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

## Run deliver-20261110T131433Z

- [ingest] nodes=BUG-01,BUG-04,TEST-08,TEST-09,TEST-10 from item-status.sh (items=42 nodes=5 done=7 to_verify=0 unmapped=30 link=0 labels-ignored=1); statuses re-read from the tracker and local frontmatter, not from the commit log.
- [ingest] label-ignored=BUG-01 (mayker:to-verify on todo: the label counts only on done, so the item reads as todo). BUG-01 is a todo node and is built.
- [ingest] unmapped= 30 cancelled tracker items (cancelled maps to null in reverse_status_mapping). Not graph nodes; none is a dependency of a node.
- [resume] All five nodes take the full lifecycle from 6.1. PRs 698 to 702 for the same IDs are merged, but ac6e44c (PR 705) removed their code and artifacts from main and the tracker reads to do; no feature/* head on the remote, no open item PR, no plan artifact.
- [graph] No cycle, no edge dropped. Scaffold TEST-01 is done, gate passes. Ready: TEST-09, TEST-08, BUG-01, BUG-04. TEST-10 blocked by TEST-08 and TEST-09.
- [map] feature_map.md valid and unchanged; 0 wave and 0 checkpoint proposals; registered=none.
- [serialize] BUG-04 held behind TEST-08 (LandingPage.tsx), TEST-10 behind BUG-04 if concurrent. BUG-01 build held behind TEST-09 only when both File Manifests list backend/app/main.py.
- [order] Round 1 dispatch: TEST-09 (wave 2), TEST-08 (wave 3, chain 2), BUG-01 (wave 3, chain 1) to plan phase. BUG-04 waits for a free slot (max parallel 3). Wave is an ordering key, not a gate.
- [merge] BUG-01 #706 -> 6b27a6e (squash); auto-done run 42825648641 succeeded; tracker complete + tag mayker:to-verify (deployed-only, awaiting human verification). Checkpoint pass head=9e9b182.
- [merge] TEST-09 #707 -> 9e9b182 (squash); auto-done run 42825696801 succeeded; tracker complete. Checkpoint pass head=9e9b182 (script read TEST-09 as flagged though ingest reported ➖).
- [merge] TEST-08 #708 -> 0b16aad (squash); auto-done run 42826179604 succeeded; tracker complete. Checkpoint pass head=0b16aad.
- [framework] pr-open.sh exited 1 after creating PR #708; the PR was verified on GitHub and the run continued. Framework defect, not filed in the project tracker.
- [wave-2] Follow-ups: none filed (BUG-01 no known improvements; TEST-09 OPTIONAL only; no unaddressed comments).
- [re-ingest wave-2] Nodes = TEST-08, TEST-10, BUG-04 (items=42 nodes=3 done=8 to_verify=1 unmapped=30 link=0 labels-ignored=0). TEST-09 dropped as done; BUG-01 dropped as to_verify.
- [re-ingest wave-2] No backlog change since run start: 38 tracker items, all registered and mapped; registered=none; feature_map.md valid and unchanged.
- [order] After TEST-08's merge: BUG-04 (wave 3) and TEST-10 (wave 4) both ready; both plan concurrently (plans only write artifacts); their builds are serialized on the LandingPage risk unless their whole-feature manifests are disjoint.
- [publish wave-2] arm=opened pr=https://github.com/bemayker/framework-improvement/pull/709 merge=merged (class framework, paths docs/runs/deliver-20261110T131433Z). Required status checks on main at merge time (ruleset read): ["pr-tests"] — the check was required.
- [order] Round 4: BUG-04 and TEST-10 dispatched to planning concurrently (plan base 0b16aad); neither has an actionable tracker comment.
- [hold] TEST-10 Phase D held behind BUG-04: smoke run ports
- [merge] BUG-04 #710 -> efb5ed9 (squash); auto-done run 42828524703 succeeded; tracker complete. Repro: before fail -> after pass. Checkpoint pass head=b0e9a62. Teardown: docker rm -f BUG-04-db.
- [merge] TEST-10 #711 -> b0e9a62 (squash); auto-done run 42828634673 succeeded; tracker complete. Checkpoint pass head=b0e9a62.
- [final boundary] Follow-ups: none filed (BUG-04 OPTIONAL only; TEST-08 OPTIONAL only; TEST-10 none; no unaddressed comments).
- [final boundary] re-ingest: nodes=0 (items=42 done=11 to_verify=1 unmapped=30 link=0 labels-ignored=0). No item filed since the wave-2 re-ingest; registered=none; feature map unchanged and valid. BUG-01 is to_verify, left for a human.
- [final boundary] Remote heads feature/BUG-01, BUG-04, TEST-08, TEST-09, TEST-10 remain on origin after their squash merges (no open PR, not resume points).
- [report] Final report composed for terminal state complete (final re-ingest nodes=0): 5 delivered, 0 blocked, 0 unmerged-green; BUG-01 awaits verification on the deployed environment. The TEST-09 checkpoint-flag discrepancy is reported on Test checkpoints: the final-boundary wave view flags the row, agreeing with checkpoint-suite.sh and not with the ingestion's ➖. Rationale: the report states what the artifacts show and leaves the map untouched.
- [publish wave-4] arm=opened pr=https://github.com/bemayker/framework-improvement/pull/712 merge=merged (class framework, paths docs/runs/deliver-20261110T131433Z).
