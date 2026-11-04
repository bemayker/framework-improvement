# Refactor report: TEST-10

Gate result: 2 improvements applied (9 files examined)

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | frontend/src/components/AppFooter.test.tsx | Failure and unresolved-version tests asserted without an explicit settle of the promise handlers (review RECOMMENDED 1) | Test reliability | RECOMMENDED | Added settlePromiseHandlers (act plus microtask flush), assert after it; dropped waitFor |
| 2 | e2e/uat/scenarios/TEST-10_footer_build_commit.feature | Pending scenario expected commit 0123456 without setting BUILD_COMMIT (review RECOMMENDED 2) | Scenario setup | RECOMMENDED | Added the BUILD_COMMIT Given step |

Verification of RECOMMENDED 1: with the .catch in AppFooter.tsx temporarily rendering "verror", the ORIGINAL test already failed (Received "Task Notes verror"), so the prediction was not confirmed; the revised test also fails on the same mutation. AppFooter.tsx was restored and is unchanged. The settle helper makes the ordering explicit rather than implicit.

Optional (known improvements): LandingPage.test.tsx changed outside the plan manifest, required by the client's new return shape.
