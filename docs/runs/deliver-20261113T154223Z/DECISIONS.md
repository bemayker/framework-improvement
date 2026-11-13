# Decisions (cross-cutting): deliver-20261113T154223Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261113T154223Z

- [ingest] nodes=BUG-04,BUG-01,TEST-10,TEST-09,TEST-08 (items=42 nodes=5 done=7 to_verify=0 unmapped=30 link=0). Statuses and node verdicts are item-status.sh's, not read off labels.
- [ingest] label-ignored=BUG-01 (mayker:to-verify on todo: the label counts only on done, so the item reads as todo). BUG-01 stays a todo node and is built.
- [ingest] unmapped=BUG-06, BUG-03, BUG-02, FEAT-2 to FEAT-14, TEST-06, TEST-07, TEST-11 to TEST-15, CHORE-1, CHORE-01 to CHORE-06 ("cancelled" maps to null in reverse_status_mapping). 30 items dropped, not scheduled.
- [ingest] TEST-02 exists in both the tracker (complete) and docs/issues (done); resolved from the tracker per hybrid resolution. Both read done.
- [ingest] Labels were taken from the session's tracker listing, which named one tag (BUG-01). No mayker:link item was reported, so link=0 rests on that listing.
- [ingest] registered=none. Every node already has a registry entry and a map row; no register publish needed.
- [ingest] Proposal re-run: 42 rows, 0 wave proposals, 0 checkpoint proposals. Shared-risk re-analysis: no empty cell, 0 inferred, existing notes kept.
- [schedule] Ready order TEST-09 (wave 2), TEST-08 (wave 3, chain 2), BUG-01 (wave 3, chain 1), BUG-04 (wave 3, no chain). Tracker priority not in the listing, so chain then ID broke the wave-3 tie.
- [schedule] Round 1 dispatches TEST-09 and TEST-08 and leaves the third slot empty. BUG-01 held behind TEST-09 (backend/app/main.py), BUG-04 behind TEST-08 (LandingPage.tsx). Holds from shared_risk_notes, re-checked against File Manifests once plans exist.
- [schedule] TEST-10 is blocked by TEST-08 and TEST-09 and serialized after BUG-04 (LandingPage.tsx).
- [resume] All 5 nodes take the full lifecycle from Section 6.1: no feature branch on the remote, no open item PR, no plan artifact, no worktree.
- [ingest] Risk for the BUG-01 plan: FEAT-1 is complete in the tracker, but backend/app/routers/server_time.py is absent from main. The planner must put the router's recreation in the File Manifest.
- 2026-11-13 [run] Plan verdicts: TEST-09 approve, TEST-08 approve (orchestrator, logged in each item's decisions.md).
- 2026-11-13 [run] Lifted the TEST-09 and BUG-01 serialization hold, provisionally. Rationale: TEST-09's whole-feature File Manifest (14 paths) lists neither backend/app/main.py nor backend/app/routers/server_time.py, because the version router is already registered on main; the pair is re-compared when BUG-01's manifest exists, before its worktree is cut.
- 2026-11-13 [run] Kept the TEST-08 and BUG-04 serialization hold, on changed grounds. Rationale: TEST-08's manifest does not touch LandingPage.tsx, the file ingestion flagged, but edits frontend/src/components/LandingPage.test.tsx and frontend/src/api/notes.ts, which a double-submit fix plausibly edits; BUG-04 has no plan to prove otherwise.
- 2026-11-13 [run] Admitted BUG-01 at 6.1 (plan) into the free third slot; BUG-04 stays out. Rationale: both are ready in wave 3 and BUG-01 orders first on chain length (1 against none); Max parallel items is 3 with TEST-09 and TEST-08 in flight.
- 2026-11-13 [run] TEST-09 and TEST-08 build concurrently with no serialization. Rationale: their whole-feature manifests are disjoint; the one coupling is a TEST-05 test id TEST-08 cites and TEST-09 may rename, logged as a residual doubt in both items' decisions.md.
- 2026-11-13 [run] Plan verdict: BUG-01 approve (orchestrator, logged in the item's decisions.md).
- 2026-11-13 [run] BUG-01 cleared to build concurrently with TEST-09 and TEST-08, no serialization hold. Rationale: whole-feature File Manifests compared as unions of all phases and the three sets are disjoint; BUG-01 alone lists backend/app/main.py and backend/tests/unit/test_main_unit.py, and TEST-09's committed Phase B (646e243, 11 files) touches neither.
- 2026-11-13 [run] BUG-01 reproduction classified deployed-only. Rationale: the item's steps need the CDN edge cache, absent locally; the merge takes the to_verify route and criterion 3 stays a human check on the deployed environment. docs/DEVELOPMENT.md Test environments has no row, so the environment is the one the item names.
- 2026-11-13 [run] BUG-01 plan accepted with FEAT-1's /api/time endpoint recreated inside it. Rationale: FEAT-1 is complete in the tracker but its code is absent from main at bc70dc4 after the sandbox resets; the recreation is bounded to FEAT-1's contract.
- 2026-11-13 [run] TEST-09 merged (PR #791, 4e346c0); auto-done run 43458448601 succeeded; checkpoint not-due.
- 2026-11-13 [run] TEST-08 merged (PR #792, 293907c); auto-done run 43458984795 succeeded; checkpoint due=yes verdict=pass at 293907c.
- 2026-11-13 [run] TEST-10 unblocked by TEST-08 and TEST-09 merging; admitted at 6.1 (plan).
- 2026-11-13 [run] Plan verdict: BUG-04 approve (orchestrator). Repro class local-automated confirmed.
- 2026-11-13 [run] BUG-04 build hold behind TEST-08 released; BUG-04 admitted to 6.3/6.4. Rationale: TEST-08 merged at 293907c with its checkpoint passed, and BUG-04's File Manifest (NoteForm.tsx, NoteForm.test.tsx, one e2e spec, three UAT files) shares no path with TEST-08's.
- 2026-11-13 [run] Shared-risk pair TEST-10 and BUG-04 lifted provisionally; TEST-10's planner dispatched concurrently in the third slot. Rationale: the pair was inferred on LandingPage.tsx, which BUG-04's manifest does not touch; re-compare when TEST-10's plan exists.
- 2026-11-13 [run] BUG-04 runs concurrently with BUG-01 (PR #793, at handover). Rationale: BUG-04 is frontend and e2e only; BUG-01 is backend only. Slots: BUG-01, BUG-04, TEST-10 make 3 of 3.
- 2026-11-13 [run] BUG-01 merged (PR #793, 78110b3) on the to-verify route; auto-done run 43459595507 succeeded (complete + tracker tag mayker:to-verify); checkpoint due=yes verdict=pass at 78110b3.
- 2026-11-13 [run] TEST-10 plan self-approved: 3 of 3 criteria mapped (planned-tests.sh ids: 11 rows), frontend only, no net-new component or dependency, 10 exact manifest paths. Assumption accepted: pending and failure show the app name alone because version and commit share one response.
- 2026-11-13 [run] TEST-10 admitted to 6.3 and 6.4 beside BUG-04 (2 of 3 slots): manifests compared on the union of all phases, TEST-10 10 paths and BUG-04 6 paths, overlap 0. Earlier build hold behind BUG-04 lifted: its condition is not met.
- 2026-11-13 [run] TEST-10 and BUG-04 shared-risk pair (LandingPage.tsx) lifted: neither manifest names the file; TEST-10 edits LandingPage.test.tsx only, which BUG-04 does not list.
- 2026-11-13 [run] TEST-10 overlap with CHORE-02 (version.ts, AppFooter.tsx) not serialized: CHORE-02 is cancelled in the tracker and not a node in this run's graph.
- 2026-11-13 [run] Phase D of TEST-10 and BUG-04 serialized for smoke run ports; BUG-04's Phase D dispatched first.
- 2026-11-13 [run] TEST-10 merged (PR #794, 9d75ec7); BUG-04 merged (PR #795, 720a8db). auto-done runs 43461780640 and 43461822423 succeeded; both complete. Checkpoint due=yes verdict=pass at 720a8db (pytest 62 passed; vitest 42 passed). BUG-04-db torn down.
- 2026-11-13 [run] Section W step 1 (final boundary): follow-ups filed none. Sources read for all five merged items: known-improvements (every PR lists None; every RECOMMENDED finding was applied by its refactor gate) and unaddressed-comments (none).
- 2026-11-13 [run] Section W step 2 re-ingest (final boundary): 42 items read (38 from one tracker listing, 4 local-only), nodes=none (done=11, to_verify=1, unmapped=30, link=0). registered=none; 0 wave and 0 checkpoint proposals. Backlog drained.
- 2026-11-13 [run] BUG-01 reads complete with mayker:to-verify (to_verify): merged, awaiting a human check on the deployed environment.
