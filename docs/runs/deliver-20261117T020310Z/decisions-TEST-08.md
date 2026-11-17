# Decisions (TEST-08, after its final push): deliver-20261117T020310Z

The entries `.claude/artifacts/TEST-08/decisions.md` received after the last push of its branch (35de8339), the head its pull request merged. The entries before them reached the default branch in that file.


## Merge verdict: merge (run=deliver-20261117T020310Z, orchestrator, /deliver 6.9)

- 2026-11-17 [TEST-08] Merge PR #830 by squash. Rationale: all five conditions of `autonomy.md` Section 5 hold, on the inputs the session carried into this dispatch (not re-run here).
- **1. Self-review clean:** first pass `VERDICT: FAIL blocking=1 recommended=2 optional=0`; B1 (README edit outside the plan) fixed in a719080a and closed by re-pass 1, `VERDICT: PASS blocking=0 recommended=0 optional=0`. R1 and R2 applied by the refactor gate (20acd910), 35 frontend tests passed after.
- **2. Checks green:** `ci-poll.sh` line re-read after the ready conversion, `verdict=green next=none failed=0 poll=1`, 7 of 7 checks, none pending. Push gate at head 35de833: full; pytest 42 passed, 0 failed, 14 skipped and vitest 35 passed, 0 failed. Phase D E2E smoke 6 passed, 0 failed.
- **3. Criteria met:** all 6 plan criteria (4 from the description, 2 amended or added by the tracker correction) are implemented per the PR body and covered by the plan's criterion-coverage ids; the manifest carries no backend entry by design, since `GET /api/version` already ships from TEST-05.
- **4. Comments answered on both surfaces:** PR has 0 inline comments and no change request (`m=MERGEABLE s=CLEAN c=0 r=0`). Tracker re-read shows no new comment since 6.1 beyond this run's own PR-link comment; the one actionable comment (the human correction) is answered by the implementation and that PR-link comment.
- **5. Escalation bar not triggered:** a frontend-only change, undone by a revert PR; nothing irreversible and nothing ambiguous left undecided.
- **Moved base accepted:** BUG-01 (#828) and TEST-09 (#829) merged after the branch was cut (main now 2410428f). Their file sets are disjoint from TEST-08's (union-of-phases comparison at 6.2) and the provider reads the PR MERGEABLE and CLEAN against the moved base. TEST-09's added `commit` field does not affect the client, which reads only `version`. Residual: the green checks ran on head 35de833 against the base as it stood at that run, so the post-merge arm on main is the first run of TEST-08 together with TEST-09's response shape.
- **After the merge:** BUG-04's serialization hold on TEST-08 lifts and is re-checked against BUG-04's manifest when it is planned.
- [6.5] Phase E: first pass VERDICT: FAIL blocking=1 recommended=2 optional=0. B1 (README .env.example row edited outside the plan; wrong once TEST-09 lands): fixed (re-pass 1), commit a719080a; re-pass VERDICT: PASS blocking=0 recommended=0 optional=0. R1 (TEST-04 UAT port 8000 -> 8010) and R2 (vi.unstubAllEnvs into afterEach): applied by the refactor gate (20acd910, 14 files examined, 35 frontend tests passed). Gate re-check skipped (no source or test file added).
- [6.6] PR #830 opened as draft; gate: test-gate: verdict recorded for this push (head 35de833: full after 2s; pytest 42 passed, 0 failed, 14 skipped + vitest 35 passed, 0 failed); upstream-ok; PR label: #830 mayker:in-progress; item-to-PR comment posted.
- [6.7] CI: 7/7 checks done, verdict=green. Handover rebuild: status=rebuilt sha=35de8339 health=pass project=framework-improvement-test-08-handover. PR label: #830 mayker:in-review. Status -> in_review (to test).
- [6.8] Comments: PR 0 inline, 0 conversation, 0 reviews; tracker: no new comment since 6.1.
- [6.9] Merged #830 by squash (state MERGED).
- [6.10] auto-done: run 44002906098 succeeded. Item reads complete; no backstop.
- [6.10] Standards provenance: 9 dispatches; both always-on standards self-reported as read by 4 of 9 (self-reported); 0 unbacked provenance claims; 0 MISMATCH lines.
- [6.10] [pull] result=up-to-date head=82b14518. [checkpoint] due=yes items=TEST-08 head=82b14518 verdict=pass (pytest 61 passed, 14 skipped; vitest 35 passed).
- [6.10] Environment: Phase D started uvicorn and Vite for its smoke run and stopped them itself; no `- env:` line of this run; nothing to tear down.
