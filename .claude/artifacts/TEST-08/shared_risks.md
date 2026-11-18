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
- frontend/src/api/notes.ts: import the API base URL from the new baseUrl module instead of declaring it
- frontend/src/components/AppFooter.tsx: fetch the version from GET /api/version on mount; drop the package.json import
- frontend/src/components/AppFooter.test.tsx: mock the version client; present, pending, failed and unknown-sentinel tests
- frontend/src/components/LandingPage.test.tsx: mock the version client; footer assertion uses the mocked backend version
- e2e/tests/TEST-04_page_footer.spec.ts: drop the frontend/package.json version assertions

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently): its note-form double-submit fix plausibly adds a LandingPage test. frontend/src/components/LandingPage.tsx itself is NOT modified by TEST-08 (the footer owns its fetch), so the map row's LandingPage.tsx overlap with BUG-04 does not materialize; only the test file can collide.
- frontend/src/api/notes.ts may also be modified by BUG-04 (independent, could run concurrently) if its fix is client-side in the notes API client; TEST-08's change there is a one-line import of the base URL.
- frontend/src/components/AppFooter.tsx, AppFooter.test.tsx and LandingPage.test.tsx are downstream-shared with TEST-10 (Footer shows the build commit, depends on TEST-08, not independent): TEST-10 must be built on top of TEST-08, not beside it.
- frontend/src/components/AppFooter.tsx may also be modified by FEAT-9 (independent, "frontend footer shows a build note", could run concurrently).
- No backend file is touched, so the backend/app/main.py serialization group (TEST-09, BUG-01, FEAT-4, FEAT-5, FEAT-7, FEAT-8, FEAT-10 to FEAT-14) does not apply; FEAT-8 and TEST-09 change the GET /api/version endpoint this item consumes, so a change to its response shape there would break this footer at runtime.
