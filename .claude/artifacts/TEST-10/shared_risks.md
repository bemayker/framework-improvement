# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: getBackendVersion becomes getBackendBuildInfo, returning the version and a normalised commit
- frontend/src/api/version.test.ts: follows the rename, adds commit cases
- frontend/src/components/AppFooter.tsx: renders the 7-character commit after the version
- frontend/src/components/AppFooter.test.tsx: follows the rename, adds success, pending and failure commit cases
- frontend/src/components/LandingPage.test.tsx: its mock of ../api/version follows the rename

## Potential conflicts with other independent features
- None with BUG-04 (in plan verdict this run). BUG-04's manifest is frontend/src/components/NoteForm.tsx, frontend/src/components/NoteForm.test.tsx, e2e/tests/BUG-04_double_submit_note.spec.ts and its BUG-04 UAT files; TEST-10 touches none of them. feature_map.md's row flags frontend/src/components/LandingPage.tsx for the pair, but neither plan modifies LandingPage.tsx: TEST-10 changes only LandingPage.test.tsx (the footer mock), which BUG-04 does not list.
- frontend/src/api/version.ts may also be modified by CHORE-02 (TEST-08 follow-up, fetch timeout; independent, could run concurrently)
- frontend/src/api/version.test.ts may also be modified by CHORE-02 (tests for its client change; independent, could run concurrently)
- frontend/src/components/AppFooter.tsx may also be modified by CHORE-02 (independent, could run concurrently)
- frontend/src/components/AppFooter.test.tsx may also be modified by CHORE-02 (independent, could run concurrently)
- Behavioural coupling, not a file overlap: e2e/tests/TEST-08_footer_app_version.spec.ts asserts the footer text exactly as `Task Notes v{version}`. It stays green only while the E2E and CI stacks run without BUILD_COMMIT; any item that sets BUILD_COMMIT in docker-compose.yml or pr-tests.yml must update that spec in the same change.
