# Shared Risk Analysis, TEST-08

## Files this feature will create
- frontend/src/api/config.ts
- frontend/src/api/version.ts
- frontend/src/api/version.test.ts
- e2e/tests/TEST-08_footer_app_version.spec.ts
- e2e/uat/scenarios/TEST-08_footer_app_version.feature
- e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md
- .claude/artifacts/TEST-08/uat_script.md

## Existing files this feature will modify
- frontend/src/api/notes.ts: imports the shared `API_BASE_URL` from `./config` instead of defining it (no behaviour change)
- frontend/src/components/AppFooter.tsx: fetches the backend version from `GET /api/version` on mount; renders `Task Notes` alone while loading or on failure; drops the `package.json` import
- frontend/src/components/AppFooter.test.tsx: mocks the version client; asserts version present and version absent
- frontend/src/components/LandingPage.test.tsx: mocks the version client; footer assertion moves off `package.json`
- e2e/tests/TEST-04_page_footer.spec.ts: expected footer version read from `backend/pyproject.toml`
- e2e/uat/scenarios/TEST-04_page_footer.feature: version source step updated to the backend
- e2e/uat/scripts/TEST-04_page_footer_uat_script.md: version comparison updated to the backend

No backend file is modified: `GET /api/version` already exists on main (TEST-05). `frontend/src/components/LandingPage.tsx` is not modified.

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently): BUG-04's double-submit fix plausibly adds note-form submit tests there. The feature map's flag names `LandingPage.tsx`; this plan does not modify `LandingPage.tsx` itself, only its test file, so the serialization still applies, on the test file.
- frontend/src/api/notes.ts may also be modified by BUG-04 (independent, could run concurrently) if its fix lands in the notes client; TEST-08 moves the base URL constant out of it.
- frontend/src/components/LandingPage.tsx: TEST-10 also edits it per the map, but TEST-10 depends on TEST-08, so it is not concurrent; listed for the scheduler only.
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx are also edited by TEST-10, CHORE-02, BUG-03, CHORE-03, CHORE-1 and FEAT-6, all of which depend on TEST-08 directly or transitively, so none can run concurrently with it.
