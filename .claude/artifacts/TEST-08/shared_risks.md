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
- frontend/src/api/notes.ts: imports `API_BASE_URL` from the new shared `baseUrl.ts` instead of defining it
- frontend/src/components/AppFooter.tsx: fetches the backend version from `GET /api/version` on mount instead of importing `package.json`
- frontend/src/components/AppFooter.test.tsx: mocks the version client; present, absent, sentinel and loading paths
- frontend/src/components/LandingPage.test.tsx: mocks the version client; footer assertion uses the mocked backend version
- e2e/tests/TEST-04_page_footer.spec.ts: expected version read from `backend/pyproject.toml`
- e2e/uat/scenarios/TEST-04_page_footer.feature: version step references the backend version
- e2e/uat/scripts/TEST-04_page_footer_uat_script.md: version comparison references the backend version

Not modified, deliberately: `frontend/src/components/LandingPage.tsx` (the fetch lives in `AppFooter.tsx`) and every backend file (`GET /api/version` already exists from TEST-05 and is consumed unchanged).

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently): BUG-04 changes note-form submit wiring and plausibly adds a LandingPage test; TEST-08 changes only the version mock and the footer assertion. The map row's existing serialize advice for this pair still holds, now for the test file rather than `LandingPage.tsx`.
- frontend/src/api/notes.ts may also be modified by BUG-04 (independent, could run concurrently) if its fix touches the notes client; TEST-08's edit there is limited to the base-URL import.
- Runtime contract with TEST-09 (independent, could run concurrently): TEST-09 edits `backend/app/routers/version.py`, `backend/app/schemas/version.py` and `backend/app/services/version_service.py` to add the build commit to `GET /api/version`. No file overlap, but TEST-08 consumes that response; TEST-08's client reads only `version` and ignores other fields, so an additive change is safe. A rename or removal of `version` in TEST-09 would break the footer.
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx will later be modified by TEST-10 and CHORE-02, both of which depend on TEST-08, so they are not concurrent with it.
