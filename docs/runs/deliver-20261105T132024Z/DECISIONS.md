# Decisions (cross-cutting): deliver-20261105T132024Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261105T132024Z

- [run] Ingestion: 42 items resolved (5 local, 37 tracker); item-status.sh yields 5 nodes (TEST-08, TEST-09, TEST-10, BUG-01, BUG-04), 7 done, 30 unmapped `cancelled`; BUG-01's `mayker:to-verify` label ignored at `to do` per the helper (MDF-515), so BUG-01 is built.
- [run] Map reconcile: no missing rows, no unregistered tracker item, proposals 0 waves / 0 checkpoints, map not written; registered=none, so no Section L `register` publish before the first dispatch.
- [run] Shared risk: the two empty shared_risk_notes cells (CHORE-01, CHORE-06) belong to cancelled non-node rows; no inference written.
- [run] Resume: reset commit 6094657 (#581) removed every node's artifacts and code; no feature branch, PR or worktree exists, so all five nodes start at 6.1.
- [run] Scheduling round 1: TEST-09 (w2) ∥ TEST-08 (w3) ∥ BUG-01 (w3) to planning, cap 3; BUG-04 (w3) waits for a free slot and is expected to serialize behind TEST-08 (LandingPage.tsx); BUG-01's build held pending a manifest comparison with TEST-09; TEST-10 blocked on TEST-08 and TEST-09.
- [run] Ingestion dispatch refusal: one bash-shape-guard refusal on an orchestrator-composed grep (pattern held `$1`), not a shipped step; shipped helpers then ran standalone and every artifact write landed.
- [run] Merged: TEST-09 (#582, squash f1bf986, auto-done run 42037898572 succeeded, status complete) and BUG-01 (#583, squash 57156e2, auto-done run 42038001578 succeeded, status complete + mayker:to-verify, awaiting human deployed verification). BUG-01's test checkpoint passed on 57156e2.
- [run] Wave-2 boundary, follow-ups: none filed — TEST-09 and BUG-01 PR known improvements are OPTIONAL only (BUG-01's one RECOMMENDED finding was applied at its refactor gate), and no comment was unaddressed at merge.
- [run] Wave-2 boundary re-ingest: nodes TEST-08 (in_progress, PR #584 at CI watch), BUG-04 (todo), TEST-10 (todo, blocked by TEST-08); TEST-09 and BUG-01 dropped as done/to_verify; 30 cancelled items unmapped; no new tracker item since run start. registered=none, 0 proposals, map not written.
- [run] Scheduling: BUG-04 planned beside TEST-08, its build held until TEST-08 merges unless the whole-feature manifest unions prove disjoint (candidates frontend/src/api/notes.ts, LandingPage.test.tsx). BUG-04's tracker description is empty; the planner works from the title and documents its assumptions. TEST-10 stays unready until TEST-08 is done.
