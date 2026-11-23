# Decisions (cross-cutting): deliver-20261123T150435Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261123T150435Z

- run=deliver-20261123T150435Z [ingest] Graph is 5 nodes (TEST-08, TEST-09, TEST-10, BUG-01, BUG-04) of 52 items; 7 dropped as done, 40 dropped as unmapped. Verdicts are item-status.sh's, not a reading of statuses.
- run=deliver-20261123T150435Z [ingest] label-ignored=BUG-01 (mayker:to-verify on todo: the label counts only on done, so the item reads as todo). BUG-01 is a todo node and is built.
- run=deliver-20261123T150435Z [ingest] unmapped= on 40 items, each ("cancelled" maps to null in reverse_status_mapping): TEST-06, TEST-07, TEST-11 to TEST-15, BUG-02, BUG-03, BUG-06, CHORE-1, CHORE-01 to CHORE-06, FEAT-2 to FEAT-24. None is scheduled or written to.
- run=deliver-20261123T150435Z [ingest] No map or registry write: every tracker item already has both, so registered=none and no register publish is made.
- run=deliver-20261123T150435Z [ingest] Proposal accepted as returned: 0 wave and 0 checkpoint proposals.
- run=deliver-20261123T150435Z [ingest] Shared-risk re-run found nothing new: the only empty cells are TEST-01 (done scaffold) and FEAT-18 (cancelled, docs only).
- run=deliver-20261123T150435Z [schedule] Ready order is TEST-09, TEST-08, BUG-01, BUG-04 (wave, then chain length, then ID; no priorities set).
- run=deliver-20261123T150435Z [schedule] Round 1 dispatches plans for TEST-09, TEST-08 and BUG-01 (max parallel 3). The orchestrator's build-time holds (BUG-01 behind TEST-09 on backend/app/main.py; BUG-04 and TEST-10 behind TEST-08 on LandingPage.tsx) do not bind the plan phase: Section 5 step 2 says items in their plan phase may always run in parallel. The holds are re-judged at build dispatch against the File Manifests.
- run=deliver-20261123T150435Z [resume] All 5 nodes take the full lifecycle from 6.1: no remote or local feature branch, no PR, no plan artifact and no surviving worktree.
- run=deliver-20261123T150435Z [schedule] Plan verdicts released every map-note hold on file evidence: TEST-09 and BUG-01 disjoint (TEST-09 never touches backend/app/main.py); TEST-08 disjoint from both (it does not touch LandingPage.tsx); BUG-04 disjoint from TEST-08; TEST-10 disjoint from BUG-04. The feature map's shared-risk notes on LandingPage.tsx and main.py did not hold for any planned manifest.
- run=deliver-20261123T150435Z [schedule] BUG-04 planning waited for a slot (max parallel 3) until TEST-09 and BUG-01 merged; TEST-10 became ready when TEST-08 merged and was planned while BUG-04 built.
- run=deliver-20261123T150435Z [update-branch] PR #958 (TEST-08) was updated from main after TEST-09 (#957) changed GET /api/version, and CI re-ran green before its merge. PR #960 (TEST-10) merged without an update over BUG-04's disjoint merge (orchestrator verdict).
- run=deliver-20261123T150435Z [session-error] TEST-08 Phase A commit subject was dispatched as "feat(TEST-08): implement frontend" (map: "... implement frontend components"); amended message-only before any push.
- run=deliver-20261123T150435Z [session-error] A stray placeholder comment was posted to ClickUp TEST-08 (comment 1200230000160398) and deleted within a minute; the real PR-opened comment followed.
- run=deliver-20261123T150435Z [session-error] BUG-04's reproduction command was dispatched as `npm --prefix frontend exec --no -- vitest run ...`, which runs vitest from the worktree root without frontend/vite.config.ts (no jsdom). Its first before line is a false positive; the builder re-ran before with `npm --prefix frontend test -- ...` on the same base and the verdict is before fail -> after pass. A framework report: the dispatch template should name the frontend-rooted command.
- run=deliver-20261123T150435Z [checkpoint] Four test checkpoints ran on the integrated default branch and passed: BUG-01 (head 035c4d4b), TEST-08 (4dc99708), BUG-04 (f44992fe), TEST-10 (139bc856). TEST-09 not due (no flag). The BUG-01 checkpoint and three pushes skipped 14 database-backed backend tests locally; CI ran them.
- run=deliver-20261123T150435Z [ingest] Final-boundary re-ingest: [item-status] items=52 nodes=0 done=11 to_verify=1 unmapped=40 link=0 labels-ignored=0. registered=none. No follow-up filed: every RECOMMENDED finding was applied by its gate or disproved by its own Verify line, and no comment was left unaddressed.
- run=deliver-20261123T150435Z [human] BUG-01 merged at to_verify (complete plus tag mayker:to-verify): criterion 3 needs a human check on the deployed environment; docs/DEVELOPMENT.md has no Test environments row naming it.
