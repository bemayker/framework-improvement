# Decisions (cross-cutting): deliver-20261124T101411Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261124T101411Z

[ingest] nodes=BUG-04,BUG-01,TEST-10,TEST-09,TEST-08 from item-status.sh (items=53 nodes=5 done=7 to_verify=0 unmapped=41 link=0 labels-ignored=1); statuses taken from the helper, not from a reading of labels.
[ingest] label-ignored=BUG-01 (mayker:to-verify on todo: the label counts only on done, so the item reads as todo). BUG-01 is a todo node and is built.
[ingest] unmapped=41 items ("cancelled" maps to null in reverse_status_mapping): BUG-02, BUG-03, BUG-06, TEST-06, TEST-07, TEST-11 to TEST-15, CHORE-01 to CHORE-06, CHORE-1, FEAT-2 to FEAT-25. All dropped from the graph, none scheduled.
[ingest] registered=none: every node already has a registry entry and a map row; no register publish before the first dispatch.
[ingest] feature_map.md valid (53 rows, 53 edges); feature-map-propose.sh: 0 wave proposals, 0 checkpoint proposals; map not written.
[ingest] shared risk: 0 notes inferred; 3 empty cells left on non-node rows (TEST-01 done, FEAT-18 and FEAT-22 cancelled).
[schedule] serialize builds of TEST-09 and BUG-01 (backend/app/main.py), TEST-08 and BUG-04 (LandingPage.tsx), TEST-10 and BUG-04 (LandingPage.tsx), per the map's shared_risk_notes; plans run in parallel regardless. Re-judge each hold on the union of both File Manifests once the plans exist.
[ingest] BUG-01 depends on FEAT-1 (complete in the tracker) whose server_time router is absent from main; the edge counts as satisfied on status, and the plan must recreate the endpoint.
[resume] all five nodes: no remote or local feature branch, no PR, no plan artifact; full lifecycle from 6.1.
[ingest] TEST-08, TEST-09 and TEST-10 carry no mayker:link label: the session's list-items read returned tags=[] for all three (assumption closed).
[schedule] round 1 dispatch order: TEST-09 (wave 2), TEST-08 (wave 3, longer chain: TEST-10 waits on it), BUG-01 (wave 3); BUG-04 waits for a free slot (cap 3).
- run=deliver-20261124T101411Z [merge] BUG-01 #985 merged 2a70e94c (squash); auto-done run 45375644716 succeeded; tracker complete + mayker:to-verify (to_verify arm, criterion 3 awaits a human on the deployed environment).
- run=deliver-20261124T101411Z [merge] TEST-09 #986 merged b9225d4d (squash); auto-done run 45375663149 succeeded; tracker complete.
- run=deliver-20261124T101411Z [checkpoint] BUG-01: due=yes verdict=pass head=b9225d4d (backend 63 passed 14 skipped, frontend 26 passed); TEST-09: not-due (➖).
- run=deliver-20261124T101411Z [merge] TEST-08 #987 merged 7778b626 (squash); auto-done run 45376117937 succeeded; tracker complete.
- run=deliver-20261124T101411Z [checkpoint] TEST-08: due=yes verdict=pass head=7778b626.
- run=deliver-20261124T101411Z [wave-2 boundary] Follow-ups filed: none. Sources read for BUG-01, TEST-09, TEST-08: every known improvement is OPTIONAL (BUG-01 1, TEST-09 1, TEST-08 0 after the gate applied both RECOMMENDED), and no comment went unanswered.
- run=deliver-20261124T101411Z [re-ingest wave-2 boundary] Node set from item-status.sh over a full list read (49 tracker tasks incl. closed, 4 local): items=53 nodes=2 done=9 to_verify=1 unmapped=41 link=0 labels-ignored=0; nodes=TEST-10,BUG-04. TEST-09 and TEST-08 dropped as done, BUG-01 dropped as to_verify (complete + mayker:to-verify).
- run=deliver-20261124T101411Z [re-ingest wave-2 boundary] registered=none: no tracker task lacks a registry entry or a map row; feature_map.md and project_state.json not written (propose: 0 wave, 0 checkpoint proposals; map valid, 53 rows).
- run=deliver-20261124T101411Z [schedule] TEST-10 is ready (TEST-08 and TEST-09 done) and takes a free slot for planning while BUG-04 (wave 3) is in flight; wave orders, it does not gate.
- run=deliver-20261124T101411Z [schedule] BUG-04's hold behind TEST-08 is spent (TEST-08 merged as #987); BUG-04's plan touches only NoteForm.tsx and its tests, so the map's LandingPage.tsx risk did not materialize.
- run=deliver-20261124T101411Z [serialize] TEST-10 build provisionally held behind BUG-04 (map rows flag LandingPage.tsx); re-judged on the union of both File Manifests once TEST-10's plan exists.
- run=deliver-20261124T101411Z [session] Framework observation: the first decisions-log.sh append of this run printed entries=0 for 11 staged lines that did land; the staged lines lacked the "- " prefix the counter expects.
- run=deliver-20261124T101411Z [publish] wave-2 record published through #988 (arm=opened merge=merged, class framework); pr-tests required-at-merge not read by this session.
- run=deliver-20261124T101411Z [merge] BUG-04 #989 merged b85ad956 (squash; the merge call returned a transient 502 while the PR read MERGED); auto-done run 45378294906 succeeded; tracker complete. Repro: before fail -> after pass.
- run=deliver-20261124T101411Z [checkpoint] BUG-04: due=yes verdict=pass head=b85ad956.
- run=deliver-20261124T101411Z [merge] TEST-10 #990 merged e598638f (squash); auto-done run 45378805885 succeeded; tracker complete. Criterion 2 built to the plan's recorded reading (pending and failure show "Task Notes" alone, since version and commit arrive in one response).
- run=deliver-20261124T101411Z [checkpoint] TEST-10: due=yes verdict=pass head=e598638f.
- run=deliver-20261124T101411Z [final boundary] Follow-ups filed: none. Sources read for BUG-04 (no known improvement) and TEST-10 (one OPTIONAL); no comment went unanswered.
- run=deliver-20261124T101411Z [re-ingest final boundary] items=53 nodes=0 done=11 to_verify=1 unmapped=41 link=0 labels-ignored=0; registered=none; map valid (53 rows), 0 wave and 0 checkpoint proposals. Graph empty: the run goes to Section 8.
- run=deliver-20261124T101411Z [observation] TEST-10's review found a real TS2559 type error that no CI gate or test tier checks (no tier runs `tsc -b`); fixed in the PR. The project's gates should run the frontend type check.
