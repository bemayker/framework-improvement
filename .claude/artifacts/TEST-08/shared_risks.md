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
- frontend/src/api/notes.ts: imports the shared API base URL instead of declaring it
- frontend/src/components/AppFooter.tsx: fetches the backend version from GET /api/version at mount instead of importing frontend/package.json
- frontend/src/components/AppFooter.test.tsx: mocks the version client; present, pending, failed and sentinel paths
- frontend/src/components/LandingPage.test.tsx: mocks the version client; footer assertion uses the mocked backend version
- e2e/tests/TEST-04_page_footer.spec.ts: expected version read from backend/pyproject.toml
- e2e/uat/scenarios/TEST-04_page_footer.feature: version source wording
- e2e/uat/scripts/TEST-04_page_footer_uat_script.md: version source wording

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently): its double-submit fix plausibly adds note-form tests there. TEST-08 does not modify frontend/src/components/LandingPage.tsx itself, so the feature-map warning about that file no longer applies to this item; the test file is the remaining overlap.
- frontend/src/components/AppFooter.tsx may also be modified by FEAT-9 (independent, could run concurrently): it edits the footer to show a build note.
- frontend/src/api/notes.ts may also be modified by BUG-04 (independent, could run concurrently) if its fix lands in the notes client.
- Contract, not file, overlap: TEST-09 (independent, being planned concurrently) edits the version slice (backend/app/routers/version.py, schemas/version.py, services/version_service.py) to add the build commit. TEST-08 consumes GET /api/version and reads only the `version` field, ignoring any field TEST-09 adds; a TEST-09 change that renames or removes `version`, or changes the `unknown` sentinel, would break this footer.
