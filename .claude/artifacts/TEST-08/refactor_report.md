# Refactor report: TEST-08

Result: 2 improvements applied (8 files examined)

Scope: the feature's changed files (AppFooter.tsx, AppFooter.test.tsx, version.ts, baseUrl.ts, notes.ts, and the two footer E2E specs).

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | frontend/src/components/AppFooter.test.tsx | Rejected and null tests asserted after `vi.waitFor(called)`, which passes before the promise settles | Review RECOMMENDED 1 | RECOMMENDED | Settle the mocked promise inside `act` (`settlePendingPromises`) before asserting. Verified: with `.catch` temporarily set to `setVersion("unknown")` the rejected-fetch test failed ("Task Notes vunknown"); change reverted |
| 2 | e2e/tests/TEST-08_footer_app_version.spec.ts, e2e/tests/TEST-04_page_footer.spec.ts | Duplicated pyproject.toml `[project].version` parser | DRY violations | RECOMMENDED | Extracted to e2e/helpers/backendVersion.ts (created file) and imported in both specs |

No findings in AppFooter.tsx, version.ts, baseUrl.ts or notes.ts.

Tests after the change: frontend suite 38 passed, 0 failed. E2E specs list and load with the new helper (12 tests); not executed (no running stack in this dispatch).
