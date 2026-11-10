# Decisions (cross-cutting): deliver-20261110T131433Z

This run's section of the repository-root `DECISIONS.md`, which is cumulative across runs. Per-item decisions live in `.claude/artifacts/{ID}/decisions.md`.

## Run deliver-20261110T131433Z

- [ingest] nodes=BUG-01,BUG-04,TEST-08,TEST-09,TEST-10 from item-status.sh (items=42 nodes=5 done=7 to_verify=0 unmapped=30 link=0 labels-ignored=1); statuses re-read from the tracker and local frontmatter, not from the commit log.
- [ingest] label-ignored=BUG-01 (mayker:to-verify on todo: the label counts only on done, so the item reads as todo). BUG-01 is a todo node and is built.
- [ingest] unmapped= 30 cancelled tracker items (cancelled maps to null in reverse_status_mapping). Not graph nodes; none is a dependency of a node.
- [resume] All five nodes take the full lifecycle from 6.1. PRs 698 to 702 for the same IDs are merged, but ac6e44c (PR 705) removed their code and artifacts from main and the tracker reads to do; no feature/* head on the remote, no open item PR, no plan artifact.
- [graph] No cycle, no edge dropped. Scaffold TEST-01 is done, gate passes. Ready: TEST-09, TEST-08, BUG-01, BUG-04. TEST-10 blocked by TEST-08 and TEST-09.
- [map] feature_map.md valid and unchanged; 0 wave and 0 checkpoint proposals; registered=none.
- [serialize] BUG-04 held behind TEST-08 (LandingPage.tsx), TEST-10 behind BUG-04 if concurrent. BUG-01 build held behind TEST-09 only when both File Manifests list backend/app/main.py.
- [order] Round 1 dispatch: TEST-09 (wave 2), TEST-08 (wave 3, chain 2), BUG-01 (wave 3, chain 1) to plan phase. BUG-04 waits for a free slot (max parallel 3). Wave is an ordering key, not a gate.
- [merge] BUG-01 #706 -> 6b27a6e (squash); auto-done run 42825648641 succeeded; tracker complete + tag mayker:to-verify (deployed-only, awaiting human verification). Checkpoint pass head=9e9b182.
- [merge] TEST-09 #707 -> 9e9b182 (squash); auto-done run 42825696801 succeeded; tracker complete. Checkpoint pass head=9e9b182 (script read TEST-09 as flagged though ingest reported ➖).
- [merge] TEST-08 #708 -> 0b16aad (squash); auto-done run 42826179604 succeeded; tracker complete. Checkpoint pass head=0b16aad.
- [framework] pr-open.sh exited 1 after creating PR #708; the PR was verified on GitHub and the run continued. Framework defect, not filed in the project tracker.
- [wave-2] Follow-ups: none filed (BUG-01 no known improvements; TEST-09 OPTIONAL only; no unaddressed comments).
- [re-ingest wave-2] Nodes = TEST-08, TEST-10, BUG-04 (items=42 nodes=3 done=8 to_verify=1 unmapped=30 link=0 labels-ignored=0). TEST-09 dropped as done; BUG-01 dropped as to_verify.
- [re-ingest wave-2] No backlog change since run start: 38 tracker items, all registered and mapped; registered=none; feature_map.md valid and unchanged.
- [order] After TEST-08's merge: BUG-04 (wave 3) and TEST-10 (wave 4) both ready; both plan concurrently (plans only write artifacts); their builds are serialized on the LandingPage risk unless their whole-feature manifests are disjoint.
- [publish wave-2] arm=opened pr=https://github.com/bemayker/framework-improvement/pull/709 merge=merged (class framework, paths docs/runs/deliver-20261110T131433Z). Required status checks on main at merge time (ruleset read): ["pr-tests"] — the check was required.
- [order] Round 4: BUG-04 and TEST-10 dispatched to planning concurrently (plan base 0b16aad); neither has an actionable tracker comment.
- [hold] TEST-10 Phase D held behind BUG-04: smoke run ports
- [merge] BUG-04 #710 -> efb5ed9 (squash); auto-done run 42828524703 succeeded; tracker complete. Repro: before fail -> after pass. Checkpoint pass head=b0e9a62. Teardown: docker rm -f BUG-04-db.
- [merge] TEST-10 #711 -> b0e9a62 (squash); auto-done run 42828634673 succeeded; tracker complete. Checkpoint pass head=b0e9a62.
- [final boundary] Follow-ups: none filed (BUG-04 OPTIONAL only; TEST-08 OPTIONAL only; TEST-10 none; no unaddressed comments).
- [final boundary] re-ingest: nodes=0 (items=42 done=11 to_verify=1 unmapped=30 link=0 labels-ignored=0). No item filed since the wave-2 re-ingest; registered=none; feature map unchanged and valid. BUG-01 is to_verify, left for a human.
- [final boundary] Remote heads feature/BUG-01, BUG-04, TEST-08, TEST-09, TEST-10 remain on origin after their squash merges (no open PR, not resume points).
