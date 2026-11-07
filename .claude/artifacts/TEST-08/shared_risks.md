# Shared Risk Analysis, TEST-08

## Files this feature will create
- frontend/src/api/version.ts
- frontend/src/api/baseUrl.ts
- frontend/src/api/version.test.ts
- e2e/tests/TEST-08_footer_app_version.spec.ts
- e2e/uat/scenarios/TEST-08_footer_app_version.feature
- e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md
- .claude/artifacts/TEST-08/uat_script.md

## Existing files this feature will modify
- frontend/src/components/AppFooter.tsx: fetch the backend version at runtime instead of importing frontend/package.json
- frontend/src/components/AppFooter.test.tsx: mock the version client; present, absent, loading and backend-wins cases
- frontend/src/components/LandingPage.test.tsx: mock the version client; footer version assertion reads the mocked backend version
- frontend/src/api/notes.ts: import API_BASE_URL from the new baseUrl module
- e2e/tests/TEST-04_page_footer.spec.ts: expected version read from the page's GET /api/version response
- e2e/uat/scenarios/TEST-04_page_footer.feature: version step points at the backend
- e2e/uat/scripts/TEST-04_page_footer_uat_script.md: version prerequisite and comparison step point at the backend

frontend/src/components/LandingPage.tsx is NOT modified (the fetch lives in AppFooter), and no backend file is modified (GET /api/version already exists from TEST-05).

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (note form double submit; depends on TEST-03 only, independent of TEST-08, could run concurrently): a double-submit regression test would plausibly land in this file or NoteForm.test.tsx. TEST-08 touches only its footer assertion and adds a vi.mock of ../api/version. The map's flagged overlap on LandingPage.tsx itself no longer applies, since TEST-08 leaves that file untouched.
- frontend/src/api/notes.ts may also be modified by BUG-04 if its fix lands in the createNote client (independent, could run concurrently). TEST-08 changes only the base-URL import lines.
- GET /api/version response shape is also changed by TEST-09 (independent, running this round), which adds a build-commit field in backend/app/routers/version.py, schemas/version.py and services/version_service.py. No shared file: TEST-08 edits no backend file and its client reads only the version field, so the change is additive for it.
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx will later be edited by TEST-10 and CHORE-02 (both depend on TEST-08, so not concurrent with it).
