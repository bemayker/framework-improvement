# Refactor report: TEST-08

Outcome: 1 improvements applied (11 files examined)

Scope: the feature's changed files (frontend api, AppFooter and its tests, LandingPage test, E2E specs, UAT artifacts) plus the two files named by Phase E's RECOMMENDED findings.

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | e2e/uat/scripts/TEST-04_page_footer_uat_script.md (lines 8, 17, 23), e2e/uat/scenarios/TEST-04_page_footer.feature (lines 8, 12) | Stale ports 5173 and 8000; docker-compose.yml publishes 5183 and 8010 | Naming consistency (stale values in touched artifacts) | RECOMMENDED | Replaced 5173 with 5183 and 8000 with 8010 on those lines. Applied. |
| 2 | frontend/src/components/AppFooter.test.tsx (lines 42 to 64) | Failure-path and sentinel tests may assert before the rejection handler runs | Test soundness (Phase E finding) | RECOMMENDED | Not applied: the Verify by running check showed the test is sound. |

## Finding 2 verification

Command: `npm --prefix frontend test -- src/components/AppFooter.test.tsx` with AppFooter.tsx line 27 temporarily changed to `.catch(() => setVersion("broken"))`.

Result: "renders only the app name when the version request fails" FAILED (`expected 'Task Notes vbroken' to be 'Task Notes'`), 1 failed, 5 passed. The test catches that regression, so it is sound and was left unchanged. AppFooter.tsx was restored to `.catch(() => {})`.

## Checklist pass

- Naming, DRY, dead code, complexity, layering, imports, file structure: no findings in version.ts, baseUrl.ts, notes.ts, AppFooter.tsx. The base URL has one source (baseUrl.ts), matching docker-compose.yml's 8010.
- Files created: none.
