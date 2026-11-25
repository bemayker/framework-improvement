# Decisions (BUG-04, after its final push): deliver-20261125T083205Z

The entries `.claude/artifacts/BUG-04/decisions.md` received after the last push of its branch (36e70cbb), the head its pull request merged. The entries before them reached the default branch in that file.

- PR: https://github.com/bemayker/framework-improvement/pull/1018 (draft)
- Gate verdict: test-gate: verdict recorded for this push (head 36e70cb: full after 2s)
- Upstream: verdict=upstream-ok
- Repro: before fail -> after pass (npm --prefix frontend test -- src/components/NoteForm.test.tsx)
- 2026-11-25 [BUG-04] Merge verdict: merge PR #1018 by squash (run=deliver-20261125T083205Z, head 36e70cb, base e499c421 unmoved). Rationale: all five conditions of `autonomy.md` Section 5 hold. (1) Review `PASS blocking=0 recommended=2 optional=0`, both RECOMMENDED applied in 07b1c940. (2) `ci-poll.sh` re-read after the conversion out of draft: `verdict=green next=none failed=0 poll=1`, 7/7 checks. (3) The three derived criteria are met: repro `before fail -> after pass (npm --prefix frontend test -- src/components/NoteForm.test.tsx)`, push gate pytest 75 passed and vitest 38 passed with 0 failed and 0 skipped, E2E 3 passed against real Postgres. (4) 0 inline, 0 general, 0 reviews and an empty reviewDecision on the PR, and nothing on tracker item 123k99cx47m newer than this run's PR-link comment, so no actionable comment and no change request is open. (5) Section 4 escalation bar not triggered: a frontend-only change with no migration, secret or external side effect, undone by a revert PR.
- 2026-11-25 [BUG-04] Residual doubt carried to the run report, not a hold. Rationale: the criteria are derived from the title because the tracker description is empty, so the client-side-only reading is ambiguous but reversible, which `autonomy.md` Section 4 says to decide and log; the PR body and the tracker comment invite a correction, and server-side deduplication would be a follow-up item. The E2E specs ran against the fixed code only, so the fail-before evidence is the unit reproduction alone.
- Merge: #1018 squash b20d1084
- auto-done: run 45582254539 succeeded; tracker reads complete (no to-verify: local-automated)
- Standards provenance: 8 dispatches, 0 unbacked claims, 4 of 8 not assessed; read count self-reported (5 of 8 report both always-on standards); docs-check dispatch returned no STANDARDS READ line
- [checkpoint] due=yes items=BUG-04 head=b20d1084 verdict=pass (backend 61 passed 14 skipped: checkpoint runs with no database; frontend 38 passed)
- teardown: docker rm -f BUG-04-db (done)
