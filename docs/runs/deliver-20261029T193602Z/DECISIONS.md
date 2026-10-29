# Decisions (cross-cutting): deliver-20261029T193602Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261029T193602Z

- [run] ingestion: 39 tracker tasks probed; 5 nodes (TEST-09, TEST-08, BUG-01, BUG-04, TEST-10); 29 cancelled dropped as non-statuses, 7 done dropped. Scaffold TEST-01 done. Map and registry unchanged (registered=none), so no register publish precedes the first dispatch.
- [run] Cancelled task 123k99czeru "TEST-10 follow-up: known-improvements" not imported or registered: a cancelled item is never dispatched.
- [run] Shared-risk inference skipped for 4 empty cells on cancelled rows (CHORE-01, CHORE-06, FEAT-11, FEAT-13): never graph nodes, so no scheduling decision changes.
- [BUG-01] Kept as a todo node despite the stale mayker:to-verify tracker label: readiness reads status, not labels; its merge routes to to_verify.
- [run] Serialization: BUG-01 build held behind TEST-09 (backend/app/main.py); BUG-04 held behind TEST-08 and TEST-10 behind BUG-04 (frontend/src/components/LandingPage.tsx). BUG-01 plans in the third slot. Dispatch order: TEST-09 (w2), TEST-08 (w3), BUG-01 (w3), BUG-04 (w3), TEST-10 (w4).
- [run] Dispatch order as run: TEST-09, TEST-08 and BUG-01 planned in parallel in round 1. BUG-01's build was not serialized behind TEST-09: the orchestrator found the manifest unions disjoint, because TEST-09 did not edit main.py. BUG-04's planning was held until TEST-09 merged and freed a slot (cap 3). BUG-04's build hold behind TEST-08 was released at its plan verdict: the manifests were disjoint, and neither edits LandingPage.tsx. TEST-10 was admitted once TEST-08 and TEST-09 merged, and was not serialized against BUG-04 (disjoint manifests).
- [run] Merged this run: TEST-09 #395 (023601d), BUG-01 #396 (2044c80, done + mayker:to-verify), TEST-08 #397 (1ce28ff), BUG-04 #398 (36e41ec), TEST-10 #399 (ce8b269). Full-suite checkpoints passed after BUG-01, TEST-08, BUG-04 and TEST-10.
- [run] Section W step 1 (final boundary, wave 4): no follow-ups filed. known-improvements: every entry on the five merged PRs is OPTIONAL (TEST-08's one RECOMMENDED was applied by its refactor gate). unaddressed-comments: none.
- [run] Section W step 2 re-ingestion: graph empty. 36 tracker tasks (8 complete, 28 cancelled) + 5 local items (all done); map not written (valid, propose 0/0, shared risk 0 new); registered=none.
- [run] Unregistered tracker task 123k99czeru ("TEST-10 follow-up: known-improvements", cancelled) left unregistered: a cancelled item never merges, so Auto-Done never needs its registry entry.
- [TEST-10] A backend commit "unknown" (BUILD_COMMIT unset) renders as "(unknown)" in the footer. The plan deferred this to BUG-03, which is cancelled in the tracker. The reviewer judged it not a violation of TEST-10's criteria (OPTIONAL, listed in PR #399's known improvements). No follow-up was filed (OPTIONAL is never a source); the backlog owner decides.
- [BUG-01] Done with tracker tag mayker:to-verify: it is not verified until a human checks criterion 3 on the deployed environment and removes the label.
