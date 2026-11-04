# Decisions (cross-cutting): deliver-20261104T204229Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261104T204229Z

- [run] Ingestion (run=deliver-20261104T204229Z): 42 items read, 5 nodes (TEST-08, TEST-09, TEST-10, BUG-01, BUG-04) per item-status.sh; 30 cancelled tracker items are unmapped (cancelled -> null) and are not nodes; 7 done dropped.
- [run] BUG-01 keeps mayker:to-verify at status to do; the label counts only on done (MDF-515), so BUG-01 is a todo node and will be built.
- [run] #551 (BUG-04) and #552 (TEST-10) merged in the previous run, but #555 reset the code to 36e231a and the tracker holds both at to do; every node resumes at 6.1 with nothing carried over.
- [run] Map valid; 0 wave and 0 checkpoint proposals; no rows added, nothing registered, no register publish needed.
- [run] Serialization: BUG-01 behind TEST-09 (backend/app/main.py), BUG-04 behind TEST-08 and TEST-10 (LandingPage.tsx); round 1 dispatches TEST-09 and TEST-08, third slot held empty rather than run a flagged pair concurrently.
- [run] TEST-09 plan self-approved without re-plan: all criteria tiered with reasons, the 12-char truncation clarification addressed, main.py untouched (version router already registered on main); CI wiring left out of scope.
- [run] BUG-01 planning released in round 1 (plans write only .claude/artifacts/BUG-01/); its main.py hold dropped on TEST-09's manifest; build-stage serialization with TEST-09 pending BUG-01's manifest, judged on the union of both manifests (candidate overlap backend/app/core/config.py, docker-compose.yml, .env.example).
- [run] Round 1 dispatch order: TEST-09 (wave 2) build Phase B, TEST-08 (wave 3) plan verdict, BUG-01 (wave 3) plan. 3 of 3 slots in use.
- [run] TEST-08 plan self-approved on first pass; TEST-08 and TEST-09 build concurrently (whole-manifest unions disjoint; TEST-08's client ignores TEST-09's added commit field).
- [run] BUG-01 plan self-approved on first pass: recreating GET /api/time verified necessary (FEAT-1's code absent from main at f7e2be6), bounded to FEAT-1's contract; BUG-01 builds alongside TEST-09 and TEST-08 (unions disjoint; main.py risk only against TEST-13/FEAT-14, not in flight).
- [run] BUG-01 Repro class deployed-only: the edge cache exists only on the deployed environment (item description); docs/DEVELOPMENT.md Test environments has no row.
- [run] BUG-04 build hold behind TEST-08 stands until BUG-04's manifest exists: TEST-08's Phase A also edited frontend/src/components/LandingPage.test.tsx (not in its plan manifest), which joins TEST-08's union for the overlap check. BUG-04 planning waits for a free slot (3 of 3 in use).
- [run] TEST-09 merged (PR #556, squash, d3f91e5) on all five Section 5 conditions; auto-done run 41912022415 succeeded; checkpoint not due (TEST-09 carries no checkpoint flag).
- [run] TEST-08 merged (PR #557, squash, 4848e83) on all five Section 5 conditions; main had moved by TEST-09 with disjoint files, GitHub CLEAN, no base sync needed; auto-done run 41912686718 succeeded.
- [run] Checkpoint after TEST-08: due=yes items=TEST-08 head=4848e83 tip=origin/main@4848e83 verdict=pass (pytest 58 passed 14 skipped; vitest 39 passed). Admission continues.
- [run] BUG-04 plan self-approved; its build hold behind TEST-08 lifted on disjoint whole-feature manifests (TEST-08's two unplanned files included). Repro class local-automated (NoteForm component test).
- [run] TEST-10 admitted after TEST-08 and TEST-09 merged and the checkpoint passed; planning now. In flight: BUG-01 (merge verdict), BUG-04 (Phase A), TEST-10 (plan). 3 of 3 slots.
- [run] BUG-01 merged (PR #558, squash, 1f9d4f4) on all five Section 5 conditions with the deployed-only Repro verdict; auto-done run 41913385407 succeeded; item at complete with the mayker:to-verify tag (not verified until a human runs the deployed steps and removes it). Checkpoint after BUG-01: due=yes head=1f9d4f4 verdict=pass.
- [run] TEST-10 plan self-approved on first pass; builds concurrently with BUG-04 on a disjoint manifest union. TEST-10's Phase D is not held: BUG-04's Phase D returned before TEST-10 reached Phase D. CHORE-02 (cancelled, not a node) would serialize behind TEST-10.
- [run] BUG-04 merged (PR #559, squash, 9912ca7) with Repro before fail -> after pass; auto-done run 41916185891 succeeded; checkpoint after BUG-04: due=yes head=9912ca7 verdict=pass; BUG-04-db torn down.
- [run] TEST-10 merged (PR #560, squash, d0a0c8e); auto-done run 41916819141 succeeded; checkpoint after TEST-10: due=yes head=d0a0c8e verdict=pass. The graph is empty: 5 of 5 nodes merged.
- [run] Section W was not entered at the wave-2 and wave-3 boundaries as each drained; their follow-up filing and wave publishes are folded into this final boundary and the report publish. Follow-up sources read for all five merged items: known-improvements holds no RECOMMENDED finding the gate left unapplied (every RECOMMENDED was applied by its refactor gate), and no comment was unaddressed at merge; no follow-up filed.
- [run] Final-boundary re-ingest (Section W step 2): 42 items read (38 tracker, 4 local-only); item-status.sh nodes=none (11 done, 1 to_verify, 30 cancelled-unmapped, 0 link); no item arrived since the run started; registered=none; map valid and unwritten (0 wave, 0 checkpoint proposals). BUG-02 stays cancelled; reopening it is a human decision.
- [run] Section W step 3's wave-record publish is folded into Section 8's report publish, which lands the same docs/runs/deliver-20261104T204229Z record plus the root DECISIONS.md; no separate wave publish was opened. The run ends complete: the graph emptied.
