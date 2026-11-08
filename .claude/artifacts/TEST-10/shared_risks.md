# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: read the `commit` field, cut it to 7 characters; `getBackendVersion` renamed to `getBackendBuildInfo`, returning `{ version, commit }`
- frontend/src/api/version.test.ts: re-pointed to the new function, commit cases added
- frontend/src/components/AppFooter.tsx: renders the commit span after the version
- frontend/src/components/AppFooter.test.tsx: success, pending, failure and commit-null paths
- frontend/src/components/LandingPage.test.tsx: mocks `getBackendBuildInfo` instead of `getBackendVersion`

## Potential conflicts with other independent features
- BUG-04 (planned concurrently in this run): no file overlap. BUG-04 edits frontend/src/components/NoteForm.tsx and NoteForm.test.tsx and creates its own BUG-04 E2E and UAT files; TEST-10 touches none of them. The feature_map row's flagged overlap on frontend/src/components/LandingPage.tsx does not materialize for either item: TEST-10 leaves LandingPage.tsx unmodified (the fetch lives in AppFooter.tsx), and BUG-04's plan leaves it unmodified too. TEST-10 does modify frontend/src/components/LandingPage.test.tsx, which BUG-04 does not list.
- Indirect, not a file collision: TEST-10 renames `getBackendVersion` to `getBackendBuildInfo`. Every importer is in this item's manifest (AppFooter.tsx, AppFooter.test.tsx, LandingPage.test.tsx, version.test.ts); a concurrent item that newly imported `getBackendVersion` would break at merge. BUG-04 does not.
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx may also be modified by CHORE-02 (TEST-08 follow-up: fetch timeout in the version client; independent of TEST-10, could run concurrently). Serialize the pair if CHORE-02 is scheduled in the same window; its timeout change would also need to target `getBackendBuildInfo`.
