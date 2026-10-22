# Shared Risk Analysis, TEST-08

## Files this feature will create
- frontend/src/api/config.ts
- frontend/src/api/version.ts
- frontend/src/api/version.test.ts
- e2e/tests/TEST-08_footer_app_version.spec.ts
- e2e/uat/scenarios/TEST-08_footer_app_version.feature
- e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md
- .claude/artifacts/TEST-08/uat_script.md

## Existing files this feature will modify
- frontend/src/api/notes.ts: imports API_BASE_URL from the new shared config module (no behaviour change)
- frontend/src/components/AppFooter.tsx: fetches the backend version from GET /api/version on mount instead of importing package.json
- frontend/src/components/AppFooter.test.tsx: mocks the version client; asserts present, loading and failure states
- frontend/src/components/LandingPage.test.tsx: mocks the version client; footer assertion no longer reads package.json
- e2e/tests/TEST-04_page_footer.spec.ts: version expectation now comes from the browser's /api/version response, not frontend/package.json

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.tsx is NOT modified by this plan (the fetch lives in AppFooter), so the feature_map.md flag against BUG-04 on that file does not materialize; frontend/src/components/LandingPage.test.tsx is modified, and BUG-04 (independent, could run concurrently) plausibly edits that test file for its double-submit fix; keep the serialization
- backend/app/routers/version.py, backend/app/schemas/version.py and backend/app/services/version_service.py are read at runtime but not modified; TEST-09 (independent, could run concurrently) adds a commit field there. Additive and ignored by this client, so no file conflict and no contract break
- frontend/src/api/notes.ts may also be modified by BUG-04 (independent, could run concurrently) if its fix is client-side; this plan only changes its base-URL import line
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx are created/modified here and later edited by TEST-10 and CHORE-02 (both depend on TEST-08, so sequential, not concurrent)
