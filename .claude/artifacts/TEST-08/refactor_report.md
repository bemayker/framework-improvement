# Refactor report: TEST-08

Result: 3 improvements applied (14 files examined)

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | frontend/src/components/AppFooter.test.tsx | Unreachable-backend test asserted before the null result settled | Review RECOMMENDED 1 | RECOMMENDED | Added `await act(async () => {})` before the exact-text assertion |
| 2 | e2e/uat/scenarios/TEST-08_footer_app_version.feature, e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md, .claude/artifacts/TEST-08/uat_script.md | "One GET" count is wrong under StrictMode in dev | Review RECOMMENDED 2 | RECOMMENDED | Reworded to a GET returning 200 with the version body, no count |
| 3 | e2e/uat/scenarios/TEST-04_page_footer.feature, e2e/uat/scripts/TEST-04_page_footer_uat_script.md | Stale ports 5173/8000 | Review RECOMMENDED 3 | RECOMMENDED | 5173 to 5183, 8000 to 8010, full backend URL |

Files created: none.
Tests: frontend 35 passed.
