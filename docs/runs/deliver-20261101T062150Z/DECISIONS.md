# Decisions (cross-cutting): deliver-20261101T062150Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261101T062150Z

- 2026-11-01 [run] Ingested 5 nodes (TEST-09, TEST-08, BUG-01, BUG-04, TEST-10) and started every one from 6.1 despite merged PRs #448-#452/#423 on their branches. Rationale: reset commit 77b48c2 removed their product and artifacts from main, no feature branch or open PR survives, and the tracker says to do; a merged PR with no product on main is not a resume point.
- 2026-11-01 [run] Kept BUG-01 as a todo node although it carries the tracker tag mayker:to-verify. Rationale: its status is to do (todo) and the mapping has no to_verify key; the tag is a stale remnant of an earlier deployed-only merge, and only a human removes it.
- 2026-11-01 [run] Planned order TEST-09 ∥ TEST-08 ∥ BUG-01, then BUG-04, then TEST-10; BUG-04 held behind TEST-08 and the TEST-09/BUG-01 builds serialized only if both manifests list backend/app/main.py. Rationale: wave then chain then ID orders the ready set, and the map's LandingPage.tsx and main.py overlaps are plausible but unconfirmed until the plans' File Manifests exist.
- 2026-11-01 [run] Shared-risk re-run over the 4 empty-cell rows (CHORE-01, CHORE-06, FEAT-11, FEAT-13) wrote nothing. Rationale: all four are cancelled and their stated files are disjoint from every row that could run concurrently; a no-write keeps the map untouched (MDF-168).
- 2026-11-01 [run] No map or registry write this ingestion. Rationale: map valid with 0 wave and 0 checkpoint proposals; every tracker node already registered and rowed, so no Section L register publish precedes Section 5.
- 2026-11-01 [TEST-08] Plan verdict revise, one re-plan. Rationale: tracker correction honored and endpoint verified on main; the manifest omitted TEST-04's Gherkin and UAT script, which assert the package.json version the footer no longer shows. Re-plan approved.
- 2026-11-01 [TEST-09] Merge PR #456 (squash). Rationale: autonomy.md Section 5 conditions 1-5 all hold (review blocking=0, ci-poll verdict=green 7/7, four criteria met, no PR or tracker comments outstanding, no escalation-bar trigger).
- 2026-11-01 [BUG-01] Merged PR #455 on the orchestrator's verdict; criterion 3 (deployed edge-cache repro) left to the human `mayker:to-verify` check. Rationale: deployed-only Repro verdict exits 0 and merges per 6.9; all other Section 5 conditions held.
- 2026-11-01 [run] Dispatched BUG-04 out of wave order beside TEST-08 (wave 3 both) once a slot freed. Rationale: the plans' File Manifests share no file, so the map's predicted LandingPage.tsx overlap did not hold.
- 2026-11-01 [TEST-08] Merge PR #457 (squash). Rationale: autonomy.md Section 5 conditions 1-5 hold; RECOMMENDED review finding applied by the gate; test_checkpoint passed at 93b28d7.
- 2026-11-01 [BUG-04] Merge PR #458 (squash). Rationale: autonomy.md Section 5 conditions 1-5 hold; repro before fail -> after pass; test_checkpoint passed at 6770a5f.
- 2026-11-01 [TEST-10] Merge PR #459 (squash). Rationale: autonomy.md Section 5 holds on all five conditions; last open item of the run; test_checkpoint passed at 75ef2ae.
- 2026-11-01 [run] Final boundary: no follow-ups filed. Rationale: every remaining known improvement on the merged PRs is OPTIONAL (all RECOMMENDED findings were applied by the refactor gates) and no comment went unanswered at merge.
- 2026-11-01 [run] Section W step 2 re-ingest at the final boundary: node set empty. Rationale: all 37 tracker tasks are complete or cancelled and all 5 local items done at main 75ef2ae; no task arrived since run start (37 tracker ids = 37 registry entries). Backlog drained; no further round.
- 2026-11-01 [run] Re-ingest wrote no map or registry row. Rationale: 0 wave / 0 checkpoint proposals, no row added, map valid as-is (41 rows, 42 edges).
- 2026-11-01 [BUG-01] Still carries the tracker tag mayker:to-verify after its #455 merge with status complete. Rationale: deployed-only fix; only a human removes the tag after verifying criterion 3 on the deployed environment.
