# Decisions, TEST-08

- Plan base: 5d29468ad50844afdfbffe66a9db8b539ee4e7c6
- 6.1 tracker comments (run deliver-20261017T183944Z): 9 read, 1 actionable (the human correction: version from the backend at runtime via GET /api/version, record loading and failure states, say so in the plan if a backend change is involved). 1 operator note about an earlier revert (historical, not actionable); 7 framework PR-link or answer comments from earlier runs.
- Admitted at 6.1 after BUG-01 merged (slot freed); wave 3, no lower-wave item ready.
- plan self-approved (6.2, first pass): All four criteria map to a covering tier with reasons on the three Unit rows; the tracker correction is applied and the no-backend-change answer is verified against backend/app/routers/version.py on main. The frontend/src/api/config.ts extraction is a necessary consequence of a second client under coding_standards.md Section 5 (one value, one source); the TEST-04 spec, UAT and LandingPage.test.tsx edits are forced because each asserts the package.json version the footer will no longer show. Recorded states: loading and failure both show Task Notes only; the backend unknown sentinel counts as failure.
- Status: plan_review then ready_for_build (tracker on hold); no readiness label to remove (item carries none).
- Conflict check: manifest union disjoint from BUG-04 and TEST-09 (both merged before this build), so no serialization.
- 6.3 worktree: [worktree-deps] installed=2 present=0 unlocked=0 failed=0 duration=1s; [run-dir] move-item: moved=3 appended=0 kept=4 failed=0
- 6.4 merged-since: [merged-since] base=5d29468 (forced) ref=origin/main@b0947a4 commits=2 overlap=0 verdict=clean
- 6.4 phases: A, D, G, Docs (plan sections Frontend and E2E present; no backend or scaffold).
- 6.4 Phase A: cc6a59a feat(TEST-08): implement frontend components; frontend 40 passed 0 failed.
- Session note: an ad-hoc lsof port probe chained onto the Phase D bracket call was UNAVAILABLE (refused: This Bash command contains multiple operations. The following part requires approval); the shipped calls were re-run alone, no probe substituted.
- 6.4 Phase D: d80d210 test(TEST-08): add E2E test specs; e2e-smoke 6 passed 0 failed against the compose stack (brought up and torn down by the dispatch).
- 6.4 Phase G: 79a9ace test(TEST-08): add UAT scenarios and manual script; deviations: TEST-04 script prerequisite re-pointed to /api/version; TEST-04 script still names ports 5173 and 8000 in its setup (left, out of scope).
- 6.4 Docs check: no documentation change (no doc names the footer version source or notes.ts as the base URL home; no Section 15 trigger fired).
- 6.5 self-review pass 1: VERDICT: PASS blocking=0 recommended=1 optional=1. RECOMMENDED: TEST-04 UAT script lines 8, 17 and 23 and TEST-04 feature lines 8 and 12 name ports 5173 and 8000; the stack serves 5183 and 8010. OPTIONAL: version.test.ts asserts the default URL literal rather than the env resolution. Sent to the refactor gate.
- 6.5 refactor gate: 1 improvements applied (13 files examined); 08544cc refactor(TEST-08): code quality cleanup; RECOMMENDED ports applied (5183 and 8010 in the TEST-04 UAT script and feature); OPTIONAL version.test.ts literal declined to known improvements; frontend 40 passed. Gate recheck: see the next line.
- Review closure: no BLOCKING finding raised (pass 1 blocking=0).
