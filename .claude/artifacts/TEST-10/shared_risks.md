# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: `getBackendVersion` renamed to `getBackendBuildInfo`, returning `{ version, commit }` with the commit cut to 7 characters
- frontend/src/api/version.test.ts: retargeted to the new function, commit cases added
- frontend/src/components/AppFooter.tsx: renders ` ({commit})` after the version when present
- frontend/src/components/AppFooter.test.tsx: mock follows the new client; success, pending and failure paths
- frontend/src/components/LandingPage.test.tsx: the `../api/version` mock switches to `getBackendBuildInfo` (one mock and one footer assertion; no other test changes)

## Potential conflicts with other independent features
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx may also be modified by CHORE-02 (TEST-08 follow-up, fetch timeout; depends only on TEST-08, so independent of TEST-10 and could run concurrently). This plan also renames the exported `getBackendVersion`, so a CHORE-02 branch cut before TEST-10 merges would need to follow the rename: serialize the two.
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (double submit; independent, building now in .claude/worktrees/BUG-04). BUG-04's dispatch names only NoteForm.tsx, NoteForm.test.tsx and its own spec and UAT files, so there is no current overlap; the feature map's LandingPage.tsx flag does not apply because TEST-10 does not edit LandingPage.tsx. Serialize only if BUG-04's build ends up touching LandingPage.test.tsx's submit tests.
- e2e/tests/TEST-08_footer_app_version.spec.ts is not modified, but its live-backend case asserts the exact text `Task Notes v{version}`: any later item that sets `BUILD_COMMIT` in CI or `playwright.config.ts` would make that footer carry a commit and fail the spec.
