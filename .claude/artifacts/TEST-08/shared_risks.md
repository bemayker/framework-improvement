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
- frontend/src/api/notes.ts: imports the API base URL from the new baseUrl.ts instead of declaring it
- frontend/src/components/AppFooter.tsx: fetches the backend version from GET /api/version instead of importing frontend/package.json
- frontend/src/components/AppFooter.test.tsx: mocks the version client; present, loading and failure tests
- frontend/src/components/LandingPage.test.tsx: mocks the version client; footer assertion no longer reads package.json
- e2e/tests/TEST-04_page_footer.spec.ts: drops the frontend/package.json version assertions
- e2e/uat/scenarios/TEST-04_page_footer.feature: version source line corrected to the backend
- e2e/uat/scripts/TEST-04_page_footer_uat_script.md: version source step corrected to the backend

Not modified, contrary to the description's note: frontend/src/components/LandingPage.tsx. AppFooter owns its own fetch, so the page component needs no change.

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently): a client-side double-submit fix would add or change LandingPage submit tests in the same file. The held conflict on frontend/src/components/LandingPage.tsx itself no longer applies, since TEST-08 leaves that file untouched; the scheduler may narrow the hold to the test file.
- frontend/src/api/notes.ts may also be modified by BUG-04 (independent, could run concurrently) if its fix lands in the notes client rather than the form; TEST-08 changes only its base-URL import line.
- frontend/src/components/AppFooter.tsx and AppFooter.test.tsx may also be modified by FEAT-9 (independent, could run concurrently; its row says it edits the frontend footer).
- backend/app/routers/version.py, backend/app/schemas/version.py and backend/app/services/version_service.py are NOT modified by TEST-08, but TEST-09 (version build commit) and FEAT-8 (GET /api/version JSON version) change the endpoint this feature reads at runtime. An additive field is safe; renaming or removing the `version` field, or changing the `unknown` sentinel, would silently drop the footer's version. Not a file conflict, a contract dependency.
