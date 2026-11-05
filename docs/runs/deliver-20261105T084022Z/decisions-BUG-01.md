# Decisions (BUG-01, after its final push): deliver-20261105T084022Z

The entries `.claude/artifacts/BUG-01/decisions.md` received after the last push of its branch (67d0840), the head its pull request merged. The entries before them reached the default branch in that file.


## 2026-11-05 run=deliver-20261105T084022Z: merge verdict (orchestrator, /deliver 6.9)

**Decision:** merge PR #574 (`feature/BUG-01-server-time-edge-cache`, head 67d0840) by squash; item routes to verification (`mayker:to-verify`) rather than straight to Done.

**Rationale (`autonomy.md` Section 5, all five conditions hold):**
1. Self-review clean: `VERDICT: PASS blocking=0 recommended=0 optional=1`; the one OPTIONAL (main.py docstring wording) is recorded under the PR's known improvements. Refactor gate: no findings over 7 files.
2. CI green: `ci-poll.sh` re-read at this dispatch reports `verdict=green next=none failed=0 poll=1`, 7/7 checks, notification check included. `pr-mergeable`: OPEN, not draft, MERGEABLE, CLEAN. Push gate recorded pytest 51 passed / 0 failed / 14 skipped and vitest 26 passed / 0 failed for head 67d0840.
3. Criteria: 1 (`Cache-Control: no-store` on `/api/time`) and 2 (`test_get_time_sets_cache_control_no_store`) are satisfied by the implementation and asserted on the real HTTP cycle. Criterion 3 is by its own wording a post-deploy human check on the deployed environment; the implementation covers both of its causes (header present, `now` computed per request) and the check cannot run before the merge it depends on. Repro verdict `not runnable locally` (exit 0) and the to-verify label carry it to the human step; withholding the merge would make the criterion unverifiable forever.
4. Feedback surfaces: 0 inline, 0 general, 0 reviews on the PR, `reviewDecision` empty (no change request); tracker comments re-read, none beyond this run's own PR-link notice. Nothing actionable unanswered.
5. Escalation bar not triggered: additive backend change (three new modules, two registration lines), no migration, no secret, no external side effect; fully reversible by revert.

**Left for a human:** criterion 3 on the deployed environment (the PR's Repro line gives the two curl steps); `docs/DEVELOPMENT.md` Test environments has no deployed row, so the host name must come from the verifier.
- 2026-11-05 [BUG-01] Merged PR #574 by squash as ddd64fd. auto-done: run 41998871613 succeeded; re-read status complete with tracker tag mayker:to-verify (to-verify arm fired by the pipeline; not verified until a human removes the tag).
- 2026-11-05 [BUG-01] [checkpoint] due=yes items=BUG-01 merged=TEST-09,BUG-01 head=ddd64fd verdict=pass (pytest 62 passed 14 skipped; vitest 26 passed). Standards provenance: 7 dispatches, 0 unbacked claims (self-reported).
