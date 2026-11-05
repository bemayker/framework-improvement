# Shared Risk Analysis, TEST-08

## Files this feature will create
- frontend/src/api/config.ts
- frontend/src/api/version.ts
- frontend/src/api/version.test.ts
- e2e/tests/TEST-08_footer_app_version.spec.ts
- e2e/uat/scenarios/TEST-08_footer_app_version.feature
- e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md

## Existing files this feature will modify
- frontend/src/components/AppFooter.tsx: fetches the backend version at runtime instead of importing frontend/package.json
- frontend/src/components/AppFooter.test.tsx: tests the present, absent and pending paths against a mocked version client
- frontend/src/api/notes.ts: reads API_BASE_URL from the new shared config module (no behaviour change)
- frontend/src/components/LandingPage.test.tsx: mocks the version client and drops the package.json version assertion
- e2e/tests/TEST-04_page_footer.spec.ts: expected version source changes to backend/pyproject.toml

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.tsx is NOT modified by this plan (it already renders AppFooter), so the feature_map warning about BUG-04 on that file no longer applies to it.
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (note-form submit; independent, could run concurrently): both would edit the same test file (the version-client mock and footer assertion here, the submit tests there).
- frontend/src/api/notes.ts may also be modified by BUG-04 (independent, could run concurrently) if its fix touches the createNote client; this plan changes only its API_BASE_URL import line.
- GET /api/version response shape (backend/app/schemas/version.py, backend/app/routers/version.py) is being planned by TEST-09 (independent, could run concurrently) to gain a commit field. TEST-08 modifies no backend file, so there is no file collision; the version client reads only `version` and ignores extra fields, so an additive change is safe. A rename or removal of `version` by TEST-09 would break this footer.
- frontend/src/components/AppFooter.tsx and frontend/src/api/version.ts will be modified next by TEST-10 (footer shows the build commit), which depends on TEST-08, so it is sequential, not concurrent.
