# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: read the `commit` field, cut to 7 characters, return `{ version, commit }`
- frontend/src/api/version.test.ts: new return shape, commit cases
- frontend/src/components/AppFooter.tsx: render the short commit after the version
- frontend/src/components/AppFooter.test.tsx: new mock shape, commit success and absent cases
- frontend/src/components/LandingPage.test.tsx: `fetchBackendVersion` mock moved to the new `{ version, commit }` shape, nothing else
- e2e/tests/TEST-08_footer_app_version.spec.ts: happy path asserts the `app-footer-version` element exactly instead of the whole footer text, so it stays green with BUILD_COMMIT set

## Potential conflicts with other independent features
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx may also be modified by CHORE-02 (independent, TEST-08 follow-up, could run concurrently; its map row names a fetch timeout in version.ts)
- frontend/src/components/AppFooter.tsx may also be modified by FEAT-9 (independent, footer build note, could run concurrently)
- frontend/src/components/LandingPage.tsx is NOT touched by this feature, and BUG-04 (independent, building concurrently) touches only NoteForm.tsx, NoteForm.test.tsx, its own E2E spec and UAT files, so there is no file overlap with BUG-04; this feature's LandingPage.test.tsx edit is the version mock alone
