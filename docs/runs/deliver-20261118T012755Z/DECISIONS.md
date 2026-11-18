# Decisions (cross-cutting): deliver-20261118T012755Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261118T012755Z

- [ingest] run=deliver-20261118T012755Z nodes=5 (TEST-09, TEST-08, BUG-01, BUG-04, TEST-10) from item-status.sh; done dependencies FEAT-1, TEST-01, TEST-03, TEST-04, TEST-05 dropped; cancelled tracker items map to null and are not nodes.
- [ingest] label-ignored=BUG-01 (mayker:to-verify on todo: the label counts only on done, so the item reads as todo). BUG-01 stays a todo node and is built.
- [ingest] registered=none; feature_map.md not written: every node already has a row, a registry entry, a wave, a checkpoint decision and a shared-risk note; 0 wave and 0 checkpoint proposals over 42 rows; map validates.
- [ingest] No cycle; live edges are TEST-08 to TEST-10 and TEST-09 to TEST-10 only.
- [serialize] TEST-09 and BUG-01 held apart (both plausibly edit backend/app/main.py); TEST-08 and BUG-04 held apart, and TEST-10 and BUG-04 held apart (frontend/src/components/LandingPage.tsx). Source: existing shared_risk_notes; re-judge on whole-feature File Manifests after planning.
- [order] Ready set ordered wave ascending then longer chain: TEST-09 (wave 2), TEST-08 (wave 3, chain 2), BUG-01 (wave 3, chain 1), BUG-04 (wave 3), then TEST-10 (wave 4, blocked). Round 1 dispatches TEST-09 and TEST-08.
- [resume] All five nodes resume at Section 6.1: no remote feature branch, no feature PR, no plan artifact, no worktree.
- [order] BUG-01 planner dispatched in round 1's third slot: plan-phase items may always run in parallel (Section 5 step 2); its build remains subject to the conflict rule.
- [plan] TEST-09 plan approved (criteria, tracker comment, scope, layering, coverage table 13 ids, technology selection all pass). TEST-09 and BUG-01 main.py serialization lifted: TEST-09's manifest does not list backend/app/main.py; BUG-01 build concurrency re-checked against TEST-09's 14 entries at BUG-01's plan verdict.
- [plan] TEST-08 plan approved (first plan); BUG-04 stays serialized after TEST-08: TEST-08's manifest edits LandingPage.test.tsx and frontend/src/api/notes.ts, and BUG-04 has no manifest yet to prove disjointness.
- [plan] BUG-01 plan approved (first plan); scope change accepted: recreate FEAT-1's GET /api/time (absent from main) bounded to FEAT-1's criteria plus Cache-Control: no-store. BUG-01 builds concurrently with TEST-09 and TEST-08: whole-manifest union (10 vs 14 vs 12 entries) shares no path. Serialize BUG-01 against any later item listing backend/app/main.py or backend/tests/unit/test_main_unit.py.
- [repro] BUG-01 classified deployed-only (CDN edge cache exists only on the deployed environment). PR #877 labelled mayker:to-verify before conversion.
- [merge] TEST-09 #875 merged squash a283d444 (orchestrator verdict: all autonomy.md Section 5 conditions hold; CI 7/7 green; self-review 0/0/1).
- [merge] TEST-08 #876 merged squash e60e1a39 (CI 7/7 green; self-review 0/1/1, the RECOMMENDED finding applied by the refactor gate).
- [merge] BUG-01 #877 merged squash ab057bdb (CI 7/7 green; self-review 0/1/1 applied; deployed-only repro, merge permitted). Merge order TEST-09, TEST-08, BUG-01: TEST-09 changes the /api/version contract TEST-08 consumes; TEST-08 releases the BUG-04 hold; BUG-01 alone edits main.py.
- [post-merge] auto-done succeeded on all three (runs 44218935565, 44218953587, 44218970978). TEST-09 and TEST-08 complete; BUG-01 complete + tag mayker:to-verify (awaiting human verification on the deployed environment).
- [checkpoint] TEST-08 and BUG-01 test_checkpoint due: full suite on main ab057bdb passed both times (pytest 62 passed, 14 skipped; vitest 33 passed). TEST-09 not flagged (not-due).
- [wave] wave 2 drained (TEST-09). Follow-ups: none (no unapplied RECOMMENDED finding, no unaddressed comment on any merged item; OPTIONAL findings stay on their PRs).
- [ingest] wave-2 boundary re-ingest: tracker list re-read (38 tasks, closed included), no item filed since run start, no mayker:link item; registered=none, so no registry or map write. [item-status] items=42 nodes=2 done=9 to_verify=1 unmapped=30 link=0 labels-ignored=0, nodes=TEST-10,BUG-04. TEST-09 and TEST-08 dropped as done; BUG-01 dropped as to_verify.
- [ingest] TEST-10 ready (TEST-08 and TEST-09 done); BUG-04's serialization behind TEST-08 released by TEST-08's merge. Both resume at 6.1. feature-map-propose.sh: 0 wave and 0 checkpoint proposals over 42 rows; map validates.
- [serialize] BUG-04 and TEST-10 plan concurrently; the build-time hold on the pair (map note: LandingPage.tsx) is re-judged on whole-feature File Manifest unions after both plans, BUG-04 first (wave 3) if they overlap.
