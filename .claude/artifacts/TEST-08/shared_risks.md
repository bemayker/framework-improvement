# Shared Risk Analysis, TEST-08

## Files this feature will create
- frontend/src/api/config.ts
- frontend/src/api/version.ts
- frontend/src/api/version.test.ts
- e2e/helpers/backendVersion.ts
- e2e/tests/TEST-08_footer_app_version.spec.ts
- e2e/uat/scenarios/TEST-08_footer_app_version.feature
- e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md
- .claude/artifacts/TEST-08/uat_script.md

## Existing files this feature will modify
- frontend/src/api/notes.ts: `API_BASE_URL` is imported from the new `./config` instead of declared locally (no behaviour change)
- frontend/src/components/AppFooter.tsx: fetches the backend version from `GET /api/version` on mount instead of importing `frontend/package.json`
- frontend/src/components/AppFooter.test.tsx: present, loading, failed and null-version paths
- frontend/src/components/LandingPage.test.tsx: mocks `../api/version`; the footer assertion uses the mocked backend version
- e2e/tests/TEST-04_page_footer.spec.ts: expects the backend's version instead of `frontend/package.json`'s
- e2e/uat/scenarios/TEST-04_page_footer.feature: the version-source step names the backend
- e2e/uat/scripts/TEST-04_page_footer_uat_script.md: the version comparison names the backend

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (double-submit of a note; its tests for the note-form submit wiring plausibly live here). `frontend/src/components/LandingPage.tsx` itself is NOT modified by this plan: the version fetch lives inside `AppFooter`. The feature_map conflict note's predicted overlap on `LandingPage.tsx` therefore moves to its test file. BUG-04 is already held behind this item, so keep that serialization.
- frontend/src/api/notes.ts may also be modified by BUG-04 if its fix touches the `createNote` client (for example, a request guard). This plan's edit there is a one-line import change, so the conflict would be small but textual. Covered by the same serialization.
- `GET /api/version` response shape (backend/app/schemas/version.py, backend/app/services/version_service.py, backend/app/routers/version.py) is being changed by TEST-09 (independent, planned in parallel; it adds a `commit` field). This plan modifies none of those files, so there is no file conflict. The contract dependency is additive and safe in either merge order, because this client reads only `version` and ignores other fields. It would break only if TEST-09 renamed or removed `version`.
- frontend/src/components/AppFooter.tsx and AppFooter.test.tsx will be modified next by TEST-10 (depends on TEST-08, not concurrent; it shows the commit in the footer). No concurrency risk, but TEST-10 builds on the `fetchBackendVersion` client introduced here.
