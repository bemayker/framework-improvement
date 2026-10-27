# Shared Risk Analysis, TEST-08

## Files this feature will create
- frontend/src/api/baseUrl.ts
- frontend/src/api/version.ts
- frontend/src/api/version.test.ts
- e2e/tests/TEST-08_footer_app_version.spec.ts
- e2e/uat/scenarios/TEST-08_footer_app_version.feature
- e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md

## Existing files this feature will modify
- frontend/src/components/AppFooter.tsx: fetch the backend version from GET /api/version on mount instead of importing frontend/package.json
- frontend/src/components/AppFooter.test.tsx: mock the version client; assert present, absent and loading
- frontend/src/components/LandingPage.test.tsx: mock the version client; drop the package.json version assertion
- frontend/src/api/notes.ts: read the API base URL from the new shared module
- e2e/tests/TEST-04_page_footer.spec.ts: assert the backend version instead of the frontend package version

Not modified: frontend/src/components/LandingPage.tsx (the footer fetches its own data) and every file under backend/ (GET /api/version already exists from TEST-05).

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently) if its double-submit fix is tested at page level; LandingPage.tsx itself is not touched by TEST-08, so the graph's assumed overlap on LandingPage.tsx does not materialize. Serialize BUG-04's build after TEST-08 only if BUG-04's File Manifest lists LandingPage.test.tsx.
- frontend/src/api/notes.ts may also be modified by BUG-04 (independent, could run concurrently) if its fix is placed in the notes client rather than in NoteForm.tsx; TEST-08 changes only the base-URL import line there.
- GET /api/version (backend/app/routers/version.py, backend/app/schemas/version.py, backend/app/services/version_service.py) is extended by TEST-09 (independent, could run concurrently) with a commit field. No file overlap with TEST-08, which edits no backend file; the contract risk is covered because TEST-08's client reads only the version field and ignores extra fields.
- Downstream, not concurrent: TEST-10 (depends on TEST-08 and TEST-09) and CHORE-02 (TEST-08 follow-up) will edit frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx, which this item creates and rewrites.
- BUG-01: disjoint (backend server-time only).
