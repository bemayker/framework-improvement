# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: `fetchBackendVersion` returns `{ version, commit }` instead of a bare version string
- frontend/src/api/version.test.ts: client tests for the new shape and the commit field
- frontend/src/components/AppFooter.tsx: renders the 7-character commit next to the version
- frontend/src/components/AppFooter.test.tsx: success, pending, failure and sentinel paths
- frontend/src/components/LandingPage.test.tsx: the `fetchBackendVersion` mock in `beforeEach` resolves the new object shape (one value)

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (planned concurrently in this run; it may add a page-level double-submit test). TEST-10's edit is a single mock value in `beforeEach`. Per feature_map.md, hold TEST-10's build behind BUG-04's merge when both approved File Manifests list this file; otherwise the builds may run concurrently. TEST-10 does not touch NoteForm.tsx or LandingPage.tsx.
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx may also be modified by CHORE-02 (TEST-08 follow-up, wave 4, fetch timeout); serialize if run concurrently. BUG-03, CHORE-03 and FEAT-6 depend on TEST-10 and edit the same footer and client afterwards, so they are ordered, not concurrent.
- e2e/tests/TEST-08_footer_app_version.spec.ts (not modified) asserts the exact footer text `Task Notes v{version}`. It stays green only while the E2E stack leaves BUILD_COMMIT unset (CI does; docker-compose.yml passes `${BUILD_COMMIT:-}`). A local smoke run with BUILD_COMMIT exported would append ` (xxxxxxx)` and fail that spec; run Phase D's smoke with BUILD_COMMIT unset.
