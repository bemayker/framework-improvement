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
- frontend/src/api/notes.ts: imports `API_BASE_URL` from the new `./config` instead of declaring it (no behaviour change)
- frontend/src/components/AppFooter.tsx: fetches the backend version from `GET /api/version` instead of importing `package.json`
- frontend/src/components/AppFooter.test.tsx: mocks the version client; asserts the present, absent and loading paths
- frontend/src/components/LandingPage.test.tsx: adds a `../api/version` mock and replaces the `package.json` footer assertion
- e2e/tests/TEST-04_page_footer.spec.ts: drops the now-false `frontend/package.json` version assertions

Frontend files in the manifest: `frontend/src/api/config.ts`, `frontend/src/api/version.ts`, `frontend/src/api/version.test.ts`, `frontend/src/api/notes.ts`, `frontend/src/components/AppFooter.tsx`, `frontend/src/components/AppFooter.test.tsx`, `frontend/src/components/LandingPage.test.tsx`. **`frontend/src/components/LandingPage.tsx` is NOT modified**, because the fetch lives in `AppFooter.tsx`. No backend file is created or modified: `GET /api/version` already exists from TEST-05.

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (note-form double submit; independent of TEST-08, queued, could run concurrently). TEST-08 edits only the footer mock and assertion there, and BUG-04 would edit note-submit cases. The edits are textually separate, but they are the same file, so serialize or expect a trivial merge.
- frontend/src/api/notes.ts may also be modified by BUG-04 if its fix lands in the client (for example, request de-duplication in `createNote`). TEST-08 changes only the base-URL import at the top of the file. Serialize if BUG-04's manifest lists `notes.ts`.
- frontend/src/components/LandingPage.tsx: no conflict with BUG-04 from this item, because TEST-08 does not edit it (the feature_map row's LandingPage.tsx flag can be relaxed to the test file).
- Not concurrent, for information only: TEST-10 (footer build commit) depends on TEST-08 and will extend `frontend/src/api/version.ts` and `AppFooter.tsx` after this merges. CHORE-02 (TEST-08 follow-up) depends on TEST-08 too.
