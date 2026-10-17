# Decisions (cross-cutting): deliver-20261017T183944Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261017T183944Z

- 2026-10-17 [run] Dispatch order TEST-09, BUG-01, BUG-04, TEST-08, then TEST-10; round 1 plans TEST-09, BUG-01 and BUG-04. Rationale: wave ascending then ID with no priority set; cap 3 leaves TEST-08 queued for the first free slot, and the three dispatched items share no files.
- 2026-10-17 [run] TEST-08 build serialized after the BUG-04 merge; TEST-10 build serialized after BUG-04 if still unmerged. Rationale: all three plausibly edit frontend/src/components/LandingPage.tsx (shared_risk_notes); the chain is three serial builds in any order, so the ID order costs no throughput.
- 2026-10-17 [run] Inferred shared_risk_notes for BUG-01: no overlap with any open row. Rationale: the fix lives in backend/app/routers/server_time.py and its tests; TEST-09 touches the version files and core/config.py, the other open items are frontend only.
- 2026-10-17 [run] Dropped 14 cancelled tracker rows (TEST-11 to TEST-15, BUG-02, BUG-03, CHORE-01 to CHORE-06, FEAT-2, FEAT-3) from the graph without dispatch. Rationale: a cancelled tracker status is closed and maps to no framework status; the map rows stay for history.
- 2026-10-17 [run] Resume map: TEST-08, TEST-09, TEST-10, BUG-01 and BUG-04 have no remote branch, no open PR and no artifact, so each runs the full lifecycle from 6.1. Rationale: Section 4 ground-truth read (git ls-remote, gh pr list, .claude/artifacts listing).
- 2026-10-17 [run] Wave 2 drained (TEST-09 merged as PR 195). Follow-ups: none filed; sources read for BUG-01, TEST-09 and BUG-04: no RECOMMENDED finding was left unapplied (BUG-01 had none, TEST-09 and BUG-04 had all applied by the refactor gate) and no comment was unaddressed at merge. Re-ingest: tracker re-listed, no new item; local items unchanged.
- 2026-10-17 [run] TEST-08 admitted to 6.1 after BUG-01 merged; its manifest union is disjoint from BUG-04 and TEST-09, so the LandingPage.tsx serialization recorded at ingest did not apply (neither plan touches LandingPage.tsx).
- 2026-10-17 [run] Plugin-file reads through the ~/.mayker pointer by the Read tool were refused in three builder dispatches (UNAVAILABLE, refused: Permission to use Read has been denied); later dispatches were handed the resolved absolute plugin path. Framework defect, reported here and not filed in the project tracker.
