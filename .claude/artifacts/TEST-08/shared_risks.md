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
- frontend/src/api/notes.ts: API base URL imported from the new shared module instead of defined locally
- frontend/src/components/AppFooter.tsx: version fetched from GET /api/version at runtime instead of imported from package.json
- frontend/src/components/AppFooter.test.tsx: tests rewritten for the success, loading, failure and sentinel paths
- frontend/src/components/LandingPage.test.tsx: version client mocked, footer assertion switched to the backend version
- e2e/tests/TEST-04_page_footer.spec.ts: expected version switched from frontend/package.json to backend/pyproject.toml

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.tsx is no longer modified by this item (the fetch lives in AppFooter.tsx), so the feature_map flag against BUG-04 on that file no longer applies to the source file; LandingPage.test.tsx is still modified and may also be modified by BUG-04 (independent, could run concurrently: its double-submit fix is tested through the landing page).
- frontend/src/api/notes.ts may also be modified by BUG-04 (independent, could run concurrently) if its double-submit fix touches the notes client.
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx are created or rewritten here and later modified by TEST-10 and CHORE-02; both depend on TEST-08, so they are sequenced after it rather than concurrent.
