# Decisions (cross-cutting): deliver-20261118T233930Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261118T233930Z

- [3.orchestrator] Graph built: 5 nodes (TEST-08, TEST-09, TEST-10, BUG-01, BUG-04) from 42 items; 7 done and 30 cancelled dropped. Verdict from item-status.sh: items=42 nodes=5 done=7 to_verify=0 unmapped=30 link=0 labels-ignored=1.
- [3.orchestrator] label-ignored=BUG-01 (mayker:to-verify on todo: the label counts only on done, so the item reads as todo). BUG-01 stays a node and is built.
- [3.orchestrator] unmapped: 30 items read "cancelled", which maps to null in reverse_status_mapping; none is a node.
- [3.orchestrator] registered=none: all 38 tracker items already hold a registry entry and a map row; no mayker:link item. No map or registry write, so no register publish before the first dispatch.
- [3.orchestrator] Proposal re-run: 42 rows, 0 wave proposals, 0 checkpoint proposals. Shared-risk analysis: 0 empty cells, nothing inferred. Map valid (42 rows, 43 edges).
- [3.orchestrator] No cycle; the only live edges are TEST-08 to TEST-10 and TEST-09 to TEST-10.
- [4.orchestrator] Resume: all 5 nodes start at Section 6.1 (no feature/* remote branch among 120 heads, no item PR, no plan artifact, no worktree).
- [5.orchestrator] Round 1 revised: plans TEST-09, TEST-08 and BUG-01 in parallel (3 of 3 slots; plans only write .claude/artifacts/{ID}/, so the conflict rule does not apply to them). BUG-01's build is held behind TEST-09 (backend/app/main.py, shared_risk_notes) until both File Manifests are compared on the union of all phases; released early only if they are disjoint. BUG-04 waits for a free slot (cap 3, later in order: wave 3, chain 0), and its build is held behind TEST-08 (frontend/src/components/LandingPage.tsx).
- [5.orchestrator] TEST-10 not ready (waits on TEST-08 and TEST-09) and is serialized after BUG-04 on LandingPage.tsx.
- [run] Section 1: git path gh (GH_TOKEN, exit 0); ClickUp probe returned 38 tasks; settings-permissions --check matched the baseline; rule drift none (all 7 standards stamped v0.3.502).
- [run] 6.1 tracker comments: TEST-09 52 read, 1 actionable (BUILD_COMMIT 12-char clarification); TEST-08 56 read, 1 actionable (backend-version correction); BUG-01 51 read, 0 actionable. Planning status maps to "to do", so no status write was needed.
- 2026-11-19 [run] Plans self-approved: TEST-09, BUG-01, TEST-08 (orchestrator logged each in its item decisions.md). Status writes on hold then in progress on all three; no readiness labels to remove.
- 2026-11-19 [run] Retired the TEST-09 and BUG-01 shared-risk premise on backend/app/main.py. Rationale: TEST-09's approved manifest (13 entries) omits main.py because TEST-05 already registers the version router there, verified at plan base a8ddc5f9; only BUG-01 lists main.py and test_main_unit.py.
- 2026-11-19 [run] Released BUG-01's build serialization behind TEST-09. Rationale: union-of-all-phases File Manifest comparison shows overlap=0 (BUG-01 10 paths, TEST-09 13 paths).
- 2026-11-19 [run] BUG-04 build stays serialized after TEST-08; reason corrected from LandingPage.tsx (TEST-08 does not touch it) to LandingPage.test.tsx and api/notes.ts, both in TEST-08's manifest. Re-evaluate when BUG-04's plan lands.
- 2026-11-19 [run] BUG-01 Repro: deployed-only (edge cache exists only on the deployed host; no Test environments row names it).
- 2026-11-19 [run] Round 2: TEST-09 Phase B, BUG-01 Phase B, TEST-08 Phase A dispatched in parallel; merged-since clean on all three (base=a8ddc5f9 forced, commits=0). BUG-04 waits for a free item slot (cap 3).
- 2026-11-19 [run] TEST-09 merged #903 (squash 7914e794), BUG-01 merged #904 (squash 5dce121e, deployed-only, mayker:to-verify), TEST-08 merged #905 (squash 9e056d57). Orchestrator merge verdicts logged in each item's decisions.md.
- 2026-11-19 [run] Auto-Done: runs 44425213176 (#905), 44425231312 (#903), 44425244622 (#904) all succeeded; tracker re-read TEST-08 complete, TEST-09 complete, BUG-01 complete + tag mayker:to-verify (to-verify arm; status_mapping has no to_verify). No backstop flip.
- 2026-11-19 [run] [checkpoint] due=yes items=TEST-08,BUG-01 head=5dce121e tip=origin/main@5dce121e verdict=pass (pytest 63 passed 14 skipped; vitest 34 passed).
- 2026-11-19 [run] Standards provenance: TEST-09, BUG-01, TEST-08 each 0 MISMATCH and 0 unbacked claims (read counts self-reported).
- 2026-11-19 [run] Worktrees TEST-08, TEST-09, BUG-01 captured and removed (entries 7, 6, 8). No backing-service env lines this run, so no teardown.
- 2026-11-19 [run] Wave 2 boundary (Section W): follow-ups filed none (known-improvements: no unapplied RECOMMENDED on any merged item, TEST-09's are OPTIONAL only; unaddressed-comments: none).
- 2026-11-19 [run] 14 database-backed backend tests were skipped at every push gate and the checkpoint: no database was provisioned this run, so the green suites say nothing about the notes DB paths.
- [3.orchestrator] Wave-2 boundary re-ingestion: 2 nodes (BUG-04, TEST-10) from 42 items. Verdict from item-status.sh: items=42 nodes=2 done=9 to_verify=1 unmapped=30 link=0 labels-ignored=0.
- [3.orchestrator] registered=none; proposal re-run 0 wave and 0 checkpoint proposals; map valid (42 rows, 43 edges, scaffold TEST-01).
- [4.orchestrator] Resume: BUG-04 and TEST-10 both start at Section 6.1 (no remote head, PR, plan artifact or worktree).
- [5.orchestrator] Next round: plans BUG-04 and TEST-10 in parallel (2 of 3 slots). Builds held until both File Manifests are compared on the union of all phases; disjoint releases both, overlap serializes TEST-10 after BUG-04's merge; the hold releases if BUG-04 blocks.
- [5.orchestrator] Shared-risk premise corrected: LandingPage.tsx is not needed by either item at 5dce121e; the plausible shared file is LandingPage.test.tsx, and api/notes.ts only if BUG-04's fix lands in the client.
- [3.orchestrator] BUG-04's tracker description is empty (no acceptance criteria). Not escalated: reversible; the planner records assumed criteria as a scope change and the plan verdict checks them.
