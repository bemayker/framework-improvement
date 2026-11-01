# Refactor report: TEST-10

Result: 1 improvements applied (6 files examined)

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | frontend/src/components/AppFooter.test.tsx | Failure and null-build tests asserted after waiting only for the client call, not for the promise to settle (review RECOMMENDED) | Test determinism | RECOMMENDED | Added a `settle()` helper (`await act(async () => {})`) and used it before the assertions; applied |

Verify by running: with a temporary sentinel in the `.catch` of AppFooter.tsx (`setBuild({ version: "ERR", commit: null })`), the failure test failed ("Task Notes vERR"), so the test does exercise the rejection. The sentinel was reverted before the commit.

Files examined with no further findings: AppFooter.tsx, api/version.ts, api/version.test.ts, LandingPage.test.tsx, e2e/tests/TEST-10_footer_build_commit.spec.ts.
