# Shared Risk Analysis, TEST-08

## Files this feature will create
- frontend/src/api/baseUrl.ts
- frontend/src/api/version.ts
- frontend/src/api/version.test.ts
- e2e/tests/TEST-08_footer_app_version.spec.ts
- e2e/uat/scenarios/TEST-08_footer_app_version.feature
- e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md
- .claude/artifacts/TEST-08/uat_script.md

## Existing files this feature will modify
- frontend/src/api/notes.ts: imports the shared API_BASE_URL instead of declaring it locally
- frontend/src/components/AppFooter.tsx: fetches the version from GET /api/version; name-only while loading and on failure
- frontend/src/components/AppFooter.test.tsx: mocks the version client; present, pending, failed and unknown paths
- frontend/src/components/LandingPage.test.tsx: mocks the version client; footer assertion moves to the backend version
- e2e/tests/TEST-04_page_footer.spec.ts: expected version read from backend/pyproject.toml instead of frontend/package.json
- e2e/uat/scenarios/TEST-04_page_footer.feature: version step names the backend source
- e2e/uat/scripts/TEST-04_page_footer_uat_script.md: version comparison names the backend source

Not modified: frontend/src/components/LandingPage.tsx (the fetch lives in AppFooter), and no backend file (GET /api/version already exists on main from TEST-05).

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently): BUG-04 changes the note-form submit wiring and plausibly adds or edits LandingPage tests. TEST-08 no longer edits LandingPage.tsx itself, so the map's LandingPage.tsx warning narrows to the test file; serialize if both File Manifests list it.
- frontend/src/api/notes.ts may also be modified by BUG-04 (independent, could run concurrently) if its double-submit fix is client-side in the notes client; TEST-08 changes only the base-URL import lines there.
- backend/app/routers/version.py and backend/app/schemas/version.py are not modified by TEST-08, but TEST-08 consumes their response contract while TEST-09 (independent, planning concurrently) extends the version endpoint with the build commit. An added field is harmless (the client reads only `version`); renaming or removing `version`, or changing the `unknown` sentinel in backend/app/services/version_service.py, would break TEST-08's client and its E2E spec. Flag to TEST-09: keep `version` as-is.
- BUG-01 (independent, backend server_time only): no shared files.
