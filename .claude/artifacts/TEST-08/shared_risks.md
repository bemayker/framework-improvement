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
- frontend/src/components/AppFooter.tsx: version from GET /api/version at runtime instead of package.json; pending and absent states render the app name only
- frontend/src/components/AppFooter.test.tsx: mocks the version client; present, pending, failure and sentinel paths
- frontend/src/api/notes.ts: imports API_BASE_URL from the new apiBaseUrl.ts (no behaviour change)
- frontend/src/components/LandingPage.test.tsx: mocks the version client; footer assertion switches from package.json to the mocked backend version
- e2e/tests/TEST-04_page_footer.spec.ts: expected version switches from frontend/package.json to backend/pyproject.toml

Not modified: frontend/src/components/LandingPage.tsx (the fetch lives inside AppFooter.tsx), and no backend file (GET /api/version already exists from TEST-05 and is reused unchanged).

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently): a client-side double-submit fix in the note-form wiring would plausibly add a case to the page test. TEST-08 does not modify LandingPage.tsx itself, so the map's LandingPage.tsx overlap with BUG-04 is reduced to this test file; serialize if both File Manifests list it.
- frontend/src/api/notes.ts may also be modified by BUG-04 (independent, could run concurrently) if its fix lands in the notes client; TEST-08's edit there is a one-line import change.
- e2e/tests/TEST-04_page_footer.spec.ts and frontend/src/components/AppFooter.tsx may also be modified by FEAT-9 (independent, verify item: footer build note, edits the frontend footer); serialize if run concurrently.
- backend/app/routers/version.py and backend/app/main.py are read, not modified, by TEST-08; TEST-09 and FEAT-8 (independent) edit the version endpoint. A change to its response shape (`{"version": str}`) would break this footer, so either must keep the `version` field.
- TEST-10 depends on TEST-08 and also touches frontend/src/components/LandingPage.tsx; it is downstream, not concurrent, so no serialization is needed.
