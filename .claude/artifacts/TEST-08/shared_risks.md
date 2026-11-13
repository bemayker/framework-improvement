# Shared Risk Analysis, TEST-08

## Files this feature will create
- frontend/src/api/config.ts
- frontend/src/api/version.ts
- frontend/src/api/version.test.ts
- e2e/tests/TEST-08_footer_app_version.spec.ts
- e2e/helpers/backendVersion.ts
- e2e/uat/scenarios/TEST-08_footer_app_version.feature
- e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md

## Existing files this feature will modify
- frontend/src/components/AppFooter.tsx: drops the package.json version import, fetches the backend version on mount, renders the app name alone while pending or on failure
- frontend/src/components/AppFooter.test.tsx: version present, pending, failed and sentinel paths with the version client mocked
- frontend/src/components/LandingPage.test.tsx: mocks the new version client; footer assertion switches to the backend version
- frontend/src/api/notes.ts: reads API_BASE_URL from the new shared config module
- e2e/tests/TEST-04_page_footer.spec.ts: version assertions switch from frontend package.json to the backend pyproject.toml version

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.tsx is NOT modified by this plan (the footer fetches for itself), which removes the map's flagged TEST-08 and BUG-04 overlap on that file. frontend/src/components/LandingPage.test.tsx is still modified here and may also be modified by BUG-04 (independent, could run concurrently: its note-submit tests live in the same file).
- frontend/src/api/notes.ts may also be modified by BUG-04 (independent, could run concurrently) if its double-submit fix touches the notes client; this plan changes only its base-URL import.
- frontend/src/components/AppFooter.tsx and frontend/src/api/version.ts are created or edited here and are the files TEST-10 (depends on TEST-08, so not concurrent), CHORE-02, CHORE-03, CHORE-1, BUG-03 and FEAT-6 plausibly edit; any of those not gated on TEST-08 should be serialized after it.
- Runtime contract, not a file overlap: this feature now consumes GET /api/version (backend/app/routers/version.py, backend/app/schemas/version.py, backend/app/services/version_service.py), which TEST-09 (independent, could run concurrently) edits to add the build commit. The client reads only the version field and ignores extra fields, so an additive change is safe; a rename or removal of version would break the footer.
