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
- frontend/src/api/notes.ts: imports API_BASE_URL from the new shared module instead of declaring it
- frontend/src/components/AppFooter.tsx: fetches the backend version at runtime instead of importing package.json
- frontend/src/components/AppFooter.test.tsx: mocks the version client; present, absent and loading paths
- frontend/src/components/LandingPage.test.tsx: mocks the version client; footer assertion uses the mocked version
- e2e/tests/TEST-04_page_footer.spec.ts: version assertions read the /api/version response instead of frontend/package.json

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently): BUG-04's double-submit fix is tested through the landing page's note form. TEST-08 no longer modifies frontend/src/components/LandingPage.tsx itself (the fetch lives in AppFooter.tsx), so the feature_map's LandingPage.tsx flag narrows to its test file.
- frontend/src/api/notes.ts may also be modified by BUG-04 (independent, could run concurrently) if its fix lands in the notes client; TEST-08 only changes the base-URL import there.
- GET /api/version response shape (backend/app/schemas/version.py, not modified here) may be extended by TEST-09 (independent, could run concurrently): TEST-08's client reads only the `version` field and ignores extra fields, so an additive change does not conflict; a rename or removal of `version` would.
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx will also be modified by TEST-10 and CHORE-02 (TEST-10 depends on TEST-08, so it is sequenced after it; CHORE-02 is flagged in feature_map.md on the same two files).
