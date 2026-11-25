# Decisions (cross-cutting): deliver-20261125T083205Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261125T083205Z

- [ingest] nodes=TEST-08,TEST-09,TEST-10,BUG-01,BUG-04 from item-status.sh (items=54 nodes=5 done=7 to_verify=0 unmapped=42 link=0 labels-ignored=1); whole backlog, no scope.
- [ingest] label-ignored=BUG-01 (mayker:to-verify on todo: the label counts only on done, so the item reads as todo). BUG-01 is a node and is built.
- [ingest] unmapped= on 42 cancelled items ("cancelled" maps to null in reverse_status_mapping); none is a dependency of a node.
- [ingest] registered=none; feature_map.md not written; validator: valid, 54 rows.
- [schedule] order TEST-09, TEST-08, BUG-01, BUG-04, TEST-10 by wave, then chain, then ID; priority unset on all five.
- [serialize] BUG-04 held behind TEST-08: shared_risk_notes on both rows name frontend/src/components/LandingPage.tsx. BUG-01 takes the third slot instead.
- [serialize] BUG-01 and TEST-09: conditional on backend/app/main.py; decided at manifest comparison.
- [risk] BUG-04 has an empty tracker description and no acceptance criteria; the planner assumes and records a scope change.
- [risk] BUG-01 criterion 3 is human verification on the deployed environment; expected to end at to_verify.
- [plan] TEST-09, BUG-01, TEST-08 plans self-approved on first pass by the orchestrator (logs in each item's decisions.md).
- [serialize] BUG-01 and TEST-09 build concurrently, no serialization: union-of-all-phases comparison of both File Manifests finds no shared path; TEST-09 does not modify main.py or test_main_unit.py.
- [serialize] BUG-04 stays held behind TEST-08: TEST-08's manifest now names frontend/src/api/notes.ts and LandingPage.test.tsx, which BUG-04 plausibly edits.
- [repro] BUG-01 classified deployed-only: the edge cache exists only on the deployed environment; no Test environments row configured.
- [status] TEST-09 skipped the on hold (ready_for_build) tracker write between plan review and in progress; BUG-01 and TEST-08 passed through it.
- [merge] TEST-09 merged #1014 squash f247a9bb on the orchestrator's verdict (5 conditions met); auto-done run 45579563872 succeeded; tracker complete.
- [merge] BUG-01 merged #1015 squash 9b4aedbe on the orchestrator's verdict; deployed-only repro, PR labelled mayker:to-verify before conversion; auto-done run 45579582708 succeeded; tracker complete + tag mayker:to-verify (awaits a human check on the deployed environment).
- [merge] TEST-08 merged #1016 squash c480a825 on the orchestrator's verdict; auto-done run 45579759470 succeeded; tracker complete.
- [checkpoint] BUG-01 head=9b4aedbe verdict=pass; TEST-08 head=c480a825 verdict=pass; TEST-09 not-due. Each backend run skipped 14 database-backed tests: no database was provisioned for the checkpoint.
- [wave] boundary after waves 2 and 3 drained (BUG-04 remains in wave 3, now unheld). Follow-ups: none filed: every RECOMMENDED finding of the three merged items was applied by its refactor gate, and no comment was unaddressed at merge.
- [context] ctx=342669 window=1000000 pct=34 model=claude-opus-5-5 verdict=ok wall=ok elapsed_h=0.3 bound=continue
- [framework] bash-shape-guard refused two subagent greps of plugin files (plugin-read) and one session call carrying $? (variable); each was re-routed through the shipped shape, none was substituted. run-env.sh --probe reported listening=no for an IPv4-only uvicorn on 8010 that was serving requests.
- [ingest] re-ingest at the wave boundary (main c480a825): [item-status] items=54 nodes=2 done=9 to_verify=1 unmapped=42 link=0 labels-ignored=0; nodes BUG-04 and TEST-10, both ready, full lifecycle from 6.1; registered=none; map valid, 54 rows, not written.
- [serialize] BUG-04 hold behind TEST-08 lifted by its merge; replaced by a conditional build hold on the flagged pair BUG-04 and TEST-10 (LandingPage.tsx): both plan concurrently, builds serialized BUG-04 first if the whole-feature File Manifests share any file.
- [schedule] order BUG-04 (wave 3, chain 0), then TEST-10 (wave 4, chain 1).
