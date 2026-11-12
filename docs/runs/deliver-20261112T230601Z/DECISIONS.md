# Decisions (cross-cutting): deliver-20261112T230601Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261112T230601Z

- [ingest] 42 items resolved (38 tracker, 4 local-only); nodes=TEST-08,TEST-09,TEST-10,BUG-01,BUG-04 per item-status.sh (items=42 nodes=5 done=7 to_verify=0 unmapped=30 link=0 labels-ignored=1).
- [ingest] label-ignored=BUG-01 (mayker:to-verify on todo: the label counts only on done, so the item reads as todo). BUG-01 is a node and is built.
- [ingest] unmapped= on 30 cancelled items (cancelled maps to null in reverse_status_mapping). Dropped from the graph; none is a dependency of a live node.
- [ingest] registered=none; feature_map.md unchanged (0 rows added, 0 wave proposals, 0 checkpoint proposals). No register publish is due before round 1.
- [ingest] No cycle; edges among nodes are TEST-08 to TEST-10 and TEST-09 to TEST-10. Scaffold TEST-01 is done, gate passes.
- [resume] All five nodes start at Section 6.1 (fresh run): no feature/ branch on the remote, no plan artifact or worktree for any node.
- [schedule] Round 1 dispatches TEST-09 (wave 2), TEST-08 and BUG-01 (wave 3) for planning. BUG-04 (wave 3, ready) is held for a slot: cap 3, it sorts last on chain length.
- [serialize] BUG-04 build held behind TEST-08, and TEST-10 against BUG-04: shared_risk_notes flag frontend/src/components/LandingPage.tsx on each pair. Plans may overlap.
- [serialize] TEST-09 and BUG-01: conditional pair on backend/app/main.py, decided at the build round from the whole-feature File Manifests.
- [note] BUG-04 tracker description is empty: the planner derives criteria from the title and records the assumption; the plan verdict checks it did.
- [schedule] TEST-09, BUG-01 and TEST-08 plans self-approved on first pass (no re-plan). All three in build concurrently: whole-feature manifests pairwise disjoint (TEST-09 lists no backend/app/main.py; TEST-08 touches no backend file).
- [serialize] BUG-04 serialized after TEST-08's merge: whole-feature file sets overlap on frontend/src/components/LandingPage.test.tsx and possibly frontend/src/api/notes.ts. TEST-09 stays concurrent with TEST-08 (added commit field is compatible with a client reading only version).
- [framework-defect] The provenance-guard hook rewrote the BUG-01 plan-verdict entry in .claude/artifacts/BUG-01/decisions.md, replacing two section citations of standards the orchestrator had opened with "(unopened section)". Reported for the framework maintainer; not filed in the project tracker.
- [merge] TEST-09 merged (PR #732, squash 24aff2c); auto-done run 43328255388 succeeded, tracker complete. BUG-01 merged (PR #733, squash 20353cb); auto-done run 43328274827 succeeded, tracker complete + mayker:to-verify (awaiting human verification on the deployed environment). TEST-08 merged (PR #734, squash f2499aa); auto-done run 43328918766 succeeded, tracker complete.
- [checkpoint] BUG-01: due=yes head=20353cb verdict=pass (pytest 62 passed, 14 skipped; vitest 26 passed). TEST-08: due=yes head=f2499aa verdict=pass (pytest 62 passed, 14 skipped; vitest 35 passed). TEST-09: not-due.
- [wave-2] Boundary: follow-ups filed none (TEST-09 and BUG-01 known improvements are OPTIONAL only; no comment unaddressed at merge). Re-ingest: 42 items, none new since the first ingestion; registered=none; no map or registry write.
- [serialize] Released BUG-04's serialization behind TEST-08: whole-manifest union comparison against TEST-08's branch diff shows zero overlapping paths; the flagged LandingPage.tsx overlap did not materialize. BUG-04 built from f2499aa after TEST-08 merged.
- [schedule] TEST-10 admitted for planning once TEST-08 merged (TEST-09 already done). TEST-10 and BUG-04 shared-risk pair kept conditional until TEST-10's File Manifest exists.
- [framework-defect] The provenance-guard hook also rewrote a user_story_alignment.md section citation to "(unopened section)" in BUG-04's staged plan before the planner had opened that standard; the planner read it and restored the citation. Same hook behaviour as on BUG-01's plan verdict.
- [framework-defect] BUG-01's documentation-check builder: a Read of ~/.mayker/mayker-dev/skills/build-feature/references/06-uat-docs-recheck.md was UNAVAILABLE (refused: File is in a directory that is denied by your permission settings.); TEST-08's documentation-check builder read the same file through the same pointer without refusal.
- [merge] BUG-04 merged (PR #736, squash 4af646c); auto-done run 43330383839 succeeded, tracker complete. Repro: before fail -> after pass (npm --prefix frontend test -- --run src/components/NoteForm.test.tsx). Checkpoint due=yes head=4af646c verdict=pass.
- [schedule] TEST-10 build ran concurrently with BUG-04: whole-feature manifests share no path. CHORE-02 (cancelled) stays serialized behind TEST-10 should it ever be reopened (flagged on frontend/src/api/version.ts and AppFooter.tsx).
- [wave-3] Boundary: follow-ups filed none (TEST-08's RECOMMENDED finding was applied by its refactor gate; every other known improvement on TEST-08 and BUG-04 is OPTIONAL; no comment unaddressed at merge). Re-ingest: graph reduced to one node, TEST-10; no item arrived since the first ingestion; registered=none; no map or registry write.
- [merge] TEST-10 merged (PR #737, squash 439f9be); auto-done run 43331140262 succeeded, tracker complete. Checkpoint due=yes head=439f9be verdict=pass, which runs the combined tree with BUG-04 (4af646c) and closes the merge verdict's residual doubt that CI had run on base c8db2b1.
- [final] Boundary (wave 4 drained): follow-ups filed none (TEST-10 known improvements are OPTIONAL only; no comment unaddressed at merge). Re-ingest: item-status nodes=0 done=11 to_verify=1 unmapped=30; graph empty; registered=none; no map or registry write. The run proceeds to its report.
- [final] BUG-01 stays to_verify (tracker complete + mayker:to-verify): a human runs the two curl steps on the deployed host and removes the label; not verified until then.
