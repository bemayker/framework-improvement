# Shared Risk Analysis, TEST-08

## Files this feature will create
- frontend/src/api/baseUrl.ts
- frontend/src/api/version.ts
- frontend/src/api/version.test.ts
- e2e/tests/TEST-08_footer_app_version.spec.ts
- e2e/uat/scenarios/TEST-08_footer_app_version.feature
- e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md

## Existing files this feature will modify
- frontend/src/components/AppFooter.tsx: fetch the backend version at runtime instead of importing package.json
- frontend/src/components/AppFooter.test.tsx: present and absent version paths against a mocked client
- frontend/src/api/notes.ts: read API_BASE_URL from the shared baseUrl module
- frontend/src/components/LandingPage.test.tsx: mock the version client; footer assertion uses the mocked backend version
- e2e/tests/TEST-04_page_footer.spec.ts: stop asserting the frontend package.json version

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.tsx is NOT modified by this plan (AppFooter owns its fetch), so the feature_map.md flag "TEST-08 and BUG-04 both plausibly edit LandingPage.tsx" no longer holds for the component itself.
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently): a double-submit fix in the note-form wiring would plausibly add a LandingPage test. Serialize, or expect a trivial merge (this plan touches only the version mock and the footer assertion).
- frontend/src/api/notes.ts may also be modified by BUG-04 (independent, could run concurrently) if its fix is client-side in the notes client; this plan changes only the base-URL declaration at the top of the file.
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx will be modified by TEST-10 and CHORE-02 (both depend on TEST-08, so they are sequenced after it, not concurrent).
- No backend file is touched, so there is no conflict with TEST-09, BUG-01 or TEST-12 (backend only). TEST-09 may add fields to the GET /api/version response; the version client ignores extra fields, so that is compatible in either merge order.
