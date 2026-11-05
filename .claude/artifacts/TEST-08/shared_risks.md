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
- frontend/src/api/notes.ts: imports `API_BASE_URL` from the new `baseUrl.ts` instead of defining it (no behaviour change)
- frontend/src/components/AppFooter.tsx: fetches the version from `GET /api/version` at runtime instead of importing `package.json`
- frontend/src/components/AppFooter.test.tsx: mocks the version client; present, pending, rejected and `unknown` paths
- frontend/src/components/LandingPage.test.tsx: mocks the version client; footer assertion expects the backend version
- e2e/tests/TEST-04_page_footer.spec.ts: version expectation read from the `/api/version` response instead of `frontend/package.json`
- e2e/uat/scenarios/TEST-04_page_footer.feature: version source step names the backend
- e2e/uat/scripts/TEST-04_page_footer_uat_script.md: version comparison against the backend endpoint

Not modified, despite the map's earlier expectation: frontend/src/components/LandingPage.tsx (it already renders `<AppFooter />`), and every backend file (the `GET /api/version` endpoint exists since TEST-05).

## Potential conflicts with other independent features
- No file overlap with TEST-09 (planned concurrently; backend version slice: backend/app/routers/version.py, backend/app/schemas/version.py, backend/app/services/version_service.py, backend/app/core/config.py, backend/app/main.py). Runtime coupling only: TEST-09 adds a field to the `/api/version` response that TEST-08 consumes. TEST-08's client reads `version` and ignores extra fields, so either merge order is safe as long as TEST-09 keeps the `version` field and its `unknown` sentinel.
- No file overlap with BUG-01 (planned concurrently; backend server_time router and backend/app/main.py).
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (note-form double-submit fix; independent of TEST-08). BUG-04's fix has merged on main (968a066), so this is a conflict only if BUG-04 is reopened or revised concurrently.
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx are also modified by TEST-10 (footer build commit) and CHORE-02 (TEST-08 follow-up, fetch timeout); both depend on TEST-08, so neither can run concurrently with it. They may conflict with each other after TEST-08 merges (already flagged in feature_map.md).
- frontend/src/api/notes.ts may also be modified by any concurrent item touching the notes client (TEST-12 if its fix reaches the frontend client); TEST-08's edit there is a two-line import swap.
