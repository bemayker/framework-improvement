# Decisions (cross-cutting): deliver-20261119T001937Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261119T001937Z

- [run] Ingest: 42 items read (38 tracker, 4 local); nodes=TEST-08,TEST-09,TEST-10,BUG-01,BUG-04; 7 done and 30 cancelled dropped (cancelled maps to null in reverse_status_mapping).
- [BUG-01] mayker:to-verify label ignored on a todo item; merged fix #904 (5dce121e) was removed from main by reset #907 (49c5d32d), so the item is rebuilt from 6.1.
- [run] Resume: all five nodes start at 6.1. Merged PRs #903/#904/#905 were reverted by reset #907; code on main and tracker status agree they are unfinished.
- [BUG-01] Dependency FEAT-1 is complete in the tracker but its server_time code is absent from main; readiness follows status, so the plan must recreate the router.
- [run] Registry and map: nothing missing, registered=none; map valid, 0 wave and 0 checkpoint proposals.
- [run] Dispatch order (cap 3): TEST-09 (wave 2), TEST-08 (wave 3, chain 2), BUG-01 (wave 3, chain 1); BUG-04 (wave 3) held behind TEST-08 on LandingPage.tsx; TEST-10 (wave 4) waits on TEST-08 and TEST-09.
- [run] Serialization: TEST-09/BUG-01 builds serialize if both whole-feature manifests list backend/app/main.py, decided at plan verdict.
- [run] Order: BUG-01 checkpoint (dd171eb8) and TEST-08 checkpoint (c9764f34) passed; TEST-10 admitted after TEST-08 and TEST-09 merged; BUG-04 and TEST-10 run concurrently (whole-feature manifests disjoint, orchestrator verdicts).
- [run] TEST-10 Phase D held behind BUG-04: smoke run ports (BUG-04's refactor gate may re-run its E2E spec on the configured Base URL; held conservatively although that dispatch is not a Phase D).
- [run] Final boundary (wave 4): follow-ups filed none; known-improvements source read for all five merged items (no RECOMMENDED left unapplied: BUG-04's two applied at its gate, TEST-08's one discharged by its own Verify-by-running check), unaddressed-comments source read (none).
- [run] Final-boundary re-ingest: 42 items (38 tracker from a fresh listing, 4 local); nodes=0 done=11 to_verify=1 unmapped=30; registered=none; map valid, 0 proposals. The run ends with the graph empty.
- [BUG-01] Merged and complete with tracker tag mayker:to-verify: not verified until a human runs the deployed check and removes the label.
- [run] BUG-06 carries mayker:to-verify on a cancelled item; not a pending verification.
