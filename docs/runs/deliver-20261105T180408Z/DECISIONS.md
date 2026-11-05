# Decisions (cross-cutting): deliver-20261105T180408Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261105T180408Z

- [run] Graph: 5 nodes (TEST-08, TEST-09, TEST-10, BUG-01, BUG-04) from item-status.sh; 30 cancelled items unmapped (null in reverse_status_mapping) and dropped; BUG-01's mayker:to-verify label ignored on a to-do item, so it is built (MDF-515).
- [run] Resume: all five nodes start at 6.1. Reset commit a7ddb99 removed their code and artifacts from main, no feature/* branch or PR exists, tracker status is to do; the earlier feat(TEST-08)/feat(TEST-10) commits are not resume evidence.
- [run] Map: no rows added, proposal returned 0/0, no empty shared-risk cell on a node row; registered=none, so no register publish before round 1.
- [run] Round 1: TEST-09, TEST-08, BUG-01 to planning (wave then chain ordering); BUG-04 held by the cap of 3 and, at build, behind TEST-08 if both manifests list LandingPage.tsx; BUG-01's build behind TEST-09's merge only if both manifests list backend/app/main.py.
- [run] Round 1 build serialization: TEST-09 and BUG-01 built concurrently; the plan verdict found their whole-manifest unions disjoint (TEST-09 does not edit backend/app/main.py: its router was already registered by TEST-05).
- [TEST-08] Review B1: the documentation check deleted the BUILD_COMMIT paragraph of docs/DEVELOPMENT.md that in-flight TEST-09 relies on; fixed in review fix round 1 (closed by re-pass 1). R1: the refactor gate restored docs/DEVELOPMENT.md to main, so TEST-08 no longer touches it and cannot conflict with BUG-01's paragraph.
- [BUG-01] Merged PR #590 at 3438ec1 (squash); deployed-only, so the tracker reads complete + mayker:to-verify: awaiting a human check on the deployed host. Checkpoint pass at 5f90f89.
- [TEST-09] Merged PR #591 at 27df8f0 without rebasing onto BUG-01's merge: manifests disjoint. Checkpoint not due.
- [TEST-08] Merged PR #592 at 8cd79ca (squash). Checkpoint pass at 82cd733.
- [run] BUG-04 admitted in round 3 when BUG-01's merge freed a slot (cap 3); plan approved on first pass (criteria derived from the empty item's title; repro local-automated). Manifest disjoint from TEST-08.
- [run] Wave boundary (wave 2 drained with TEST-09): follow-ups filed none (BUG-01 known improvements OPTIONAL only; TEST-09 none; TEST-08 all findings applied; no unaddressed comments). Re-ingest: 2 nodes (BUG-04 in flight, TEST-10 newly ready), registered=none, 0 wave / 0 checkpoint proposals, map valid.
- [run] TEST-10 dispatched to planning beside BUG-04 without a hold; the pair is re-checked at TEST-10's build dispatch (hold only if its manifest lists NoteForm.tsx or NoteForm.test.tsx).
