# Shared Risk Analysis, TEST-08

## Files this feature will create
- frontend/src/api/baseUrl.ts
- frontend/src/api/version.ts
- frontend/src/api/version.test.ts
- e2e/tests/TEST-08_footer_app_version.spec.ts
- e2e/uat/scenarios/TEST-08_footer_app_version.feature
- e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md

## Existing files this feature will modify
- frontend/src/components/AppFooter.tsx: version fetched at runtime from GET /api/version instead of imported from frontend/package.json
- frontend/src/components/AppFooter.test.tsx: mocks the version client; present and absent paths
- frontend/src/components/LandingPage.test.tsx: mocks the version client; footer assertion uses the mocked version
- frontend/src/api/notes.ts: imports the shared API_BASE_URL from ./baseUrl
- e2e/tests/TEST-04_page_footer.spec.ts: drops the frontend/package.json version assertions

Note: frontend/src/components/LandingPage.tsx is NOT modified (the footer owns its fetch), contrary to the item description's note and the feature_map row; only its test file changes.

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently): a double-submit fix on the note form is likely to add or change LandingPage tests. The feature_map row flags LandingPage.tsx for this pair; the real overlap is the test file.
- frontend/src/api/notes.ts may also be modified by BUG-04 (independent, could run concurrently) if its fix touches the notes client, and by TEST-12 (independent, could run concurrently) if it adds a get-by-id client call.
- GET /api/version response shape may be changed by FEAT-8 (independent, could run concurrently), which defines the same route with a different response; this feature's client reads `version` as a string, so a FEAT-8 change of that field would break the footer. Not a file overlap on this item's side, but a contract dependency.
- frontend/src/components/AppFooter.tsx, frontend/src/components/AppFooter.test.tsx and frontend/src/api/version.ts will also be modified by TEST-10, CHORE-02, BUG-03, CHORE-03 and FEAT-6. All of them depend on TEST-08 directly or through TEST-10, so none can run concurrently with it; listed so their planners know these files originate here.
