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
- frontend/src/api/notes.ts: imports API_BASE_URL from the new baseUrl.ts instead of declaring it
- frontend/src/components/AppFooter.tsx: fetches the backend version at runtime; loading and failure render the name only
- frontend/src/components/AppFooter.test.tsx: mocks the version client; covers present, pending, failed and unusable paths
- frontend/src/components/LandingPage.test.tsx: mocks the version client; footer assertion moves from the package.json version to the mocked backend version
- e2e/tests/TEST-04_page_footer.spec.ts: drops the frontend/package.json version assertions
- e2e/uat/scenarios/TEST-04_page_footer.feature: version step points at GET /api/version
- e2e/uat/scripts/TEST-04_page_footer_uat_script.md: version steps point at GET /api/version

Runtime dependency, no edit: backend GET /api/version (backend/app/routers/version.py, services/version_service.py, schemas/version.py), owned by TEST-05.

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.tsx: the map flags TEST-08 and BUG-04 on this file. This plan does NOT edit LandingPage.tsx (the footer owns its fetch), and BUG-04's listed files are NoteForm.tsx and NoteForm.test.tsx, so that predicted conflict does not materialise. Residual overlap: frontend/src/components/LandingPage.test.tsx, which this plan edits and a BUG-04 fix that tests the form through the page could also edit (independent, could run concurrently); serialize if BUG-04's manifest lists it.
- frontend/src/api/notes.ts may also be modified by BUG-04 if its double-submit fix lands in the client rather than NoteForm.tsx (independent, could run concurrently); its own shared_risks lists only NoteForm files, so low risk.
- backend/app/routers/version.py, backend/app/services/version_service.py and backend/app/schemas/version.py are modified by TEST-09 (independent, could run concurrently). TEST-08 does not edit them but consumes GET /api/version: TEST-09 must keep the `version` field and its 200 response, or this footer loses its version. Serialize, or have TEST-09's build run TEST-08's footer tests.
- frontend/src/components/AppFooter.tsx and AppFooter.test.tsx: TEST-10 (downstream, footer shows the build commit) and FEAT-9 (independent, footer build note) edit the same footer; FEAT-9 could run concurrently, serialize if both are dispatched.
