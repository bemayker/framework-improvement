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
- frontend/src/api/notes.ts: imports `API_BASE_URL` from the new `baseUrl.ts` instead of declaring it (no behaviour change)
- frontend/src/components/AppFooter.tsx: fetches the backend version from `GET /api/version` on mount instead of importing `package.json`
- frontend/src/components/AppFooter.test.tsx: mocks the version client; present, pending, failed and sentinel paths
- frontend/src/components/LandingPage.test.tsx: mocks the version client; footer assertion moves from the `package.json` version to the backend version
- e2e/tests/TEST-04_page_footer.spec.ts: expected version read from `backend/pyproject.toml` instead of `frontend/package.json`
- e2e/uat/scenarios/TEST-04_page_footer.feature: version-source line updated
- e2e/uat/scripts/TEST-04_page_footer_uat_script.md: version-source prerequisite and step updated

`frontend/src/components/LandingPage.tsx` is NOT modified (the footer owns its fetch). No backend file is modified; the feature depends at runtime on TEST-05's existing `GET /api/version`.

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently): a double-submit fix in the note-form wiring plausibly adds a LandingPage test. TEST-08 does not touch `LandingPage.tsx` itself, so the map's flagged conflict on that file does not materialize; the remaining overlap is this test file only (TEST-08 edits the footer test and the `vi.mock` block at the top).
- frontend/src/api/notes.ts may also be modified by BUG-04 (independent, could run concurrently) if its fix lands in the notes client; TEST-08 changes only its two base-URL lines.
- frontend/src/components/AppFooter.tsx may also be modified by FEAT-9 (independent, could run concurrently): it adds a build note to the same footer.
- backend/app/routers/version.py, backend/app/schemas/version.py and backend/app/services/version_service.py are not modified by TEST-08, but TEST-09 (independent) and FEAT-8 (independent) change the `GET /api/version` this feature consumes. An additive field is harmless (the client reads only `version`); a rename or removal of `version`, or a change to the `unknown` sentinel, breaks the footer silently into its name-only fallback.
- frontend/src/components/LandingPage.test.tsx, frontend/src/api/notes.ts and frontend/src/components/LandingPage.tsx were edited by TEST-03 (independent, complete); no live conflict.
