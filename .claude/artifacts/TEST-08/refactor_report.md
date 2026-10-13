# Refactor report: TEST-08

Result: 3 improvements applied (13 files examined)

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | frontend/src/components/AppFooter.test.tsx | "unknown" sentinel test asserted after one microtask, outside act; passed trivially (review RECOMMENDED 1) | Test strength | RECOMMENDED | Flush with `await act(async () => {})` before asserting. Verified: fails ("Task Notes vunknown") with the AppFooter.tsx guard removed, passes with it restored |
| 2 | e2e/uat/scripts/TEST-04_page_footer_uat_script.md | Ports 5173/8000 stale; real 5183/8010 (review RECOMMENDED 2) | Naming consistency | RECOMMENDED | Replaced at lines 8, 17, 23 |
| 3 | e2e/uat/scenarios/TEST-04_page_footer.feature | Port 5173 stale; real 5183 (review RECOMMENDED 2) | Naming consistency | RECOMMENDED | Replaced at lines 8, 12 |

Declined: OPTIONAL criterion-4 scenario in TEST-08_footer_app_version.feature. The criterion is verified by the unit suite, and a scenario asserting test counts would add a new artifact without being asked; carried to known improvements.

No files created. Source files in scope (version.ts, baseUrl.ts, notes.ts, specs, other tests) checked against Section 3 categories 1-7: no findings.
Full frontend suite after changes: 6 files, 41 tests passed.
