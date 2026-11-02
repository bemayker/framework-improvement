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
- frontend/src/components/AppFooter.tsx: fetch the version from `GET /api/version` at runtime; render `Task Notes` alone while loading and on failure
- frontend/src/components/AppFooter.test.tsx: mock the version client; present, loading, rejected and null paths
- frontend/src/components/LandingPage.test.tsx: mock the version client; footer expectation moves from `package.json` to the mocked backend version
- frontend/src/api/notes.ts: import `API_BASE_URL` from the new `baseUrl.ts`
- e2e/tests/TEST-04_page_footer.spec.ts: expected version comes from the backend's `/api/version` response
- e2e/uat/scenarios/TEST-04_page_footer.feature: expected version is the backend's
- e2e/uat/scripts/TEST-04_page_footer_uat_script.md: expected version is the backend's

Backend: no file modified. The tracker correction moves the version's source to the backend, but `GET /api/version` is already on `main` from TEST-05, so TEST-08 now depends on that endpoint at runtime without editing it. Not modified either: `frontend/src/components/LandingPage.tsx` (the footer owns its fetch, so the page's `<AppFooter />` is unchanged).

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.tsx: the feature_map note expects TEST-08 and BUG-04 to both edit it; this plan does not modify it, so that pair is no longer a conflict on the component itself.
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently): a double-submit fix in the note-form wiring plausibly adds a test there. Serialize, or expect a trivial test-file merge.
- frontend/src/api/notes.ts may also be modified by BUG-04 (independent, could run concurrently) if its fix lands in the client layer.
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx are also edited by TEST-10 and CHORE-02, both of which depend on TEST-08, so they run after it and are not concurrent conflicts.
