# Decisions (cross-cutting): deliver-20261110T014719Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261110T014719Z

- [run] ingest: 5 nodes (TEST-09, TEST-08, BUG-01, BUG-04, TEST-10); 7 done dropped (TEST-01..05, FEAT-1, BUG-05), 30 cancelled dropped as unmapped (none a dependency of a node).
- [run] label-ignored=BUG-01 (mayker:to-verify on todo counts only on done); BUG-01 stays a node and is built.
- [run] resume: all 5 nodes at 6.1. Ground truth: no feature branch on the remote, no item PR, no plan artifact, no item code on main (#678 reset the code of #674/#675).
- [run] BUG-01 ready on FEAT-1=complete in the tracker although FEAT-1's server_time code is absent from main; its plan must manifest server_time.py and main.py.
- [run] serialization (provisional, from map notes): TEST-09 before BUG-01 (main.py), TEST-08 before BUG-04 (LandingPage.tsx), BUG-04 before TEST-10 (LandingPage.tsx); re-judged on the plans' File Manifests.
- [run] order: TEST-09 (wave 2), then wave 3 by chain (TEST-08:2, BUG-01:1, BUG-04:0), then TEST-10 (wave 4). Round 1 plan dispatches: TEST-09, TEST-08, BUG-01 (cap 3; plans run in parallel regardless of overlap). BUG-04 queued for the next free slot.
- [run] merged this run so far: BUG-01 (#679, 5618c3f, to_verify: deployed-only criterion 3), TEST-09 (#680, 61039ee), TEST-08 (#681, f2d4e6f). Checkpoints after BUG-01 and TEST-08 passed on the integrated main.
- [run] BUG-04 admitted to planning when BUG-01 freed its slot; TEST-10 admitted once TEST-08 and TEST-09 merged (taken after BUG-04: wave 4 vs wave 3).
- [run] TEST-10 and BUG-04 run concurrently, no serialization. Rationale: whole-manifest union comparison (all phases) has an empty intersection, and neither plan touches the flagged LandingPage.tsx; CHORE-02 overlaps four TEST-10 files and is held behind TEST-10 if dispatched.
- [run] merged: BUG-04 (#682, 75ca40e), TEST-10 (#683, b6d039b). Checkpoints after BUG-04 and TEST-10 passed on the integrated main. All five nodes merged; no item blocked, no item unmerged-green.
- [run] Section W final boundary step 1: no follow-up filed. Sources read for all five merged items: known-improvements (no RECOMMENDED finding left unapplied: TEST-08 R1 and TEST-10 R1 applied, TEST-08 R2 declined with evidence from its Verify line; every remaining entry OPTIONAL) and unaddressed-comments (none).
- [re-ingest, final boundary] nodes=0. item-status.sh: items=42 nodes=0 done=11 to_verify=1 unmapped=30 link=0 labels-ignored=0, over a fresh full listing of ClickUp list 901524718831 (38 tasks, all in the registry) plus 4 local-only items. The backlog is drained; nothing to dispatch.
- [re-ingest] BUG-01 reads to_verify (complete + mayker:to-verify) and is dropped from the graph as merged-awaiting-verification; it stays for a human to verify on the deployed environment and remove the label.
- [re-ingest] No item filed since the run start: registered=none, no feature_map row or cell written, no register publish. feature-map-validate: valid (42 rows, 43 edges); feature-map-propose: 0 wave proposals, 0 checkpoint proposals.
- [run] TEST-08 standards provenance MISMATCH (information only): the reviewer report cites workflow_triggers.md as provenance without reporting reading it.
