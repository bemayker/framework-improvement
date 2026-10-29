# Shared Risk Analysis, TEST-08

## Files this feature will create
- frontend/src/api/config.ts
- frontend/src/api/version.ts
- frontend/src/api/version.test.ts
- e2e/helpers/backendVersion.ts
- e2e/tests/TEST-08_footer_app_version.spec.ts
- e2e/uat/scenarios/TEST-08_footer_app_version.feature
- e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md
- .claude/artifacts/TEST-08/uat_script.md

## Existing files this feature will modify
- frontend/src/api/notes.ts: imports API_BASE_URL from the new api/config.ts instead of declaring it
- frontend/src/components/AppFooter.tsx: fetches the version from GET /api/version; loading and failure render "Task Notes"
- frontend/src/components/AppFooter.test.tsx: mocks the version client; present, absent and pending cases
- frontend/src/components/LandingPage.test.tsx: mocks ../api/version; footer assertion uses the mocked backend version
- e2e/tests/TEST-04_page_footer.spec.ts: expected version read from backend/pyproject.toml instead of frontend/package.json
- e2e/uat/scenarios/TEST-04_page_footer.feature: version source line updated
- e2e/uat/scripts/TEST-04_page_footer_uat_script.md: version source prerequisite and step 4 updated

No backend file is modified: GET /api/version already exists (TEST-05). frontend/src/components/LandingPage.tsx is NOT modified (the footer fetches its own version), which narrows the ingest-flagged overlap with BUG-04.

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (double-submit note fix; note-form submit wiring tests). BUG-04 is held until TEST-08 merges, so no concurrent build; LandingPage.tsx itself is no longer shared.
- frontend/src/api/notes.ts may also be modified by BUG-04 if its fix lands in the notes client (TEST-08 only changes the base-URL import line); serialized by the same hold.
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx will be modified by TEST-10, CHORE-02, BUG-03, CHORE-03 and FEAT-6 (all depend on TEST-08 directly or transitively, so they cannot run concurrently with it).
