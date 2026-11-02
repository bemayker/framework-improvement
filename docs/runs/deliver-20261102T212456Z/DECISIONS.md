# Decisions (cross-cutting): deliver-20261102T212456Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261102T212456Z

- [run] Ingestion: 5 nodes (BUG-04, BUG-01, TEST-10, TEST-09, TEST-08), all todo, all resume at 6.1; registered=none; graph 2 edges (TEST-08 and TEST-09 before TEST-10), no cycle.
- [run] BUG-01 carries mayker:to-verify while todo: the label counts only on done, so BUG-01 is built (MDF-515).
- [run] 30 registered tracker items at cancelled map to null and are not nodes; 3 list tasks outside the registry were read as cancelled by the session list read and are not scheduled.
- [run] Shared risk: CHORE-01 and CHORE-06 empty cells inferred and written (both cancelled). Serialization pairs among nodes: TEST-09 and BUG-01 (backend/app/main.py), TEST-08 and BUG-04 (LandingPage.tsx), TEST-10 and BUG-04 (LandingPage.tsx).
- [run] Round 1 dispatch order: TEST-09 (wave 2), TEST-08 (wave 3, chain 2), BUG-01 (wave 3, chain 1) planned in parallel; plan phases may run concurrently, build serialization is decided on the approved manifests.
- [run] Merged: TEST-09 #486 (2fb60c4, done), BUG-01 #485 (20e3ddd, complete + mayker:to-verify, awaits a human check on the deployed host), TEST-08 #487 (4564310, done), BUG-04 #488 (155231c, done), TEST-10 #489 (f8d0a61, done). Full-suite checkpoints passed after BUG-01, TEST-08, BUG-04 and TEST-10; TEST-09 not flagged.
- [run] Dispatch order: round 1 planned TEST-09, TEST-08, BUG-01 in parallel; approved manifests were disjoint, so all three built concurrently (the feature-map main.py and LandingPage.tsx flags did not hold on the approved manifests). BUG-04 admitted after TEST-09 and BUG-01 merged; TEST-10 admitted when TEST-08 and TEST-09 had merged. BUG-04 and TEST-10 built concurrently (disjoint manifests).
- [run] Section W was entered once, at the final boundary, not at each intermediate wave drain (waves 2 and 3 drained during the run). No follow-up source fired at those boundaries either, so nothing was lost, but the intermediate wave records were not published separately; this boundary publishes the whole run's record.
- [run] Follow-ups: none filed. Sources read for all five merged items. unaddressed-comments: none on either surface. known-improvements RECOMMENDED: TEST-08 and TEST-10 each list one, "E2E tier unobserved locally" (refactor gate declined: no Chromium in this machine's Playwright cache). Both were discharged on the merged heads by the CI e2e check (SUCCESS on #487 and #489), so the finding no longer holds and filing it would add an item for work already done. Every other known improvement is OPTIONAL or a note.
- [run] Environment gap, not a project item: the Playwright Chromium headless shell is missing from this machine's browser cache, so no Phase D smoke run executed for TEST-08, BUG-04 or TEST-10; CI was the first execution of every E2E spec this run added or edited.
- [run] Builder evidence defects (framework, not filed): BUG-01 and TEST-09 Phase B builders first appended - tests: counts they had not observed (corrected or flagged afterwards); the TEST-10 gate builder appended tier=e2e passed=0 failed=6 for a browser launch failure; BUG-01's docs check claimed no README or docs/ existed (false; its conclusion held on the real files).
