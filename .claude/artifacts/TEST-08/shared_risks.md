# Shared Risk Analysis, TEST-08

## Files this feature will create
- frontend/src/api/config.ts
- frontend/src/api/version.ts
- frontend/src/api/version.test.ts
- e2e/helpers/backendVersion.ts
- e2e/tests/TEST-08_footer_app_version.spec.ts
- e2e/uat/scenarios/TEST-08_footer_app_version.feature
- e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md
- .claude/artifacts/TEST-08/uat_script.md

## Existing files this feature will modify
- frontend/src/api/notes.ts: API_BASE_URL imported from ./config instead of declared locally (no behaviour change)
- frontend/src/components/AppFooter.tsx: version fetched from GET /api/version at runtime; package.json import removed
- frontend/src/components/AppFooter.test.tsx: version client mocked; present, loading and absent paths
- frontend/src/components/LandingPage.test.tsx: version client mocked; footer assertion uses the backend version
- e2e/tests/TEST-04_page_footer.spec.ts: expected version read from backend/pyproject.toml
- e2e/uat/scenarios/TEST-04_page_footer.feature: version step references the backend version
- e2e/uat/scripts/TEST-04_page_footer_uat_script.md: version comparison references the backend version

Not modified: frontend/src/components/LandingPage.tsx (AppFooter fetches its own version), and no backend file (GET /api/version already exists from TEST-05).

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently): BUG-04's double-submit fix plausibly adds or edits note-submit tests in this file, while TEST-08 edits only its footer assertion and adds a mock of ../api/version. The map's existing flag names LandingPage.tsx; TEST-08 does not touch LandingPage.tsx, so the overlap is the test file only.
- frontend/src/api/notes.ts may also be modified by BUG-04 (independent, could run concurrently) if its fix changes the createNote client; TEST-08 changes only the base-URL import at the top of the file.
- frontend/src/components/AppFooter.tsx and frontend/src/components/AppFooter.test.tsx may also be modified by FEAT-9 (independent, footer build note; not currently a graph node per its row), which edits the footer.
- Downstream, not concurrent: TEST-10 (Footer shows the build commit) depends on TEST-08 and edits AppFooter.tsx after it; no concurrency risk.
