# Refactor report: TEST-10

Run: deliver-20261124T203156Z

Outcome: no findings (6 files examined)

Files examined: frontend/src/components/AppFooter.tsx, frontend/src/components/AppFooter.test.tsx, frontend/src/api/version.ts, frontend/src/api/version.test.ts, frontend/src/components/LandingPage.test.tsx, e2e/tests/TEST-10_footer_build_commit.spec.ts

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | frontend/src/api/version.ts | Two constants share the value "unknown" (lines 8 and 11) | DRY violations | OPTIONAL | None: they name two distinct backend contracts (TEST-08 version, TEST-09 commit) that may diverge |

## Phase E RECOMMENDED finding: declined, verified unsound

Finding: the failure-path tests in AppFooter.test.tsx (lines 65-88) may assert before the `.catch` handler has run.

Verify run: AppFooter.tsx line 32 temporarily changed to `.catch(() => setBackend({ version: "x", commit: null }))`, then `npm --prefix frontend test -- src/components/AppFooter.test.tsx`.

Result: 1 failed, 7 passed. "renders only the app name when the version request fails" failed with `expected 'Task Notes vx' to be 'Task Notes'`, so the test does observe the catch path. The prediction does not hold: the `await waitFor(...)` already yields to the event loop, which lets the rejection and its catch handler run before the assertion. AppFooter.tsx was restored (clean `git status`). No test changed.

The sentinel test (line 77) exercises the resolve path, not the catch handler, so the same mutation does not apply to it; its `await Promise.resolve()` is not load-bearing for the catch path.

## Tests

`npm --prefix frontend test`: 6 files, 45 passed, 0 failed.
