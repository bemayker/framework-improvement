# Refactor report: TEST-08

Gate result: 2 improvements applied (11 files examined)

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | frontend/src/api/version.ts, frontend/src/api/notes.ts | R1: the API base URL default and the VITE_API_BASE_URL lookup were repeated in both clients (one value, one source) | DRY violations | RECOMMENDED | Resolved once in frontend/src/api/baseUrl.ts (new file), imported by both clients |
| 2 | e2e/uat/scripts/TEST-04_page_footer_uat_script.md, e2e/uat/scenarios/TEST-04_page_footer.feature | R2: ports 5173 and 8000 contradicted the published 5183 and 8010 and the new line 9 | Naming consistency | RECOMMENDED | Ports changed to 5183 and 8010; the vitest step now reads `npm --prefix frontend test` |

The gate's own analysis of the other files in scope (AppFooter.tsx, AppFooter.test.tsx, version.test.ts, LandingPage.test.tsx, backendVersion.ts, the two E2E specs) found nothing further.

Not changed, out of scope: other features' UAT scripts and scenarios (TEST-01, TEST-03) still name 5173 and 8000. They belong to other items and are carried as known improvements.

Tests after the change: frontend vitest 37 passed, 0 failed; `tsc --noEmit` clean.

Files created: frontend/src/api/baseUrl.ts (R1; no test file added, both clients' existing tests assert the resolved URLs through it).
