# Shared Risk Analysis, TEST-08

## Files this feature will create
- frontend/src/api/baseUrl.ts
- frontend/src/api/version.ts
- frontend/src/api/version.test.ts
- e2e/tests/TEST-08_footer_app_version.spec.ts
- e2e/uat/scenarios/TEST-08_footer_app_version.feature
- e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md

## Existing files this feature will modify
- frontend/src/api/notes.ts: imports API_BASE_URL from ./baseUrl instead of defining it (no behaviour change)
- frontend/src/components/AppFooter.tsx: version fetched at runtime from GET /api/version instead of imported from package.json
- frontend/src/components/AppFooter.test.tsx: mocks the version client; asserts loading, resolved, rejected and sentinel paths
- frontend/src/components/LandingPage.test.tsx: mocks the version client in the footer assertion
- e2e/tests/TEST-04_page_footer.spec.ts: version expectation read from the page's /api/version response
- e2e/uat/scenarios/TEST-04_page_footer.feature: version source wording
- e2e/uat/scripts/TEST-04_page_footer_uat_script.md: version source wording

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently: a double-submit fix in the note form is likely tested through the page). LandingPage.tsx itself is NOT modified by TEST-08, which removes the LandingPage.tsx overlap the feature map flags.
- frontend/src/api/notes.ts may also be modified by BUG-04 (independent, could run concurrently) if its fix touches the createNote client; TEST-08's change there is a one-line import swap.
- Runtime, not file, coupling with TEST-09 (independent, could run concurrently): TEST-09 edits the backend version slice (routers/version.py, schemas/version.py, services/version_service.py, core/config.py) that this feature consumes. TEST-08 edits none of those files and reads only the `version` field, so an added `commit` field does not break it; no serialization needed.
- Disjoint from BUG-01 (backend server_time only).
- Downstream, not concurrent: TEST-10, CHORE-02, BUG-03, CHORE-1 and FEAT-6 depend on TEST-08 or its successors and edit frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx after it merges.
