# Decisions (cross-cutting): deliver-20261102T222558Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261102T222558Z

- [run] Ingestion: 42 items read (37 tracker, 5 local; TEST-02 resolved from the tracker per hybrid). Nodes BUG-04, BUG-01, TEST-10, TEST-09, TEST-08; 30 cancelled items unmapped and dropped. Rationale: cancelled maps to null in reverse_status_mapping.
- [run] BUG-01 label-ignored (mayker:to-verify on a todo item counts only on done). Rationale: readiness label rule.
- [run] Map and registry not written: no missing row or entry, 0 wave and 0 checkpoint proposals; registered=none, no register publish. Rationale: nothing to reconcile.
- [run] Resume: all five nodes start at 6.1. Rationale: no feature branch, PR, artifact or worktree exists; reset commit ba107df undid merges #485 to #489.
- [run] Planned build serialization from shared risk: BUG-01 behind TEST-09 (main.py), BUG-04 behind TEST-08 (LandingPage.tsx), TEST-10 behind BUG-04 (LandingPage.tsx). Confirmed or cleared at plan time on the File Manifest union.
- [run] Round 1 dispatch: plans for TEST-09 (wave 2), TEST-08 and BUG-01 (wave 3). Rationale: Section 5 step 2 lets items in their plan phase run in parallel; the shared-risk holds bind builds only, so the third slot is filled by the next ready item in order (BUG-01 before BUG-04 by ID-independent chain/priority tie, both wave 3).
- [run] Merged: BUG-01 (#493, fce45c7; to_verify via mayker:to-verify, criterion 3 left for a human on the deployed environment), TEST-09 (#494, 584c5c4), TEST-08 (#495, 95cc449). Rationale: orchestrator merge verdicts, all autonomy.md Section 5 conditions met, CI green 7/7 each.
- [run] Builds of BUG-01 and TEST-09 ran concurrently. Rationale: whole-manifest unions share no file (the feature map's main.py note for TEST-09 was stale).
- [run] Checkpoints: BUG-01 verdict=pass head=584c5c4; TEST-08 verdict=pass head=95cc449 (command uv run --directory backend pytest -q && npm --prefix frontend test; 14 database-backed tests skipped in every local run, no backing database provisioned).
- [run] Wave-2 boundary: follow-ups filed: none (BUG-01 and TEST-09 known improvements are OPTIONAL only; no unaddressed comments). Re-ingest: nodes BUG-04, TEST-10; registered=none; map unchanged.
- [run] Next round: BUG-04 and TEST-10 plans in parallel; builds serialized BUG-04 first on LandingPage.tsx unless the approved manifest unions are disjoint.
- [run] Playwright Chromium installed by TEST-08's refactor gate so its E2E specs could execute locally (7 passed). Rationale: discharge the reviewer's RECOMMENDED Verify line; the project's own pinned Playwright version.
- [run] TEST-10 Phase D held behind BUG-04: smoke run ports
- [run] Run publish: wave-2 arm=opened merge=merged pr=https://github.com/bemayker/framework-improvement/pull/496 (docs-only, pr-tests tiers skipped; whether pr-tests was a required check at merge time was not read).
- [run] Merged: BUG-04 (#497, 2647569; repro before fail -> after pass), TEST-10 (#498, 43c8736; criterion 2 satisfied under the recorded interpretation: pending and failure show "Task Notes", not the version). Rationale: orchestrator merge verdicts, CI green 7/7 each.
- [run] BUG-04 and TEST-10 built concurrently. Rationale: whole-manifest unions disjoint (orchestrator); the feature map's LandingPage.tsx flag did not materialize.
- [run] Checkpoints: BUG-04 verdict=pass head=2647569; TEST-10 verdict=pass head=43c8736. BUG-04's push gate ran the database-backed tests for the first time in this run (pytest 76 passed, 0 skipped) against its Postgres container BUG-04-db, torn down at 6.10.
- [run] Final boundary: follow-ups filed: none (TEST-08 and TEST-10 known improvements are OPTIONAL only; BUG-04 has none; no unaddressed comments). Final re-ingest: nodes=none, registered=none, no new item.
- [run] Final-boundary wave record (Section W step 3) folded into the Section 8 report publish. Rationale: both land this run's DECISIONS slice and item decisions at docs/runs/deliver-20261102T222558Z, so a separate publish would duplicate the report publish seconds apart.
- [run] Left for a human: BUG-01 criterion 3 (deployed CDN check; tracker complete with mayker:to-verify); five merged feature branches remain on origin; TEST-04 UAT script port literals 8000/5173 (OPTIONAL on #495).
