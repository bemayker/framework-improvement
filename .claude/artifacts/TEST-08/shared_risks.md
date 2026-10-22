# Shared Risk Analysis, TEST-08

## Files this feature will create
- frontend/src/api/baseUrl.ts
- frontend/src/api/version.ts
- frontend/src/api/version.test.ts
- e2e/tests/TEST-08_footer_app_version.spec.ts
- e2e/uat/scenarios/TEST-08_footer_app_version.feature
- e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md

## Existing files this feature will modify
- frontend/src/api/notes.ts: imports the base URL from the new shared module instead of defining it
- frontend/src/components/AppFooter.tsx: fetches the backend version from GET /api/version and omits it when unresolved
- frontend/src/components/AppFooter.test.tsx: version-present and version-absent component tests
- frontend/src/components/LandingPage.test.tsx: mocks the version client; footer assertion no longer reads package.json
- e2e/tests/TEST-04_page_footer.spec.ts: expected version read from backend/pyproject.toml
- e2e/uat/scenarios/TEST-04_page_footer.feature: version step compares against the backend version
- e2e/uat/scripts/TEST-04_page_footer_uat_script.md: version check points at the backend version

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently); LandingPage.tsx itself is no longer touched by this plan, narrowing feature_map.md's flagged overlap to the test file
- backend/app/routers/version.py, backend/app/services/version_service.py, backend/app/schemas/version.py are NOT modified here but are the contract this item consumes; TEST-09 (independent, running concurrently) extends that response with `commit`. The client reads only `version`, so either merge order works
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx will be modified later by TEST-10, CHORE-02, BUG-03, CHORE-03 and FEAT-6 (all depend on TEST-08 directly or transitively, so not concurrent)
- frontend/src/api/notes.ts may also be modified by BUG-04 if its fix lands in the client (independent, could run concurrently)
