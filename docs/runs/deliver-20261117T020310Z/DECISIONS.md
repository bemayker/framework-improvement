# Decisions (cross-cutting): deliver-20261117T020310Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261117T020310Z

- [ingest] run=deliver-20261117T020310Z nodes=5 (TEST-09, TEST-08, BUG-01, BUG-04, TEST-10) of 42 items; dropped done=7, unmapped(cancelled)=30. Whole-backlog scope; nodes are item-status.sh's nodes= line.
- [ingest] label-ignored=BUG-01 (mayker:to-verify on todo: the label counts only on done, so the item reads as todo). BUG-01 stays a node and is built.
- [ingest] unmapped=30 items ("cancelled" maps to null in reverse_status_mapping): BUG-06, FEAT-14, CHORE-1, FEAT-13, FEAT-12, FEAT-11, FEAT-10, FEAT-9, FEAT-8, FEAT-7, FEAT-6, FEAT-5, FEAT-4, CHORE-06, FEAT-3, CHORE-05, FEAT-2, TEST-15, CHORE-04, TEST-14, TEST-13, TEST-12, CHORE-03, CHORE-02, CHORE-01, BUG-03, TEST-11, BUG-02, TEST-07, TEST-06. Dropped from the graph, never scheduled or written to.
- [ingest] registered=none; feature_map.md valid (42 rows, 43 edges) and not written; proposal 0 waves and 0 checkpoints; shared-risk 0 inferred (no empty cell).
- [resume] All five nodes take the full lifecycle from 6.1. Merged PRs #818, #819, #820, #822, #824 of run deliver-20261117T010850Z are not resume evidence: #827 reset the code to reset-base-r2, no feature/* head is on the remote, no plan artifact or worktree exists, and the tracker reads each at "to do".
- [schedule] Order TEST-09 (wave 2), then TEST-08, BUG-01, BUG-04 (wave 3, by chain length then ID), then TEST-10 (wave 4, blocked by TEST-08 and TEST-09). Serialize TEST-08 and BUG-04 and TEST-10 and BUG-04 on LandingPage.tsx; serialize TEST-09 and BUG-01 on backend/app/main.py when both File Manifests list it.
- [ingest] FEAT-1 reads complete in the tracker, so the BUG-01 edge is satisfied, but main has no server_time router (backend/app/routers holds health, notes and version only); BUG-01's plan must recreate it, as its shared_risk_notes cell already records.
- [schedule] TEST-09 and BUG-01: concurrent build allowed. Union-of-phases File Manifests are disjoint (TEST-09 does not edit backend/app/main.py; BUG-01 does not edit backend/app/core/config.py), so no serialization hold.
- [schedule] TEST-08 plan approved at first pass: all three parts of the tracker correction are honoured, and the requested endpoint already exists on main from TEST-05, so the backend manifest is empty by design.
- [schedule] TEST-08 dispatched to build alongside TEST-09 and BUG-01: whole-feature manifests are disjoint in both pairs, at the cap of 3.
- [schedule] TEST-08/BUG-04 serialization kept and re-keyed from LandingPage.tsx to LandingPage.test.tsx and frontend/src/api/notes.ts; to be re-checked against BUG-04's manifest once planned.
- [merge] BUG-01 PR #828 merged (squash) on the orchestrator's verdict; auto-done run 44002352649 succeeded; item complete with mayker:to-verify (awaiting human verification on the deployed environment). Checkpoint due=yes verdict=pass head=2410428f.
- [merge] TEST-09 PR #829 merged (squash) on the orchestrator's verdict; auto-done run 44002368783 succeeded; item complete. Checkpoint not due.
- [wave-2] Section W step 1: no follow-up filed. Sources read for BUG-01 and TEST-09: known-improvements holds only OPTIONAL findings (never a source); unaddressed-comments: none.
- [re-ingest wave-2] run=deliver-20261117T020310Z nodes=3 (TEST-08, TEST-10, BUG-04) of 42 items; item-status.sh: done=8 to_verify=1 unmapped=30 link=0 labels-ignored=0. Statuses: the session's boundary tracker read for BUG-01, TEST-09, TEST-08, BUG-04, TEST-10; the other 37 carried from this run's first ingest.
- [re-ingest wave-2] dropped since the first ingest: TEST-09 (done, PR #829) and BUG-01 (to_verify, PR #828). unmapped=30 unchanged.
- [re-ingest wave-2] registered=none; no map row added; 0 wave proposals, 0 checkpoint proposals; feature_map.md valid (42 rows, 43 edges). Neither feature_map.md nor project_state.json written.
- [re-ingest wave-2] resume: TEST-08 at 6.7 then 6.9; BUG-04 full lifecycle from 6.1, build held behind TEST-08 pending its manifest comparison; TEST-10 from 6.1 once TEST-08 is done.
- [re-ingest wave-2] refusal: one Bash read of a plugin script (grep over feature-map-propose.sh) refused by bash-shape-guard (plugin-read); usage read with the Read tool instead. Also refused for this session once: a grep over the plugin's build-feature references (bash-shape-guard plugin-read); read with the Read tool instead. Framework-side, reported on the run line.
- [schedule] BUG-04 plan approved; the TEST-08/BUG-04 hold was released before TEST-08 merged (union-of-phases manifests disjoint: BUG-04 touches NoteForm.tsx and its test only; the hold's LandingPage.test.tsx and api/notes.ts are not in its plan).
- [schedule] TEST-10 dispatched to build concurrently with BUG-04: union-of-phases manifests disjoint; only the Phase D smoke-run hold applies (the two Phase D dispatches did not overlap in time, so no hold was logged).
- [merge] TEST-08 PR #830 merged (squash); auto-done run 44002906098 succeeded; checkpoint due=yes verdict=pass head=82b14518.
- [merge] BUG-04 PR #832 merged (squash); repro before fail -> after pass; auto-done run 44004164088 succeeded; checkpoint due=yes verdict=pass head=109b927f; BUG-04-db torn down.
- [merge] TEST-10 PR #833 merged (squash); auto-done run 44004892433 succeeded; checkpoint due=yes verdict=pass head=434df4df.
- [final boundary] Section W step 1: no follow-up filed (TEST-08 known improvements empty; BUG-04 and TEST-10 OPTIONAL only; no unaddressed comments).
- [final boundary] re-ingest: nodes=none (item-status.sh items=42 nodes=0 done=11 to_verify=1 unmapped=30 link=0 labels-ignored=0); registered=none; feature_map.md valid (42 rows, 43 edges), 0 wave and 0 checkpoint proposals; map and registry unchanged.
- [final boundary] remote heads feature/BUG-01, BUG-04, TEST-08, TEST-09 and TEST-10 survive their merged PRs and are not resume evidence; open PR #84 (chore/fixture-plan-review) belongs to no item. Left as found.
