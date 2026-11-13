# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: fetchVersion returns a VersionInfo object (version plus nullable commit) instead of a string
- frontend/src/api/version.test.ts: tests follow the new return shape and the commit normalization
- frontend/src/components/AppFooter.tsx: renders the first 7 characters of the commit next to the version
- frontend/src/components/AppFooter.test.tsx: success, pending and failure paths for the commit
- frontend/src/components/LandingPage.test.tsx: fetchVersion mock resolves the new object shape

## Potential conflicts with other independent features
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx may also be modified by CHORE-02 (independent, could run concurrently; not scheduled in this run per the map row note). The return type of fetchVersion changes here, so any concurrent edit to its callers must serialize.
- frontend/src/components/LandingPage.test.tsx (not LandingPage.tsx, which this plan leaves untouched) is the only landing-page file this feature edits. BUG-04 is planned to touch only frontend/src/components/NoteForm.tsx, NoteForm.test.tsx and an E2E spec, so no file overlap with BUG-04 is expected; the map row's LandingPage.tsx warning does not materialize under this plan.
- e2e/tests/TEST-08_footer_app_version.spec.ts is not edited, but its exact-text assertion depends on the E2E stack's commit staying "unknown"; any feature that sets BUILD_COMMIT for the E2E stack or CI would need to update it.
