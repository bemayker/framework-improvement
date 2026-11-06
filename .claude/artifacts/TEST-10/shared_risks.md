# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: `getBackendVersion()` resolves `{ version, commit }`; commit truncated to 7 characters, `null` when unknown, missing or malformed
- frontend/src/api/version.test.ts: success assertions move to the object shape; commit parsing cases added
- frontend/src/components/AppFooter.tsx: renders the short commit span (`app-footer-commit`) next to the version
- frontend/src/components/AppFooter.test.tsx: success with and without commit, pending and failure paths
- frontend/src/components/LandingPage.test.tsx: one line, the version mock's resolved value becomes `{ version: "9.9.9", commit: null }`
- e2e/tests/TEST-08_footer_app_version.spec.ts: exact footer text derived from the observed response including the short commit when known
- docs/DEVELOPMENT.md: footer paragraph describes the commit suffix

`frontend/src/components/LandingPage.tsx` and `NoteForm` are NOT modified. No backend file is modified.

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently: a double-submit fix is likely to add note-form tests in this file). TEST-10's change is the single mock value on line 33 (`getBackendVersionMock.mockResolvedValue(...)`), a textual conflict only if BUG-04 edits that `beforeEach`. LandingPage.tsx itself is not touched by TEST-10, so the feature_map's LandingPage.tsx flag does not apply.
- frontend/src/api/version.ts, frontend/src/api/version.test.ts, frontend/src/components/AppFooter.tsx and AppFooter.test.tsx may also be modified by CHORE-02 (independent of TEST-10, could run concurrently: its fetch timeout lands in version.ts and its tests). Serialize: whichever merges second rebases onto the other's version.ts.
- docs/DEVELOPMENT.md is a shared document many items edit; TEST-10 changes only the footer paragraph after the `BUILD_COMMIT` paragraph.
