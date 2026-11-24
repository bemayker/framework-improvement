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
- frontend/src/api/notes.ts: `API_BASE_URL` now imported from `./baseUrl` (no behaviour change)
- frontend/src/components/AppFooter.tsx: version fetched from `GET /api/version` at runtime instead of imported from `package.json`
- frontend/src/components/AppFooter.test.tsx: tests mock the version client; present, pending, failed and `unknown` paths
- frontend/src/components/LandingPage.test.tsx: mocks the version client; footer assertion uses the mocked backend version
- e2e/tests/TEST-04_page_footer.spec.ts: expected version read from `backend/pyproject.toml`
- e2e/uat/scenarios/TEST-04_page_footer.feature: version source corrected to the backend
- e2e/uat/scripts/TEST-04_page_footer_uat_script.md: version source corrected to the backend

## Runtime dependency (no file overlap)
- `GET /api/version` in backend/app/routers/version.py and backend/app/services/version_service.py (TEST-05) is read, not edited. Any item that changes that response shape or its `unknown` sentinel breaks this footer: TEST-09 (version endpoint reports the build commit) and FEAT-8 (GET /api/version returns a JSON version) both touch that endpoint. TEST-09 is expected to add a field, which the client tolerates; renaming or removing `version`, or changing the sentinel, needs `frontend/src/api/version.ts` updated in the same item.
- The CORS origin list in backend/app/core/config.py must keep allowing the frontend origin for `GET`; BUG-02 and FEAT-15/17/19/20/23 edit that parsing.
- A hung `/api/version` request leaves the footer in its loading rendering (`Task Notes` only) indefinitely: identical to the failure rendering by design, no retry or timeout planned.

## Potential conflicts with other independent features
- frontend/src/components/AppFooter.tsx may also be modified by FEAT-9 (independent, could run concurrently; the map row says it edits the frontend footer)
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently; the map flags LandingPage for both; this plan leaves LandingPage.tsx itself unchanged) and was last edited by TEST-03
- frontend/src/api/notes.ts may also be modified by BUG-04 (independent, could run concurrently, if its double-submit fix touches the notes client) and was created by TEST-03
- backend/app/routers/version.py and backend/app/services/version_service.py are not edited here but are edited by TEST-09 and FEAT-8 (independent); a response-shape change there is a runtime conflict, not a merge conflict
