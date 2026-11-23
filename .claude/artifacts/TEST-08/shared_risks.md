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
- frontend/src/api/notes.ts: imports the base URL from the new shared module instead of defining it
- frontend/src/components/AppFooter.tsx: fetches the version from GET /api/version; name-only footer while loading and on failure
- frontend/src/components/AppFooter.test.tsx: present, pending, failed and sentinel paths
- frontend/src/components/LandingPage.test.tsx: mocks the version client; footer assertion moves from package.json to the mocked backend value
- e2e/tests/TEST-04_page_footer.spec.ts: footer version asserted against the live /api/version response
- e2e/uat/scenarios/TEST-04_page_footer.feature: version source step moves to /api/version
- e2e/uat/scripts/TEST-04_page_footer_uat_script.md: version comparison step moves to /api/version

frontend/src/components/LandingPage.tsx is NOT modified, despite the map's note; only its test file is.

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently): a note-form double-submit fix would plausibly extend the landing page tests; serialize if both manifests list it.
- frontend/src/api/notes.ts may also be modified by BUG-04 (independent, could run concurrently) if its fix lands in the notes client.
- frontend/src/components/LandingPage.test.tsx and frontend/src/components/AppFooter.tsx were also touched by TEST-03 and TEST-04 (complete, listed by the neighbours call), so no live conflict.
- TEST-09 and BUG-01 (concurrent in this run): disjoint, backend only. TEST-09 edits the backend version slice (backend/app/routers/version.py, schemas/version.py, services/version_service.py); this item changes none of those files but consumes GET /api/version, so if TEST-09 changes the response shape away from a top-level string `version` field, this item's client breaks. Treat the `{"version": string}` shape as the contract between them.
- TEST-10 is downstream of TEST-08 (not independent) and will edit AppFooter.tsx after this merges.
