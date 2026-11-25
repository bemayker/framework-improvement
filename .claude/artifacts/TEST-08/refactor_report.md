# Refactor report: TEST-08

Result: 3 improvements applied (12 files examined); the unit-test half of finding 1 declined with evidence

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | frontend/src/components/AppFooter.test.tsx; e2e/tests/TEST-08_footer_app_version.spec.ts | Version-absent tests may assert before the promise settles. Unit: DECLINED. Verified by running: with AppFooter.tsx `.catch(() => setVersion("unknown"))` the test "renders the app name without a version when the request fails" FAILED ("Task Notes vunknown" received, 1 failed / 6 passed); after restoring the line all pass. The async `waitFor` yields microtasks, so the assertion runs after settlement. No diff. E2E: APPLIED, the spec now waits for `requestfailed` on /api/version before the absence assertions. | Test reliability | RECOMMENDED | E2E: wait for the aborted request |
| 2 | e2e/tests/TEST-08_footer_app_version.spec.ts | PLAYWRIGHT_API_BASE_URL duplicated the frontend's backend URL | Configuration (two sources, one value) | RECOMMENDED | Expected version read from the footer's own response via `page.waitForResponse`, registered before `page.goto`; separate request and env var removed |
| 3 | e2e/uat/scripts/TEST-04_page_footer_uat_script.md; e2e/uat/scenarios/TEST-04_page_footer.feature | Stale ports 5173/8000 and a removed version assertion in step 10 | Naming consistency | RECOMMENDED | 5173 to 5183, 8000 to 8010, step 10 reworded |

No new source or test file was added.
