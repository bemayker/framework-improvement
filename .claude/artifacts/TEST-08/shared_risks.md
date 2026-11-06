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
- frontend/src/api/notes.ts: reads the base URL from the new `apiBaseUrl.ts` instead of its own constants (no behaviour change)
- frontend/src/components/AppFooter.tsx: version fetched from GET /api/version at runtime instead of imported from package.json; loading and failure states render the app name only
- frontend/src/components/AppFooter.test.tsx: mocks the version client; present, absent and loading paths
- frontend/src/components/LandingPage.test.tsx: mocks the version client; footer assertion uses the mocked backend version
- e2e/tests/TEST-04_page_footer.spec.ts: expected version taken from the observed /api/version response instead of frontend/package.json
- e2e/uat/scenarios/TEST-04_page_footer.feature: version source line updated to GET /api/version
- e2e/uat/scripts/TEST-04_page_footer_uat_script.md: prerequisite and step 4 compare against GET /api/version

`frontend/src/components/LandingPage.tsx` is NOT modified. No backend file is modified: TEST-08 reads the existing GET /api/version (TEST-05) at runtime.

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently: a double-submit fix is likely to add or adjust note-form tests in this file). The shared file is the test, not LandingPage.tsx, which TEST-08 does not touch.
- frontend/src/api/notes.ts may also be modified by BUG-04 (independent, could run concurrently, if its fix lands in the notes client rather than in NoteForm.tsx). TEST-08's change there is limited to the base-URL import.
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx are also planned by TEST-10 and CHORE-02. Both depend on TEST-08 in feature_map.md, so they are not concurrent with it. They build on these files after TEST-08 merges.
- Backend version files (backend/app/routers/version.py, backend/app/schemas/version.py, backend/app/services/version_service.py) are edited by TEST-09 (version endpoint reports the build commit). TEST-08 does not modify them, but it depends at runtime on the response keeping a string `version` field. If TEST-09 adds a field, nothing breaks. If it renames or removes `version`, the footer falls back to the name-only failure state.
