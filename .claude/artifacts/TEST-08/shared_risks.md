# Shared Risk Analysis, TEST-08

## Files this feature will create
- frontend/src/api/apiBaseUrl.ts
- frontend/src/api/version.ts
- frontend/src/api/version.test.ts
- e2e/tests/TEST-08_footer_app_version.spec.ts
- e2e/uat/scenarios/TEST-08_footer_app_version.feature
- e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md
- .claude/artifacts/TEST-08/uat_script.md

## Existing files this feature will modify
- frontend/src/api/notes.ts: imports the shared API_BASE_URL instead of declaring its own
- frontend/src/components/AppFooter.tsx: fetches the backend version from GET /api/version instead of importing package.json
- frontend/src/components/AppFooter.test.tsx: mocks the version client; asserts present, pending and failed paths
- frontend/src/components/LandingPage.test.tsx: mocks the version client; footer assertion uses the backend version
- e2e/tests/TEST-04_page_footer.spec.ts: version assertions read the page's /api/version response instead of frontend/package.json
- e2e/uat/scenarios/TEST-04_page_footer.feature: version step names GET /api/version
- e2e/uat/scripts/TEST-04_page_footer_uat_script.md: version comparison against GET /api/version

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently): its double-submit fix lives in the note-form wiring that LandingPage.test.tsx exercises. LandingPage.tsx itself is not modified by TEST-08, so the map's flagged LandingPage.tsx overlap reduces to the test file.
- frontend/src/components/AppFooter.tsx and AppFooter.test.tsx may also be modified by FEAT-9 (independent, could run concurrently): it edits the frontend footer to show a build note.
- frontend/src/api/notes.ts may also be modified by BUG-04 (independent, could run concurrently) if its fix is client-side.
- Runtime dependency, not a file overlap: the footer now consumes GET /api/version (backend/app/routers/version.py, services/version_service.py, schemas/version.py). TEST-09 and CHORE-01 (independent; the version slice) and FEAT-8 (independent; adds a version route) change that endpoint's code; a change to its response shape would break this footer. TEST-08 edits none of those files.
