# Refactor report: TEST-08

Gate result: 1 improvements applied (9 files examined)

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | frontend/src/components/AppFooter.test.tsx | Failure-path tests (rejected request, null version) asserted after only waiting for the mount-time call, so they could pass before the then/catch handler ran (review RECOMMENDED) | Dead code / test validity | RECOMMENDED | Flush the settled request with `await act(async () => {})` via a `settlePendingRequest` helper before asserting. No new file. |

Verify result: with AppFooter.tsx `.catch` temporarily set to `setBackendVersion("unknown")`, the rejection test failed (`expected 'Task Notes vunknown' to be 'Task Notes'`), so it covers the failure path. Mutation reverted.

Files examined with no further findings: AppFooter.tsx, baseUrl.ts, version.ts, version.test.ts, notes.ts, LandingPage.test.tsx, TEST-08_footer_app_version.spec.ts, TEST-04_page_footer.spec.ts.

OPTIONAL (not selected, carried to PR known improvements): TEST-04 UAT artifacts still name ports 5173/8000 instead of 5183/8010.
