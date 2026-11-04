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
- frontend/src/api/notes.ts: imports API_BASE_URL from the new baseUrl.ts instead of defining it (no behaviour change)
- frontend/src/components/AppFooter.tsx: fetches the backend version from GET /api/version on mount instead of importing frontend/package.json
- frontend/src/components/AppFooter.test.tsx: mocks the version client; present, absent, loading and sentinel cases
- frontend/src/components/LandingPage.test.tsx: mocks the version client; the footer assertion uses the mocked backend version
- e2e/tests/TEST-04_page_footer.spec.ts: the expected version comes from the page's GET /api/version response, not frontend/package.json
- e2e/uat/scenarios/TEST-04_page_footer.feature: the version-source step names the backend endpoint
- e2e/uat/scripts/TEST-04_page_footer_uat_script.md: the prerequisite and step 4 compare against GET /api/version

frontend/src/components/LandingPage.tsx is deliberately NOT modified (the fetch lives in AppFooter), and no backend file is modified: GET /api/version already exists on main (TEST-05).

## Potential conflicts with other independent features
- frontend/src/components/AppFooter.tsx and frontend/src/api/version.ts will also be modified by TEST-10 (Footer shows the build commit), which depends on TEST-08 and is held behind it, so this is an ordering dependency, not a concurrent conflict. TEST-10 should build on the version.ts client this item creates.
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (double-submit note fix, held behind this item) and TEST-10. Only the test file overlaps, not LandingPage.tsx itself, but the test file is shared, so keep the serialization.
- frontend/src/api/notes.ts may also be modified by BUG-04 if its fix is client-side (submit wiring). The change here is a two-line import swap, so it is a small textual conflict, but the builds should still be serialized.
- GET /api/version response shape (backend/app/schemas/version.py, backend/app/services/version_service.py, backend/app/routers/version.py) will be changed by TEST-09 (planned in parallel, adds a commit field). TEST-08 modifies none of those files, so there is no file conflict. The client reads only the version field and ignores extra fields, so TEST-09's additive change is compatible in either merge order.
- e2e/tests/TEST-04_page_footer.spec.ts and the TEST-04 UAT artifacts: TEST-04 is complete. A future TEST-10 footer change may touch the same spec.
