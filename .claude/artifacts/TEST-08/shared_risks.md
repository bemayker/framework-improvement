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
- frontend/src/api/notes.ts: imports API_BASE_URL from the new shared baseUrl.ts instead of declaring it
- frontend/src/components/AppFooter.tsx: fetches GET /api/version on mount and renders the backend version; drops the package.json import
- frontend/src/components/AppFooter.test.tsx: mocks the version client; version-present and version-absent paths
- frontend/src/components/LandingPage.test.tsx: mocks the version client; footer assertion uses the mocked backend version
- e2e/tests/TEST-04_page_footer.spec.ts: version assertion re-pointed from frontend/package.json to the GET /api/version response
- e2e/uat/scenarios/TEST-04_page_footer.feature: version step re-pointed to GET /api/version
- e2e/uat/scripts/TEST-04_page_footer_uat_script.md: version comparison step re-pointed to GET /api/version

## Potential conflicts with other independent features
- frontend/src/api/notes.ts may also be modified by TEST-03 (independent per the neighbours call, complete on main; listed in its files): no live conflict, recorded because it is the only neighbour file overlap the call reported.
- frontend/src/components/LandingPage.test.tsx may also be modified by TEST-03 (independent, complete on main): no live conflict.
- frontend/src/components/LandingPage.test.tsx and the LandingPage area may also be modified by BUG-04 (independent, could run concurrently): BUG-04 fixes double-submit in the note form and plausibly edits LandingPage.tsx and its test; this plan does not edit LandingPage.tsx itself but does edit LandingPage.test.tsx. Serialize if run concurrently.
- frontend/src/components/AppFooter.tsx, AppFooter.test.tsx and LandingPage.test.tsx will also be modified by TEST-10 (downstream of TEST-08, "Footer shows the build commit"), which builds on this footer; it cannot run concurrently by dependency order, so no scheduling action is needed beyond that edge.
- frontend/src/components/AppFooter.tsx may also be modified by FEAT-9 (independent, "frontend footer shows a build note"): serialize if run concurrently.
