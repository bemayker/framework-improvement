# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: `getBackendVersion` replaced by `getBackendBuild` returning version and short commit
- frontend/src/api/version.test.ts: retargeted, commit cases added
- frontend/src/components/AppFooter.tsx: renders the `app-commit` span after the version
- frontend/src/components/AppFooter.test.tsx: success with commit, commit-null, pending, failure cases
- frontend/src/components/LandingPage.test.tsx: mocks `getBackendBuild` instead of `getBackendVersion`

## Potential conflicts with other independent features
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx (and their tests) may also be modified by CHORE-02 (TEST-08 follow-up, fetch timeout on the version client; independent of TEST-10, could run concurrently). Serialize: whichever lands second must rebase onto the renamed `getBackendBuild`.
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (double-submit guard, in flight) if its fix adds or changes LandingPage-level submit tests; BUG-04's dispatch names only frontend/src/components/NoteForm.tsx and NoteForm.test.tsx plus its own e2e/uat files, so no file is known to be shared today. TEST-10 does not modify frontend/src/components/LandingPage.tsx, so the feature map's LandingPage.tsx overlap with BUG-04 does not materialize. Behavioural note: LandingPage.test.tsx renders the real NoteForm, so a BUG-04 change to NoteForm's submit behaviour can affect that test file's submit case at merge time even without a textual conflict.
- e2e/tests/TEST-08_footer_app_version.spec.ts (not modified here) asserts the exact footer text `Task Notes v{version}` against the real backend; it stays green only while the E2E stack runs with BUILD_COMMIT unset. Any item that sets BUILD_COMMIT in CI's E2E job or docker-compose.yml must update that spec.
