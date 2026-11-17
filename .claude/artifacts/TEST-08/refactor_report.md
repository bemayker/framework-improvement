# Refactor report: TEST-08

Result: 3 improvements applied (10 files examined)

| # | File | Finding | Category | Severity | Proposed Change |
| - | ---- | ------- | -------- | -------- | --------------- |
| 1 | frontend/src/components/AppFooter.test.tsx | Failure-path test asserted before the rejected/null version was handled, so `setVersion(resolved ?? "unknown")` would pass | Review finding (RECOMMENDED) | RECOMMENDED | Await the mock's settled promise inside `act` before asserting. Verified: with the mutation the test fails ("Task Notes vunknown"); mutation reverted |
| 1 | e2e/tests/TEST-08_footer_app_version.spec.ts | Failure-path spec asserted before the 503 was handled | Review finding (RECOMMENDED) | RECOMMENDED | Wait for the `**/api/version` response before asserting |
| 2 | e2e/uat/scripts/TEST-04_page_footer_uat_script.md, e2e/uat/scenarios/TEST-04_page_footer.feature | Ports 5173/8000 contradict docker-compose.yml and CLAUDE.md (5183/8010) | Review finding (RECOMMENDED) | RECOMMENDED | Changed to 5183/8010 |
| 3 | frontend/src/api/notes.ts | Import below the `Note` type | Import hygiene | OPTIONAL (applied) | Moved the import to the top |

No files created. Frontend suite: 6 files, 35 tests passed. E2E specs not re-run (ports 8010/5183 had no listener and no stack was started within the bounded gate); the E2E change is a wait added before existing assertions.
