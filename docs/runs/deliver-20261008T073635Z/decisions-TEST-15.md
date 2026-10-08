# Decisions (TEST-15, after its final push): deliver-20261008T073635Z

The entries `.claude/artifacts/TEST-15/decisions.md` received after the last push of its branch (4c351b7), the head its pull request merged. The entries before them reached the default branch in that file.


## 6.6 to 6.8 (deliver-20261008T073635Z)

- Push 4c351b7: test-gate: verdict recorded for this push (head 4c351b7: full after 3s; pytest 159 passed, 0 failed + vitest 50 passed, 0 failed). Upstream origin/feature/TEST-15-count-notes.
- PR #124 opened as draft. PR label: #124 mayker:in-progress. Item-to-PR link posted on ClickUp (comment 1200230000078717).
- CI: 7/7 checks done, 3m11s, green, failed=0 (poll 3).
- Handover rebuild: status=rebuilt sha=4c351b7 health=pass project=framework-improvement-test-15-handover urls backend 22381, db 22382, frontend 22383, duration=21s.
- PR converted ready; PR label: #124 mayker:in-review (removed mayker:in-progress); ClickUp status to test (in_review).
- 6.8 round 1: 0 inline comments, 0 conversation comments, 0 reviews; tracker comments: 1, the run's own PR link (not actionable). mergeable=MERGEABLE mergeStateStatus=CLEAN.

## 6.9 Merge verdict (deliver-20261008T073635Z)

- 2026-10-08 [TEST-15] Verdict: merge (squash), PR #124 head 4c351b7 onto main e4772f7. Rationale: autonomy.md Section 5 conditions 1 to 5 all hold; self-review blocking=0 (6.5), 7/7 checks pass with none pending, mergeable=MERGEABLE mergeStateStatus=CLEAN, not draft.
- AC1 to AC3 verified against the diff and backend/tests/integration/test_notes_integration.py lines 242, 252 and 264; route order (count before note_id) confirmed in backend/app/routers/notes.py; full suite 159/0 at push gate.
- Condition 4: 0 PR comments, 0 reviews, reviewDecision empty; tracker holds only the run's own PR-link comment (not actionable).
- Escalation bar not triggered: additive read-only endpoint, reversible by revert, intent unambiguous.
- Carried gaps, not merge conditions: plan lacks a Manual verification plan section (refused append); feature_map.md row for TEST-15 unwritten (refused), so test_checkpoint is unassigned.

## 6.10 Post-merge (deliver-20261008T073635Z)

- Merged: PR #124 squash 68b69ff (main was still e4772f7 at merge time).
- auto-done: run 37746618166 failed: a backstop flip after it is a defect naming run 37746618166
- Cause from the run log: source='hybrid' in_registry=no -> tracker=no file=yes; docs/issues/TEST-15.md not found. The run registered TEST-15 in project_state.json in the primary checkout only; that change reaches main at the wave publish, after the item merges, so the pipeline could not see the item.
- auto-done defect: run 37746618166 failed, backstop tracker (ClickUp status complete). PR label: #124 mayker:done (removed mayker:in-review).
- Standards provenance: 8 dispatches; both always-on standards self-reported as read by 3 of 8 (self-reported, no pass bar); 0 unbacked claims; 5 of 8 not assessed.
- Checkpoint: due=no reason=none-merged verdict=not-due (TEST-15 has no map row, so no test_checkpoint flag could be read; the predicted sink checkpoint never landed). No substitute suite run: merged tree equals the tree the push gate and CI tested (base unchanged).
- Teardown: docker rm -f TEST-15-db done. Handover stack framework-improvement-test-15-handover left running for the tester.
