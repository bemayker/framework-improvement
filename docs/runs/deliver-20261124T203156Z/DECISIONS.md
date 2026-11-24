# Decisions (cross-cutting): deliver-20261124T203156Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261124T203156Z

- 2026-11-24 [run] Ingestion: 53 items resolved (49 tracker, 4 local-only), 5 graph nodes (TEST-08, TEST-09, TEST-10, BUG-01, BUG-04); 41 cancelled items unmapped and dropped; registered=none, so no register publish. Rationale: item-status.sh over the tracker listing and docs/issues/; the 5 non-terminal items re-fetched with the pinned workspace id.
- 2026-11-24 [run] All 5 nodes resume at 6.1. Rationale: cfa85c39 reset main to reset-base-r2, removing the code PRs #985 to #990 merged; no feature branch, open PR, artifact unit or worktree exists for any node, and the tracker reads to do.
- 2026-11-24 [run] BUG-01 depends on FEAT-1 (complete in the tracker) while backend/app/routers/server_time.py is absent from main; the dependency counts as satisfied because readiness reads status. Rationale: the BUG-01 planner must recreate the endpoint in its File Manifest and record it as a scope change.
- 2026-11-24 [run] BUG-01 carries mayker:to-verify on a todo item; the label is ignored and the item is built. Rationale: the label counts only on done.
- 2026-11-24 [run] Round 1 plans TEST-09, TEST-08 and BUG-01 concurrently, overriding the ingestion's plan-phase hold on BUG-01. Rationale: Section 5 step 2, items in their plan phase may always run in parallel (plans write only .claude/artifacts/{ID}/); the serialization pairs TEST-09/BUG-01 (main.py), TEST-08/BUG-04 and BUG-04/TEST-10 (LandingPage.tsx) apply to builds and are re-judged on the union of File Manifests. BUG-01 takes the third slot ahead of BUG-04 by ID within wave 3.
- 2026-11-24 [run] TEST-08, TEST-09 and BUG-01 builds ran concurrently with no serialization. Rationale: the whole-manifest unions are pairwise disjoint (TEST-08 frontend and e2e only; TEST-09 config, version slice, Docker, compose, .env.example; BUG-01 server_time slice, main.py, test_main_unit.py).
- 2026-11-24 [run] Merged BUG-01 (#993, e1e64e6d), TEST-09 (#994, 2eb67b90) and TEST-08 (#995, ef286301) on green CI and orchestrator merge verdicts. BUG-01 is deployed-only: merged with mayker:to-verify, tracker complete plus the mayker:to-verify tag; not verified until a human checks the deployed environment. Test checkpoints passed at 2eb67b90 (BUG-01) and ef286301 (TEST-08).
- 2026-11-24 [run] Wave-2 boundary: follow-ups filed none (BUG-01 had no RECOMMENDED finding or unanswered comment; TEST-09's RECOMMENDED finding was applied by its gate and its two OPTIONAL ones are excluded). Re-ingestion: registered=none, nodes BUG-04 and TEST-10, both at 6.1.
- 2026-11-24 [run] BUG-04 and TEST-10 plan concurrently in the next round. Rationale: Section 5 step 2, plans write only their artifact directory; the LandingPage.tsx pair is judged on their File Manifest unions before either builds.
