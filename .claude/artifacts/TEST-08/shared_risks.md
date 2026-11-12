# Shared Risk Analysis, TEST-08

## Files this feature will create
- frontend/src/api/baseUrl.ts
- frontend/src/api/version.ts
- frontend/src/api/version.test.ts
- e2e/helpers/backendVersion.ts
- e2e/tests/TEST-08_footer_app_version.spec.ts
- e2e/uat/scenarios/TEST-08_footer_app_version.feature
- e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md
- .claude/artifacts/TEST-08/uat_script.md

## Existing files this feature will modify
- frontend/src/components/AppFooter.tsx: drop the package.json import, fetch the backend version at runtime, name-only render while loading and on failure
- frontend/src/components/AppFooter.test.tsx: rewritten around a mocked version client
- frontend/src/components/LandingPage.test.tsx: mocks the version client; footer assertion expects the mocked backend version
- frontend/src/api/notes.ts: imports API_BASE_URL from the new baseUrl.ts (behaviour unchanged)
- e2e/tests/TEST-04_page_footer.spec.ts: version assertions read backend/pyproject.toml instead of frontend/package.json
- e2e/uat/scenarios/TEST-04_page_footer.feature: version-source step corrected
- e2e/uat/scripts/TEST-04_page_footer_uat_script.md: version-source step corrected

Not modified (stated for the scheduler): frontend/src/components/LandingPage.tsx, and every file under backend/.

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently): a note-form double-submit fix adds or edits LandingPage tests. TEST-08 edits only the mock setup and the footer assertion in that file. frontend/src/components/LandingPage.tsx itself is NOT in TEST-08's change set, so the feature_map flag on LandingPage.tsx narrows to this test file; serialize, or expect a small textual merge in the test file.
- frontend/src/api/notes.ts may also be modified by BUG-04 (independent, could run concurrently) if its fix touches the createNote client; TEST-08 changes only the API_BASE_URL declaration (moved to baseUrl.ts).
- backend/app/routers/version.py, backend/app/schemas/version.py, backend/app/services/version_service.py are modified by TEST-09 (independent, could run concurrently), not by TEST-08. No shared file, but TEST-08 consumes their response: TEST-09 adding a field to the GET /api/version body is compatible (the client reads only "version"); renaming or removing "version" would break the footer silently (it degrades to name-only), so TEST-09 must keep the field.
- frontend/src/components/AppFooter.tsx and frontend/src/api/version.ts are later edited by TEST-10, CHORE-02, BUG-03, CHORE-03, CHORE-1 and FEAT-6, all of which depend (directly or transitively) on TEST-08, so they are sequenced after it rather than concurrent.
