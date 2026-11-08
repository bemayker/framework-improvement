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
- frontend/src/components/AppFooter.tsx: fetch the backend version at runtime; drop the package.json import
- frontend/src/components/AppFooter.test.tsx: mock the version client; present and absent paths
- frontend/src/components/LandingPage.test.tsx: mock the version client; re-point the footer version assertion
- frontend/src/api/notes.ts: import API_BASE_URL from the new shared baseUrl module
- e2e/tests/TEST-04_page_footer.spec.ts: version assertions re-pointed to the backend's version
- e2e/uat/scenarios/TEST-04_page_footer.feature: version step names the backend's version
- e2e/uat/scripts/TEST-04_page_footer_uat_script.md: version comparison against the backend's version

Not modified: frontend/src/components/LandingPage.tsx (the fetch lives in AppFooter), and no backend file (GET /api/version already exists from TEST-05).

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (note-form double submit; feature_map flags BUG-04 against LandingPage.tsx, and its tests live beside it). Serialize if run concurrently.
- frontend/src/api/notes.ts and frontend/src/api/notes.test.ts may also be modified by BUG-04 if its fix touches the createNote client. Serialize if run concurrently.
- Runtime contract, not a file overlap: TEST-09 (planned concurrently) extends the GET /api/version response in backend/app/schemas/version.py and backend/app/routers/version.py. Additive; this feature reads only the version field, so no ordering is required. If TEST-09 were to rename or remove the version field, TEST-08's client and E2E spec would break.
- BUG-01 (backend server_time router): disjoint from every file above.
