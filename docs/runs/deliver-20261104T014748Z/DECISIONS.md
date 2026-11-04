# Decisions (cross-cutting): deliver-20261104T014748Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261104T014748Z

- [run] Ingestion (deliver-20261104T014748Z): 42 items resolved (37 tracker, 5 local); 5 nodes TEST-08, TEST-09, TEST-10, BUG-01, BUG-04 per item-status.sh; 7 done dropped; 30 cancelled rows unmapped (cancelled maps to null) and dropped.
- [BUG-01] Carries mayker:to-verify at to do; the helper counts the label only on done, so it is a todo node and is built (MDF-515).
- [run] All five nodes resume at Section 6.1: main 1f1df4f reset their code and artifacts, no feature/ branch or PR exists; the earlier BUG-04/TEST-10 merges (#522, #521) are reverted and do not count as resume state.
- [run] Map not written: every node has a row and a registry entry (registered=none), 0 wave and 0 checkpoint proposals, every node row already carries a shared-risk note.
- [run] Serialization: TEST-09 and BUG-01 held apart on backend/app/main.py; TEST-08, BUG-04 and TEST-10 held apart on frontend/src/components/LandingPage.tsx. Round 1 dispatches TEST-09 and TEST-08 only; holds re-checked against the union of File Manifests at plan time (MDF-048).
- [run] Wave order applied as an ordering key only: TEST-09 (wave 2) first, then wave 3 by chain length.
- [run] Dispatch order: round 1 TEST-09 (wave 2) and TEST-08 (wave 3) planned in parallel; BUG-01 (wave 3) admitted to planning in the free third slot (plans may always run in parallel). BUG-04 (wave 3) planned after TEST-09 merged; TEST-10 (wave 4) planned after TEST-08 and TEST-09 merged.
- [run] Serialization holds lifted on the union of File Manifests (MDF-048): TEST-09 did not touch backend/app/main.py, so BUG-01 built beside it; TEST-08 did not touch LandingPage.tsx, so BUG-04 and TEST-10 were not held on it. All five builds had disjoint manifests.
- [TEST-08] The tracker correction comment (backend version at runtime via GET /api/version) sat on the second page of the item's comments; the previous run (deliver-20261104T003304Z) read one page and planned against package.json. This run paginated, carried the correction, and answered it on the item.
- [run] Merged: TEST-09 #526 (2ce35f0), BUG-01 #527 (e0e048f, to_verify), TEST-08 #528 (5796772), BUG-04 #529 (8ab89c8), TEST-10 #530 (7ddea42). Full-suite checkpoint passed after each flagged merge.
- [run] Section W was not run at the wave-2 boundary (after TEST-09 merged) nor at the wave-3 boundary (after BUG-04 merged); the session continued straight to the next round. No follow-up source fired at either (every RECOMMENDED finding was applied by its refactor gate; no comment was unaddressed at merge), so nothing went unfiled; the final boundary below re-ingests and publishes the whole run once.
- [run] Final boundary follow-ups: none. Sources read for all five merged items: known-improvements (no unapplied RECOMMENDED finding; TEST-10 carries one OPTIONAL, not a source) and unaddressed-comments (none).
- [run] W.2 re-ingest: nodes=none after TEST-09 #526, BUG-01 #527, TEST-08 #528, BUG-04 #529, TEST-10 #530 merged; tracker re-listed (38 tasks, closed included) and docs/issues/ re-read (5 local, all done): no new item, backlog drained.
- [BUG-01] W.2 re-ingest reads status=to_verify (complete + mayker:to-verify); dropped as merged-awaiting-verification, never a node.
- [run] W.2 re-ingest: registered=none; map reconcile added no row, proposal wrote nothing (0 wave, 0 checkpoint), map valid; no Section L register publish required.
