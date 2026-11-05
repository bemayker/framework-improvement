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
- frontend/src/api/notes.ts: imports API_BASE_URL from the new baseUrl module instead of defining it
- frontend/src/components/AppFooter.tsx: fetches the version from GET /api/version instead of importing package.json
- frontend/src/components/AppFooter.test.tsx: mocks the version client; present, absent and loading paths
- frontend/src/components/LandingPage.test.tsx: mocks the version client; footer assertion uses the mocked backend version
- e2e/tests/TEST-04_page_footer.spec.ts: version assertions move from frontend/package.json to the GET /api/version response

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently): a double-submit fix in the note form wiring would likely add a test there; this item edits only the footer test and the module mock list. frontend/src/components/LandingPage.tsx itself is NOT edited by TEST-08, so the feature map's flagged LandingPage.tsx overlap does not materialize.
- frontend/src/api/notes.ts may also be modified by BUG-04 (independent, could run concurrently) if its fix touches the notes client (for example createNote); TEST-08 changes only the base URL import at the top of the file.
- backend/app/routers/version.py and backend/app/schemas/version.py are consumed (not modified) by TEST-08 and modified by TEST-09 (independent, could run concurrently: adds a commit field). Additive for TEST-08, whose client reads only `version` and ignores extra fields; no file overlap.
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx are later edited by TEST-10 and CHORE-02, both of which depend on TEST-08, so they are sequenced rather than concurrent.
