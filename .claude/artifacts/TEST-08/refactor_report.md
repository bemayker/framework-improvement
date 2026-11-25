# Refactor report: TEST-08

Result: 2 improvements applied (9 files examined)

Files examined: frontend/src/api/baseUrl.ts, frontend/src/api/notes.ts, frontend/src/api/version.ts, frontend/src/api/version.test.ts, frontend/src/components/AppFooter.tsx, frontend/src/components/AppFooter.test.tsx, frontend/src/components/LandingPage.test.tsx, e2e/uat/scripts/TEST-04_page_footer_uat_script.md, e2e/uat/scenarios/TEST-04_page_footer.feature.

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | frontend/src/components/AppFooter.test.tsx | Failure-path test asserted before the rejection reached `.catch`, so it could see the loading state (self-review RECOMMENDED 1) | Test reliability | RECOMMENDED | Flush microtasks with `act` before asserting. Applied. |
| 2 | e2e/uat/scripts/TEST-04_page_footer_uat_script.md, e2e/uat/scenarios/TEST-04_page_footer.feature | Stale ports 5173/8000 and a removed "its version" assertion (self-review RECOMMENDED 2) | Naming consistency | RECOMMENDED | 5173 to 5183, 8000 to 8010, "its version" dropped from step 10. Applied. |

Verify by running (finding 1): `.catch` temporarily changed to `setBackendVersion("unknown")`; the failure-path test failed with `expected 'Task Notes vunknown' to be 'Task Notes'`. The `.catch` was restored afterwards.

No other category 1 to 7 findings in the examined files.
