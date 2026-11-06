# Decisions (cross-cutting): deliver-20261106T164429Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261106T164429Z

- [run] Ingestion: 42 items read (37 tracker, 5 local); item-status verdict nodes=5 (TEST-08, TEST-09, TEST-10, BUG-01, BUG-04), done=7, unmapped=30 (cancelled maps to null), labels-ignored=1.
- [run] label-ignored=BUG-01 (mayker:to-verify on todo: the label counts only on done, so the item reads as todo); BUG-01 stays a buildable node.
- [run] Map reconcile wrote nothing: every node has a row and registry entry; 0 wave and 0 checkpoint proposals; validator valid (42 rows, 43 edges); registered=none, so no register publish.
- [run] Shared risk left as authored: TEST-08/BUG-04 (LandingPage.tsx), TEST-09/BUG-01 (backend/app/main.py, decided on whole-manifest union at plan round), TEST-10/BUG-04 (LandingPage.tsx).
- [run] Scheduling round 1: plan TEST-09, TEST-08, BUG-01 in parallel (cap 3); BUG-04 held behind TEST-08 (LandingPage.tsx); TEST-10 blocked by depends_on TEST-08, TEST-09.
- [run] Resume: all five nodes start at 6.1; no feature branch, PR, worktree or artifact exists for any of them.
- [run] TEST-09: plan self-approved; built (B, G, Docs none needed); review PASS 0/0/1; gate no findings; PR #613 green 7/7; merged squash 19e3f29; auto-Done run 42258054180 succeeded, tracker complete; checkpoint not due (row ➖).
- [run] BUG-01: plan self-approved (FEAT-1's /api/time recreated as a precondition); Repro deployed-only; review PASS 0/0/0; gate no findings; PR #614 green 7/7 with label mayker:to-verify; merged squash fc51546; auto-Done run 42258079144 succeeded, tracker complete + tag mayker:to-verify (awaits a human check on the deployed environment); checkpoint pass at fc51546 (pytest 62 passed 14 skipped, vitest 26 passed).
- [run] TEST-08: plan self-approved (criteria 5 and 6 from the human correction comment, apiBaseUrl.ts judged in scope); review PASS 0/0/1; gate no findings; PR #615 base-sync conflict on docs/DEVELOPMENT.md after BUG-01 merged, resolved in 2df346b (kept BUG-01's /api/time paragraph and TEST-08's footer paragraph; dropped main's commit-suffix footer paragraph, TEST-10's scope); re-gated pytest 62/14 skipped + vitest 38; CI green 7/7; merged squash 0ad05fa; auto-Done run 42260451119 succeeded; checkpoint pass at 0ad05fa.
- [run] Wave boundary (waves 2 and 3 drained): follow-ups filed none — the three merged PRs list only OPTIONAL known improvements and no unaddressed comments. BUG-04's hold behind TEST-08 lifts; TEST-10's dependencies are done.
- [run] Builder notes for the framework maintainer (not filed to the tracker): BUG-01 Phase B builder's first read used a cd segment and was refused, re-issued with Read; TEST-08 Phase D builder saw run-env.sh --probe report nothing listening on 5183/8010 while both servers answered; TEST-08 base-sync builder's first stage-in append-item into the run record landed nothing visible and consumed the staged file, then append-run landed.
- [run] Re-ingest at the wave-3 boundary (main 0ad05fa): 42 items, nodes=TEST-10,BUG-04; TEST-09, TEST-08 (done) and BUG-01 (to_verify) dropped; no item filed meanwhile, registered=none, map unchanged (0 proposals, validate clean).
- [run] unmapped=30 cancelled rows are not nodes; BUG-02 carries mayker:ready-for-fix while cancelled, which changes nothing — flagged for a human to reopen if intended.
- [run] Round order: plan BUG-04 (wave 3) and TEST-10 (wave 4) in parallel; TEST-10's build held behind BUG-04's merge if the whole-manifest unions overlap (LandingPage.tsx expected on both).
