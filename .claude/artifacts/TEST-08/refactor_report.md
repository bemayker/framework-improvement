# Refactor report: TEST-08

Result: 2 improvements applied (4 files examined)

Scope: the four files the review findings point at (AppFooter.tsx, AppFooter.test.tsx, and the two TEST-04 UAT artifacts).

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | frontend/src/components/AppFooter.test.tsx | Failure-path and unknown-version tests asserted before the promise settled (`waitFor(toHaveBeenCalled)` is true at mount), so a `.catch` rendering an error string could pass | Review RECOMMENDED 1 | RECOMMENDED | Flush with `await act(async () => {})` after render; drop the unused `waitFor` import. Verified: with `setBackendVersion("failed")` in the catch path the failure test fails (1 failed, 4 passed); restored |
| 2 | e2e/uat/scripts/TEST-04_page_footer_uat_script.md, e2e/uat/scenarios/TEST-04_page_footer.feature | Ports 5173 and 8000 contradict 5183 and 8010 (docker-compose.yml, vite.config.ts) | Review RECOMMENDED 2 | RECOMMENDED | Replace with 5183 and 8010 |

No source behaviour changed. No file was created by the gate.
