# Refactor report: TEST-08

Result: 1 improvements applied (13 files examined)

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | frontend/src/components/LandingPage.test.tsx | Backend version "9.8.7" written twice (constant and vi.mock factory) | DRY violations | RECOMMENDED | Applied: single constant via vi.hoisted |
| 2 | e2e/tests/TEST-08_footer_app_version.spec.ts, e2e/tests/TEST-04_page_footer.spec.ts | pyproject.toml version parsing duplicated | DRY violations | OPTIONAL | Not applied: extraction needs a new helper file, outside this gate's mandate |
| 3 | frontend/src/api/version.test.ts | Asserts the literal default URL, not the resolved base URL | Naming consistency | OPTIONAL | Not applied: the literal pins the default deliberately |

Tests after the pass: frontend vitest run, see the commit's tests line.
