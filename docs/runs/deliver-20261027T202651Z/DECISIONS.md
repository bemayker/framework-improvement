# Decisions (cross-cutting): deliver-20261027T202651Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261027T202651Z

- 2026-10-27 [run] Dispatched BUG-01 as ready although FEAT-1's server_time.py is absent from main. Rationale: readiness reads tracker status (work_items.md Section 7) and FEAT-1 is complete; the sandbox reset removed the code, so BUG-01's plan recreates the route rather than patching it, and the decision is reversible.
- 2026-10-27 [run] Inferred a shared-risk pair TEST-09/BUG-01 on backend/app/main.py and wrote it on both rows (BUG-02's empty cell too). Rationale: BUG-01 must register a new router in main.py; the pair serializes only when both File Manifests list main.py, so planning runs concurrently and the build hold is decided at the plan verdicts.
- 2026-10-27 [run] Held BUG-04 behind TEST-08. Rationale: map flags both on frontend/src/components/LandingPage.tsx and three slots were taken by lower-ordered ready items; released into the first freed slot, earlier if TEST-08's manifest avoids LandingPage.tsx and NoteForm.tsx.
- 2026-10-27 [run] Left CHORE-01 and CHORE-06 shared_risk_notes empty after inference. Rationale: each is a follow-up of its own dependency and both are cancelled; no independent overlap exists, and the column's format admits a note but not a "none".
- 2026-10-27 [run] Accepted the proposal helper's empty output as the wave and checkpoint decision. Rationale: 0 wave and 0 checkpoint proposals over 34 rows, all waved; nothing to record and no authored cell touched.
- 2026-10-27 [run] BUG-04 proceeds with an empty tracker description. Rationale: autonomy.md Section 2 derives missing detail from the item text and the code and never blocks; the planner documents the assumed criteria in the plan and PR.
- 2026-10-27 [run] TEST-08 plan approved; BUG-04 serialization re-keyed from LandingPage.tsx to TEST-08's manifest union (notes.ts, LandingPage.test.tsx), build-phase hold until BUG-04's manifest is known; TEST-08 and TEST-09 cleared to run concurrently (additive response field, disjoint manifests). Rationale: the conflict rule compares whole-feature manifest unions, and TEST-08's plan no longer touches LandingPage.tsx.
- 2026-10-27 [run] TEST-09 and BUG-01 built concurrently with no serialization. Rationale: the BUG-01 plan verdict compared both manifest unions and found zero overlap; TEST-09 leaves main.py untouched.
- 2026-10-27 [run] Wave 2 boundary (TEST-09 merged; TEST-08 and BUG-01 of wave 3 also merged): no follow-ups filed. Rationale: every merged item's known improvements are OPTIONAL and no comment was left unaddressed, so neither Section W source fired.
- 2026-10-27 [run] Re-ingestion at the wave 2 boundary: 2 nodes remain (BUG-04 in flight, TEST-10 newly ready after TEST-08 and TEST-09 merged); no new tracker item, registered=none, no map or registry write. Rationale: the live listing (30 tasks) holds nothing new.
- 2026-10-27 [run] BUG-04 plan self-approved and dispatched to build while the wave 2 boundary was still running. Rationale: the TEST-08 merge lifted its serialization hold, BUG-04's manifest (NoteForm.tsx, NoteForm.test.tsx, its E2E and UAT files) overlaps no in-flight item, and the re-ingestion found no new node that could reorder it.
- 2026-10-27 [run] TEST-10 and BUG-04 shared-risk pair kept but cleared provisionally; the final union-of-phases comparison runs at TEST-10's plan verdict.
