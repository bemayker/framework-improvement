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
- [run] TEST-08 merged (#584, squash 38e535b, auto-done run 42039710503 succeeded, status complete); its test checkpoint passed on 38e535b. TEST-10 became ready (TEST-08 and TEST-09 done) and was planned and self-approved (TEST-08 E2E spec substring relaxation judged forced by the commit suffix).
- [run] BUG-04 plan self-approved; manifest disjoint from TEST-08 and TEST-10, so built concurrently. Repro local-automated: before=fail, after=pass on NoteForm.test.tsx.
- [run] TEST-10 Phase D held behind BUG-04: smoke run ports
- [run] TEST-10 merged (#586, squash 262e1f5, auto-done run 42043639399 succeeded, status complete); its test checkpoint passed on 262e1f5. Its handover rebuild failed (local Docker daemon 500), recorded in the PR body, handover not withheld.
- [run] Local Docker daemon failure from ~14:58Z: BUG-04's Phase D smoke run could not provision Postgres; handover rebuilds failed; `docker info` 500, `docker version` hung, socket _ping timed out repeatedly for ~25 minutes. Docker Desktop was not restarted by the run (operator's machine).
- [run] BUG-04 BLOCKED at 6.6 (bounded failure): the test gate refused its push, exporting DATABASE_URL from this run's stale `- env:` line (BUG-04-db, port 55015 still accepting TCP after the container died). Not bypassed. Remedy: restart Docker Desktop, `docker rm -f BUG-04-db BUG-04-db2`, re-run /mayker-dev:deliver (resumes BUG-04 at 6.6).
- [run] Final boundary, follow-ups: none filed — TEST-08 and TEST-10 known improvements are OPTIONAL only; BUG-04 is blocked and excluded.
- [run] FINAL-boundary re-ingest: item-status.sh over 42 items gives nodes=BUG-04 only (done=10, to_verify=1 BUG-01, unmapped=30 cancelled, link=0); fresh ClickUp listing (38 tasks) shows no human-filed item since the wave-2 boundary; registered=none; map not written, valid (42 rows, 43 edges). Dispatchable=0, in flight=0, blocked=1. Run proceeds to Section 8: every remaining item blocked.
