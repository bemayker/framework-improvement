# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: `fetchBackendVersion()` reads and shortens `commit`, resolves `{ version, shortCommit } | null` instead of a string
- frontend/src/api/version.test.ts: cases for the new return shape and commit handling
- frontend/src/components/AppFooter.tsx: renders ` (shortCommit)` after the version
- frontend/src/components/AppFooter.test.tsx: success, pending, failure and commit-absent cases with the new shape
- frontend/src/components/LandingPage.test.tsx: the `../api/version` mock resolves the new object shape

## Potential conflicts with other independent features
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx may also be modified by CHORE-02 (flagged on the feature_map row; serialize if run concurrently).
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (the feature_map row flags LandingPage.tsx for the pair; BUG-04's dispatch lists NoteForm.tsx, NoteForm.test.tsx and its own E2E and UAT files, so the overlap is plausible rather than certain). TEST-10 touches only the one mock line there.
- Any change to the `fetchBackendVersion` return shape breaks every other caller or mock of it; today the only ones are AppFooter.tsx, AppFooter.test.tsx and LandingPage.test.tsx, all listed above.
- e2e/tests/TEST-08_footer_app_version.spec.ts is not modified but asserts the exact footer text `Task Notes v{version}`; it stays green only while the stack runs without `BUILD_COMMIT` (true in CI and in `docker compose up` by default). A run that sets `BUILD_COMMIT` would make it fail.
