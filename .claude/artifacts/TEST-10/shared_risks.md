# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: fetchBackendVersion replaced by fetchBackendBuild, which also returns the 7-character commit
- frontend/src/api/version.test.ts: retargeted to fetchBackendBuild, commit cases added
- frontend/src/components/AppFooter.tsx: renders the commit after the version
- frontend/src/components/AppFooter.test.tsx: success, pending and failure paths against fetchBackendBuild
- frontend/src/components/LandingPage.test.tsx: the version module mock renamed to fetchBackendBuild

## Potential conflicts with other independent features
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx may also be modified by CHORE-02 (TEST-08 follow-up, independent of TEST-10, could run concurrently: fetch timeout in the same client)
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (independent, could run concurrently; feature_map flags LandingPage.tsx for both, but BUG-04's plan in flight lists NoteForm.tsx and NoteForm.test.tsx only, and TEST-10 does not modify LandingPage.tsx itself)
- BUG-03, CHORE-03, CHORE-1 and FEAT-6 also edit AppFooter.tsx and the version client, but all depend on TEST-10, so they cannot run concurrently with it.
