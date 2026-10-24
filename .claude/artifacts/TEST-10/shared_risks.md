# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: `getBackendVersion()` returns `{ version, commit } | null` instead of a string, reading the `commit` field
- frontend/src/api/version.test.ts: new return shape and commit cases
- frontend/src/components/AppFooter.tsx: renders the first 7 characters of the commit after the version
- frontend/src/components/AppFooter.test.tsx: success, pending and failure paths with the new shape
- frontend/src/components/LandingPage.test.tsx: version-client mock moved to the new return shape

## Potential conflicts with other independent features
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx may also be modified by CHORE-02 (TEST-08 follow-up, independent of TEST-10, could run concurrently): the return-shape change of `getBackendVersion()` collides with any client edit there; serialize.
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, in flight): BUG-04 is recorded as touching only NoteForm.tsx and NoteForm.test.tsx, so no overlap is expected; if its fix moves into LandingPage, the mock line here conflicts textually only.
- BUG-03, CHORE-03 and FEAT-6 also edit AppFooter.tsx and the version client, but each depends on TEST-10, so they run after it and are not concurrent.
