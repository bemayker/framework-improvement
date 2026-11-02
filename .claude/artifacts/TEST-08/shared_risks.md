# Shared Risk Analysis, TEST-08

## Files this feature will create
- frontend/src/api/baseUrl.ts
- frontend/src/api/version.ts
- frontend/src/api/version.test.ts
- e2e/helpers/backendVersion.ts
- e2e/tests/TEST-08_footer_app_version.spec.ts
- e2e/uat/scenarios/TEST-08_footer_app_version.feature
- e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md
- .claude/artifacts/TEST-08/uat_script.md

## Existing files this feature will modify
- frontend/src/components/AppFooter.tsx: fetches the backend version at runtime instead of importing package.json
- frontend/src/components/AppFooter.test.tsx: mocks the version client, asserts present and absent paths
- frontend/src/components/LandingPage.test.tsx: mocks the version client for the footer assertion
- frontend/src/api/notes.ts: imports API_BASE_URL from the new shared baseUrl module
- e2e/tests/TEST-04_page_footer.spec.ts: expected version now comes from the backend
- e2e/uat/scenarios/TEST-04_page_footer.feature: version expectation corrected to the backend source
- e2e/uat/scripts/TEST-04_page_footer_uat_script.md: version expectation corrected to the backend source

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.tsx is NOT modified by this plan (the fetch lives in AppFooter), contrary to the feature map's note; the TEST-08 and BUG-04 serialization on that file is no longer needed for LandingPage.tsx itself.
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently) if its double-submit fix is tested through the landing page
- frontend/src/api/notes.ts may also be modified by BUG-04 (independent, could run concurrently) if its fix is in the createNote client
- frontend/src/components/AppFooter.tsx and frontend/src/api/version.ts are also edited by TEST-10 and CHORE-02, which depend on TEST-08 (not concurrent; listed so the dependants rebase onto this shape)
- No backend file is modified, so there is no overlap with TEST-09, BUG-01 or FEAT-8 (backend version or notes work)
