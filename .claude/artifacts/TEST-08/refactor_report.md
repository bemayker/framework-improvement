# Refactor report: TEST-08

Gate result: 3 improvements applied (11 files examined)

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md, .claude/artifacts/TEST-08/uat_script.md, e2e/uat/scenarios/TEST-08_footer_app_version.feature | Step 2.2 and line 21 expect exactly one GET /api/version, but React StrictMode in dev sends two | Review RECOMMENDED 1 | RECOMMENDED | Applied: "at least one GET request ... each with status 200 and the backend's version" |
| 2 | e2e/uat/scripts/TEST-04_page_footer_uat_script.md, e2e/uat/scenarios/TEST-04_page_footer.feature | Ports 8000 and 5173 next to the edited 8010 line; docker-compose.yml publishes 8010 and 5183 | Review RECOMMENDED 2 | RECOMMENDED | Applied: ports corrected to 5183 and 8010 in both files |
| 3 | e2e/tests/TEST-08_footer_app_version.spec.ts, e2e/tests/TEST-04_page_footer.spec.ts | E2E tier never observed | Review RECOMMENDED 3 | RECOMMENDED | Declined: ran the Verify line, all 7 tests failed at browserType.launch because the Chromium headless shell is missing from the Playwright cache. Browsers are not installed by the gate. |

Source files (version.ts, baseUrl.ts, AppFooter.tsx, main.tsx): no checklist findings.
Frontend tests after changes: 35 passed (35), 6 test files.
