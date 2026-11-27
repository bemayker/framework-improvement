# Decisions (cross-cutting): deliver-20261127T160612Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261127T160612Z

- [run] ingest: 5 nodes (TEST-09, TEST-08, BUG-01, BUG-04, TEST-10) from item-status.sh over 12 items; 7 dropped as done. Cancelled tracker items are not nodes.
- [run] label-ignored=BUG-01 (mayker:to-verify on todo: the label counts only on done, so the item reads as todo). BUG-01 is built, not skipped.
- [run] resume: TEST-08, TEST-09 and BUG-01 restart at 6.1 although #1044, #1043 and #1042 merged them. Reset 7ec0ce6e (#1046) removed their code, tests and artifacts; the tracker reads "to do", no feature branch exists on origin and no node has an open PR.
- [run] resume: BUG-04 and TEST-10 take the full lifecycle from 6.1: no branch, PR or plan artifact.
- [run] registry: registered=none. All 5 nodes are in project_state.json features and in feature_map.md, so no register publish and no map write.
- [run] proposal: feature-map-propose.sh returned 0 wave and 0 checkpoint proposals over 54 rows; every wave and test_checkpoint cell is authored and left as is.
- [run] shared risk: nothing inferred. BUG-01 must recreate server_time.py and register it in main.py (FEAT-1 code absent from main after the reset).
- [run] serialization: BUG-01 build held behind TEST-09 (backend/app/main.py), BUG-04 build held behind TEST-08 (frontend/src/components/LandingPage.tsx); re-judged on File Manifests after planning.
- [run] order: ready set TEST-09 (wave 2), TEST-08, BUG-01, BUG-04 (wave 3, chain 2, 1, 0). TEST-10 waits on TEST-08 and TEST-09 via depends_on.
- [run] dispatch round 1: plan TEST-09, TEST-08 and BUG-01 in parallel. Deviation from the orchestrator's two-slot round: Section 5 step 2 lets items in their plan phase always run in parallel (plans only write .claude/artifacts/{ID}/), so the third slot plans BUG-01; its build stays serialized behind TEST-09.
- [run] TEST-09 / BUG-01 serialization hold lifted: union of both File Manifests shares no path; the hold's basis (main.py, possible config.py or docker-compose.yml edits by BUG-01) is not in either plan as written. Re-judge if either manifest changes during build.
- [run] TEST-08 and TEST-09 build concurrently, no serialization. Rationale: the union of both File Manifests shares no path (TEST-08 frontend and e2e, TEST-09 backend, docker-compose.yml and .env.example); the only coupling is the GET /api/version contract, where TEST-09 adds `commit` and keeps `version`, the one field TEST-08 reads.
- [run] TEST-08 plan verdict revise (the backend "unknown" sentinel rendered as a version, contradicting criterion 3); one re-plan dispatched with the orchestrator's feedback quoted.
- [run] wave-2 boundary: follow-ups filed: none (TEST-09 known improvements none; BUG-01 known improvements OPTIONAL only; no comments unaddressed at merge).
- [run] re-ingest (wave-2 boundary, main ee0d3429): 3 nodes (TEST-08, BUG-04, TEST-10) from item-status.sh over 54 items (done=8, to_verify=1, unmapped=42, link=0, labels-ignored=0). TEST-09 dropped as done (#1048), BUG-01 dropped as to_verify (#1047, complete with mayker:to-verify).
- [run] backlog re-read: 50 tracker tasks, all registered; registered=none, no register publish, no map write. Proposal: 0 wave and 0 checkpoint proposals over 54 rows; map validates.
- [run] dispatch: plan BUG-04 now; its build stays held behind TEST-08's merge unless the manifests share no path (overlap candidates frontend/src/api/notes.ts, frontend/src/components/LandingPage.test.tsx).
- [run] TEST-10 waits on TEST-08 via depends_on; TEST-10 / BUG-04 pair (LandingPage.tsx, LandingPage.test.tsx) re-judged once both plans exist.
- [run] note: feature/TEST-09-version-build-commit and feature/BUG-01-server-time-edge-cache remain on origin after their merges (merged with --squash, no --delete-branch).
- [run] BUG-04 and TEST-10 not serialized; the BUG-04/LandingPage.tsx shared-risk hold is retired. Rationale: BUG-04's approved File Manifest (union of all phases) is NoteForm.tsx, NoteForm.test.tsx and its own E2E/UAT files, sharing no path with AppFooter.tsx, version.ts or LandingPage.tsx; re-judged against TEST-10's manifest at its plan verdict. The TEST-08 hold is moot (TEST-08 merged 91202a21).
- [run] wave-2 publish: arm=opened merge=merged pr=#1050 (chore/mayker-deliver-20261127T160612Z-wave-2); pr-tests required at merge time: not checked by this session (publish.sh merged on green).
- [run] TEST-10 and BUG-04 run concurrently; the provisional shared-risk pair is retired. Rationale: the union of both File Manifests shares no path; BUG-04's manifest names neither LandingPage.tsx nor LandingPage.test.tsx, the two files the pair was held on. CHORE-02 (flagged in TEST-10's shared_risks.md) is cancelled, so no hold.
- [run] final boundary: follow-ups filed: none (TEST-08 and TEST-10 known improvements are OPTIONAL only; BUG-04 has none; no comments unaddressed at merge).
- [run] final-boundary re-ingestion (main at 9c918e1b): remaining node set empty by item-status.sh (items=54 nodes=0 done=11 to_verify=1 unmapped=42 link=0 labels-ignored=0). No item arrived since the run started (50 tracker tasks, 5 local files, 54 map rows).
- [run] BUG-01 dropped as to_verify, not done: tracker complete with mayker:to-verify; left for a human to verify on the deployed environment.
- [run] registered=none; no map or registry write; 0 wave and 0 checkpoint proposals over 54 rows; map validates.
- [run] left as found: three tracker titles differ from their map rows (BUG-05, FEAT-2, FEAT-3); none is a node.
- [run] left for a human: the five merged feature branches remain on origin; draft PR #84 (chore/fixture-plan-review) is open and belongs to no work item.
- [run] refusals: 12, all bash-shape-guard refusals of ad-hoc shapes (plugin-read find/grep, claude-copy cp, paren-group find, one $? in the main session); none was a shipped command and each step completed through the prescribed route. Framework signal: all 6 planner dispatches tried a find on the plan-feature skill folder before reading it.
