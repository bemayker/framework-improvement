# Refactor report: TEST-08

Gate outcome: 2 improvements applied (14 files examined)

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | e2e/uat/scripts/TEST-04_page_footer_uat_script.md, e2e/uat/scenarios/TEST-04_page_footer.feature | UAT artifacts name ports 5173 and 8000; stack runs on 5183 and 8010 | Naming consistency | RECOMMENDED | Corrected to 5183 and 8010 (applied, from Phase E finding 1) |
| 2 | frontend/src/components/AppFooter.test.tsx | Rejected and unknown tests assert after a single microtask outside act | Dead code / weak test | RECOMMENDED | Replaced `await Promise.resolve()` with `await act(async () => {})` (applied, from Phase E finding 2) |

Verify by running: with the `UNKNOWN_BACKEND_VERSION` check removed from AppFooter.tsx, the `unknown` test failed (`expected 'Task Notes vunknown' to be 'Task Notes'`). The check was restored and is not in the commit. Full frontend suite afterwards: 35 passed, 0 failed.

No files created. No checklist-originated findings.
