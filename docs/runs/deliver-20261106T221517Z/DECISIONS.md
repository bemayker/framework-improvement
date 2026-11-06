# Decisions (cross-cutting): deliver-20261106T221517Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261106T221517Z

- [run] Ingestion: 12 items resolved (5 tracker open, 3 tracker complete, 4 local done); nodes TEST-08, TEST-09, TEST-10, BUG-01, BUG-04; cancelled tracker tasks not imported.
- [run] label-ignored=BUG-01 (mayker:to-verify on todo: the label counts only on done, so the item reads as todo); BUG-01 is built, not treated as merged-awaiting-verification.
- [run] Resume: every node starts at Section 6.1. PRs #622/#623 merged TEST-09/BUG-01 earlier, but #625 reset their code and artifacts and the tracker holds both at to do; no branch, PR or artifact survives for any node.
- [run] Map unchanged: no missing rows, 0 wave and 0 checkpoint proposals; registered=none, no register publish before the first dispatch.
- [run] Serialization: BUG-01 held behind TEST-09 (backend/app/main.py router registration), BUG-04 held behind TEST-08 (LandingPage.tsx); TEST-10 serialized after BUG-04 on the same file. Round 1 uses 2 of 3 slots by design.
- [run] Dispatch order: TEST-09 (wave 2, chain 2) and TEST-08 (wave 3, chain 2; taken beside wave 2, no other wave-2 item ready) in parallel, then BUG-01 and BUG-04 as holds lift, then TEST-10.
- [run] TEST-09 plan self-approved (orchestrator); built in .claude/worktrees/TEST-09, Phase B dispatched.
- [run] BUG-01 hold on backend/app/main.py lifted: TEST-09's approved File Manifest (union of all phases, 12 entries) does not touch main.py, which already registers the version router at bb5fc2a; BUG-01 enters planning in slot 3 now, and its own manifest is re-compared against TEST-09's (config.py, docker-compose.yml, .env.example) at its plan verdict before any build dispatch.
- [run] TEST-08 plan self-approved (orchestrator); built in .claude/worktrees/TEST-08, Phase A dispatched.
- [run] TEST-08 vs TEST-09: no manifest overlap, TEST-08 builds beside TEST-09. The two unions share no path; the only shared risk is the GET /api/version contract, which TEST-09 extends additively (adds commit) while TEST-08's client reads only version, so either merge order is safe.
- [run] BUG-04 stays held behind TEST-08: TEST-08 no longer edits LandingPage.tsx but edits frontend/src/components/LandingPage.test.tsx and frontend/src/api/notes.ts, where a double-submit fix would land; BUG-04 is planned against the merged tree after TEST-08 merges.
- [run] BUG-01 plan self-approved (orchestrator); rebuilding FEAT-1's /api/time slice ruled contained (smallest precondition of criteria 1 and 2, same contract as the reverted #623 tree).
- [run] BUG-01 builds concurrently with TEST-09; no serialization. The whole-feature File Manifest unions are disjoint, and the flagged shared risk (both editing backend/app/main.py) does not hold: TEST-09's landed commits 6ef284a and 27a6cb7 touch neither main.py nor test_main_unit.py.
- [run] BUG-01 reproduction classified deployed-only (the stale value needs the deployed CDN); steps written to .claude/artifacts/run/test_steps-BUG-01.md; no local before/after run.
- [run] TEST-09 self-review: VERDICT: PASS blocking=0 recommended=0 optional=1; refactor gate dispatched.
- [run] TEST-09 merged (PR #626, squash 57e1dbd); auto-done run 42305600252 succeeded, tracker complete; checkpoint not due; worktree removed.
- [run] TEST-08 merged (PR #627, squash 2df5a7e); auto-done run 42306114569 succeeded, tracker complete; test checkpoint due and passed on main at 2df5a7e (pytest 52 passed, 14 skipped; vitest 39 passed); worktree removed.
- [run] BUG-01 PR #628 handed over (green, mayker:to-verify label for its deployed-only reproduction); merge verdict dispatched.
- [run] Readiness recomputed after TEST-08's merge: BUG-04 (wave 3) and TEST-10 (wave 4, deps TEST-08 and TEST-09 done) are ready. Both enter planning in parallel (plans write only artifacts); their builds are compared for overlap (LandingPage.test.tsx, AppFooter.tsx, version.ts) at the plan verdicts and serialized if their manifests collide.
- [run] BUG-01 merged (PR #628, squash c81fd09); auto-done run 42306409338 succeeded; tracker complete with mayker:to-verify (awaits a human check on the deployed environment); test checkpoint due and passed on main at c81fd09 (pytest 61 passed, 14 skipped; vitest 39 passed); worktree removed.
- [run] BUG-04 plan self-approved; reproduction local-automated (NoteForm Vitest case). BUG-04 vs TEST-10: manifest unions disjoint (BUG-04 NoteForm.tsx/NoteForm.test.tsx + own E2E/UAT; TEST-10 version.ts/version.test.ts/AppFooter.tsx/AppFooter.test.tsx/LandingPage.test.tsx + own E2E/UAT); the feature_map LandingPage.tsx warning materialized in neither plan. Both build now in parallel; only the two Phase D smoke runs are serialized on the single E2E base URL :5183.
- [run] TEST-10 plan self-approved; criterion 2 read as "no commit part" (pending or failed keeps "Task Notes"). CHORE-02, the other overlap TEST-10's planner named, is cancelled and not a run node.
- [run] Both BUG-04 and TEST-10 branched from origin/main at c81fd09; merged-since checks: base=2df5a7e (forced) ref=origin/main@c81fd09 commits=1 overlap=0 verdict=clean for each.
- [run] TEST-10 Phase D held behind BUG-04: smoke run ports
- [run] TEST-10 merged (PR #630, squash c7bb613); auto-done run 42308839996 succeeded, tracker complete; test checkpoint due and passed on main at c7bb613 (pytest 61 passed, 14 skipped; vitest 45 passed); worktree removed (emit-clean removed the refactor gate's build outputs frontend/vite.config.js and frontend/vite.config.d.ts).
- [run] BUG-04 merged (PR #629, squash 060436f); repro before fail -> after pass; auto-done run 42309144724 succeeded, tracker complete; test checkpoint due and passed on main at 060436f (pytest 61 passed, 14 skipped; vitest 50 passed); BUG-04-db torn down; worktree removed.
- [run] Final boundary, Section W step 1: no follow-ups filed. Sources read for all five merged items: known-improvements (every entry OPTIONAL: TEST-08 1, BUG-01 1, TEST-10 2, TEST-09 and BUG-04 none) and unaddressed-comments (none: no PR comment, no actionable tracker comment after 6.1).
- [run] Section W step 2 re-ingest (orchestrator): tracker list read closed-included (38 tasks) plus 5 local items; 42 resolved, 0 new since run start, registered=none. item-status.sh: items=42 nodes=0 done=11 to_verify=1 unmapped=30 (the cancelled tasks); BUG-01 reads to_verify. Graph empty; the run goes to the report.
- [run] Section W step 3: wave-3 record published through Section L: [publish] arm=opened branch=chore/mayker-deliver-20261106T221517Z-wave-3 base=main head-was=main pr=https://github.com/bemayker/framework-improvement/pull/631 policy=auto merge=merged (merge f7a76fd). pr-tests was a required status check on main at merge time (ruleset required_status_checks: pr-tests).
