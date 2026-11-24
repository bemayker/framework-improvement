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
- frontend/src/api/notes.ts: base URL imported from the new baseUrl module instead of defined locally
- frontend/src/components/AppFooter.tsx: version fetched from GET /api/version at runtime instead of imported from package.json
- frontend/src/components/AppFooter.test.tsx: version client mocked; present, pending, failed and sentinel paths
- frontend/src/components/LandingPage.test.tsx: version client mocked; footer assertion uses the backend version
- e2e/tests/TEST-04_page_footer.spec.ts: expected version read from backend/pyproject.toml
- e2e/uat/scenarios/TEST-04_page_footer.feature: version source wording
- e2e/uat/scripts/TEST-04_page_footer_uat_script.md: version source wording

## Potential conflicts with other independent features
- frontend/src/api/notes.ts and frontend/src/components/LandingPage.test.tsx may also be modified by TEST-03 (independent, could run concurrently; complete, so no live conflict).
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently: its map row names LandingPage.tsx for note-form submit wiring, and its test file is the natural place for that fix's test). TEST-08 no longer edits LandingPage.tsx itself.
- frontend/src/components/AppFooter.tsx and AppFooter.test.tsx may also be modified by FEAT-9 (independent, could run concurrently: its map row says it edits the frontend footer).
- Runtime dependency, not a file overlap: the footer reads GET /api/version (backend/app/routers/version.py, services/version_service.py, schemas/version.py). TEST-09, CHORE-01 and FEAT-8 change or add that version route; a change to its response shape (the `version` field) would turn this footer's version off silently. Serialize if any of them runs concurrently.
- Runtime dependency: the E2E spec expects the backend to report its pyproject.toml version; if the backend container serves `unknown` (package metadata not installed), the TEST-08 and TEST-04 version assertions fail while the footer behaves as planned.
