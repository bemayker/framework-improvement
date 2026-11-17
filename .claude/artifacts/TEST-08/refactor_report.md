# Refactor report: TEST-08

Result: 2 improvements applied (14 files examined)

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | e2e/uat/scripts/TEST-04_page_footer_uat_script.md | Prerequisite curl targets port 8000; backend listens on 8010 (review R1) | Naming consistency | RECOMMENDED | Changed to 8010. Applied |
| 2 | frontend/src/api/version.test.ts | `vi.unstubAllEnvs()` at end of test body is skipped on assertion failure, leaking the env stub (review R2) | Excessive complexity | RECOMMENDED | Moved into `afterEach` beside `vi.unstubAllGlobals()`. Applied |

No files created. No checklist findings beyond the review's two RECOMMENDED items.
