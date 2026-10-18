# Decisions, BUG-01 (run deliver-20261018T232421Z)

- Plan base: 68540ede73e07b9a2c7f9c5a06b4e1fbcb74aef1
- Tracker comments read: 7; actionable 0 (all are mayker-dev PR notices from earlier runs).
- Status planning maps to the tracker status to do, which the item already holds; status write skipped.
- 2026-10-19 [BUG-01] Plan self-approved without re-plan (deliver 6.2 step 1). Rationale: all 3 criteria mapped with a covering tier and reason each; scope is one header on one route (no middleware, no main.py), layering keeps the header in the router as transport (coding_standards.md Section 2.2); Technology Selection records the FastAPI injected Response over a new dependency or app-wide middleware (review_standards.md Section 7); File Manifest names existing files only plus UAT artifacts.
- 2026-10-19 [BUG-01] Fix re-planned in full although PR 201 (3fefb2d) once shipped it. Rationale: 33b4dd7 reverted FEAT-1 and took the header with it, and f1e3ca2 re-landed FEAT-1 without it; main at 68540ed sets no Cache-Control on GET /api/time.
- 2026-10-19 [BUG-01] Status plan review then on hold (ready_for_build) written to ClickUp. No readiness label on the item, so no remove-label call.
- Repro: deployed-only: curl -s https://DEPLOYED-HOST/api/time twice one second apart returns identical now values on the deployed environment; reason: the stale symptom needs the CDN in front of the deployed API, locally nothing caches; environment: not configured (docs/DEVELOPMENT.md Test environments is empty). Local proxy for the cause: uv run --directory backend pytest -q tests/integration/test_server_time_integration.py -k cache_control (source: item)
- 6.3: worktree created from origin/main 68540ed with --no-track; worktree-deps installed=2 present=0 unlocked=0 failed=0; move-item moved=3 appended=0 kept=4 failed=0. Branch publishes at the 6.6 push. Status in progress written to ClickUp. Deployed-only steps written to .claude/artifacts/run/test_steps-BUG-01.md.
- 6.4 merged-since: [merged-since] base=68540ed (forced) ref=origin/main@68540ed commits=0 overlap=0 verdict=clean
- 6.4 Phase B: 291f797 feat(BUG-01): implement backend; server-time unit and integration 15 passed 0 failed. Phase G: e5f16b8 test(BUG-01): add UAT scenarios and manual script.
- 6.4 documentation check: no documentation change needed (README.md and docs/ outside docs/runs do not describe GET /api/time); no commit.
- 6.5 self-review: VERDICT: PASS blocking=0 recommended=0 optional=0. Review closure: no BLOCKING findings.
- 6.5 refactor gate: no findings (3 files examined); 44df060 refactor(BUG-01): code quality cleanup (report only); backend 95 passed 14 skipped 0 failed. Step 2a: [gate-recheck] skipped: the refactor gate added no source or test file.
