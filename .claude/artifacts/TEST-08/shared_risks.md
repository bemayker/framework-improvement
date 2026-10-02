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
- frontend/src/components/AppFooter.tsx: runtime fetch of GET /api/version replaces the package.json import
- frontend/src/components/AppFooter.test.tsx: mocks the version client; present, loading and absent paths
- frontend/src/components/LandingPage.test.tsx: mocks the version client; footer assertion uses the mocked backend version
- e2e/tests/TEST-04_page_footer.spec.ts: version assertions against frontend/package.json removed
- e2e/uat/scenarios/TEST-04_page_footer.feature: version-from-package.json step re-scoped
- e2e/uat/scripts/TEST-04_page_footer_uat_script.md: package.json comparison step re-scoped

## Potential conflicts with other independent features
- No file-level overlap with TEST-09 (independent, could run concurrently): TEST-09 changes backend/app/schemas/version.py, the version service/router and backend tests only. Contract-level coupling only: TEST-09 adds a `commit` field to the GET /api/version response; this item's client tolerates and ignores extra fields, so either merge order is safe.
- No overlap with BUG-01 (independent, could run concurrently): it edits backend/app/routers/server_time.py only.
- TEST-10 (depends on TEST-08, not concurrent) will modify frontend/src/components/AppFooter.tsx, frontend/src/components/AppFooter.test.tsx and frontend/src/api/version.ts after this merges; already serialized by its dependency.
