# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: returns version plus a 7-character commit (or null) instead of a bare version string
- frontend/src/api/version.test.ts: new return shape and commit cases
- frontend/src/components/AppFooter.tsx: renders the commit span after the version
- frontend/src/components/AppFooter.test.tsx: new mock shape and commit-path tests

## Potential conflicts with other independent features
- frontend/src/api/version.ts may also be modified by CHORE-02 (TEST-08 follow-up: fetch timeout; independent of TEST-10, could run concurrently). The feature map row already flags this pair; serialize them.
- frontend/src/components/AppFooter.tsx and AppFooter.test.tsx may also be modified by CHORE-02 (independent, could run concurrently). Serialize with the pair above.
- BUG-04 (building now in .claude/worktrees/BUG-04): its plan touches frontend/src/components/NoteForm.tsx, NoteForm.test.tsx and its own BUG-04 E2E and UAT files only. No overlap with this feature's files. The map row's flag on frontend/src/components/LandingPage.tsx does not materialize: TEST-10 does not modify LandingPage.tsx (it already renders AppFooter), so TEST-10 may build concurrently with BUG-04.
- BUG-01 (backend only, awaiting merge): no overlap; TEST-10 touches no backend file.
