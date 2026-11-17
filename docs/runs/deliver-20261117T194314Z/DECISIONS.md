# Decisions (cross-cutting): deliver-20261117T194314Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261117T194314Z

- [run] Ingestion: 42 items resolved (38 tracker, 4 local); graph nodes TEST-08, TEST-09, TEST-10, BUG-01, BUG-04 (items=42 nodes=5 done=7 to_verify=0 unmapped=30 link=0 labels-ignored=1).
- [run] label-ignored=BUG-01 (mayker:to-verify on todo: the label counts only on done); BUG-01 is a node and gets built.
- [run] unmapped=30 cancelled items dropped from the graph; none is a dependency of a node.
- [run] Resume: all five nodes take the full lifecycle from 6.1; earlier merges (#847, #848, #849, #851, #852) were undone by reset commit 7508f8f4 (#855); no branch, PR, plan artifact or worktree survives.
- [run] BUG-01's dependency FEAT-1 reads done but its router is absent from main after the reset; BUG-01's plan must recreate it (pairs with TEST-09 on backend/app/main.py).
- [run] Map reconcile: nothing written, registered=none, 0 wave and 0 checkpoint proposals.
- [run] Serialization planned from existing notes: BUG-01 build after TEST-09 (main.py), BUG-04 after TEST-08 (LandingPage.tsx), TEST-10 vs BUG-04 (LandingPage.tsx); to be confirmed against plan File Manifests.
- [run] Dispatch round 1: plans for TEST-09 (wave 2), TEST-08 (wave 3), BUG-01 (wave 3) in parallel (Max parallel items 3); BUG-04 waits for a free slot.
- [run] Plans self-approved (first pass, no re-plan): TEST-09, BUG-01, TEST-08. Builds ran concurrently: the three whole-feature File Manifests were disjoint (TEST-09 did not touch backend/app/main.py, so the planned BUG-01/TEST-09 serialization was not needed).
- [run] TEST-08 Phase A commit subject corrected by an unpushed amend (e71d590b -> 46a7f144) to the build-feature map subject "feat(TEST-08): implement frontend components"; the dispatch prompt had carried the wrong subject.
- [run] Merged: TEST-09 #857 (8dd80c7f), BUG-01 #856 (e93b2899), TEST-08 #858 (cfa1f61b), each on an orchestrator merge verdict with all five autonomy.md Section 5 conditions met; checks 7/7 green on each.
- [run] BUG-01 is deployed-only: merged with mayker:to-verify; auto-Done set it complete + tracker tag mayker:to-verify (awaits a human check on the deployed environment).
- [run] Checkpoints: BUG-01 and TEST-08 verdict=pass at head cfa1f61b (pytest 62 passed 14 skipped; vitest 32 passed); TEST-09 not due.
- [run] Wave-2 boundary: follow-ups filed none (every merged item's known improvements are OPTIONAL; no unaddressed comments).
- [run] Re-ingest at wave-2 boundary: nodes=TEST-10,BUG-04 (items=42 nodes=2 done=9 to_verify=1 unmapped=30); registered=none; map not written.
- [run] BUG-04 (wave 3) and TEST-10 (wave 4) both ready; planners dispatched concurrently; build serialization decided at the plan verdicts on the union of the two File Manifests (LandingPage.tsx flagged). BUG-04's tracker description is empty: the planner derives criteria from the title and records the assumption.
- [run] Wave-2 record published: #859 merged (arm=opened merge=merged).
- [run] Plans self-approved (first pass, no re-plan): BUG-04 (criteria derived from the title; tracker description empty), TEST-10 (criterion-2 interpretation recorded). No build serialization: the two whole-feature File Manifests are disjoint; the LandingPage overlap flagged in feature_map.md and TEST-10 shared_risks.md is in neither manifest.
- [run] BUG-04 repro local-automated: before fail (exit 1, 174a1e09) -> after pass (exit 0, 18cefae2).
- [run] TEST-10 refactor-gate handover manifest: the --findings-on-stdin call was refused by bash-shape-guard brace-quote (the finding quotes a JS object literal); manifest generated without findings and the read set carried in the dispatch prompt. Framework defect, reported in the run report, not filed in the project tracker.
- [run] TEST-10 documentation check edited docs/DEVELOPMENT.md, which the plan File Manifest did not list; reviewer OPTIONAL judged it in scope and correct; listed under Not in the plan in PR #860.
- [run] Merged: BUG-04 #861 (1d9eb4b2), TEST-10 #860 (e29f69f3), each on an orchestrator merge verdict with all five autonomy.md Section 5 conditions met; checks 7/7 green.
- [run] Checkpoints: BUG-04 and TEST-10 verdict=pass at head e29f69f3 (pytest 62 passed 14 skipped; vitest 40 passed). BUG-04-db torn down.
- [run] Final boundary: follow-ups filed none (known improvements all OPTIONAL; no unaddressed comments). Re-ingest nodes=none (items=42 done=11 to_verify=1 unmapped=30); registered=none; map unchanged. BUG-01 stays to_verify for a human check on the deployed environment.
- [run] Merged feature branches (TEST-08, TEST-09, BUG-01, BUG-04, TEST-10) remain on the remote; branch cleanup left to a human.
