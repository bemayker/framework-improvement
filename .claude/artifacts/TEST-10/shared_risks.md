# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: read `commit` from the same response; return `{version, commit} | null`
- frontend/src/api/version.test.ts: tests for the new return shape and commit mapping
- frontend/src/components/AppFooter.tsx: render the 7-character commit next to the version
- frontend/src/components/AppFooter.test.tsx: success, pending, failure and unusable-commit paths
- frontend/src/components/LandingPage.test.tsx: version-client mock moves to the object return shape

## Potential conflicts with other independent features
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx may also be modified by CHORE-02 (TEST-08 follow-up, fetch timeout; independent of TEST-10, could run concurrently)
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (double-submit fix; in flight, declared on NoteForm.tsx and NoteForm.test.tsx only, so low risk; the feature map flags the pair on LandingPage.tsx, which this plan does not modify)
- BUG-03 and CHORE-03 depend on TEST-10 and edit the same footer and client files, so they are serialized after it by the graph, not concurrent
