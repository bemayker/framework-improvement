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
- frontend/src/api/notes.ts: imports the base URL from the new baseUrl.ts instead of declaring it; no behaviour change
- frontend/src/components/AppFooter.tsx: version source changes from frontend/package.json to GET /api/version at runtime, with a loading and failure state
- frontend/src/components/AppFooter.test.tsx: assertions move from the package.json version to a mocked version client
- frontend/src/components/LandingPage.test.tsx: adds a mock of ../api/version and changes the footer version assertion
- e2e/tests/TEST-04_page_footer.spec.ts: expected version read from the page's /api/version response instead of frontend/package.json

frontend/src/components/LandingPage.tsx is NOT modified by this feature. No backend file is modified: the GET /api/version endpoint already exists (TEST-05), but the footer now depends on it at runtime.

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently): a double-submit fix in the note form is likely to add a LandingPage-level test beside the mock block this item edits. LandingPage.tsx itself is not shared.
- frontend/src/api/notes.ts may also be modified by BUG-04 (independent, could run concurrently) if its fix lands in the notes client rather than in NoteForm.tsx; this item changes only the base-URL lines at the top of that file.
- frontend/src/components/AppFooter.tsx may also be modified by FEAT-9 (independent, could run concurrently; "frontend footer shows a build note").
- frontend/src/components/AppFooter.tsx, AppFooter.test.tsx and e2e/tests/TEST-04_page_footer.spec.ts will also be modified by TEST-10 (downstream, "footer shows the build commit"): not concurrent, since TEST-10 depends on this item, but its plan must start from the runtime-fetched footer this item lands.
