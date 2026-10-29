# Shared Risk Analysis, TEST-10

## Files this feature will create
- e2e/tests/TEST-10_footer_build_commit.spec.ts
- e2e/uat/scenarios/TEST-10_footer_build_commit.feature
- e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md
- .claude/artifacts/TEST-10/uat_script.md

## Existing files this feature will modify
- frontend/src/api/version.ts: `fetchBackendVersion` resolves to `{ version, commit }` instead of a bare string
- frontend/src/api/version.test.ts: new return shape and commit-validation cases
- frontend/src/components/AppFooter.tsx: renders the 7-character commit after the version
- frontend/src/components/AppFooter.test.tsx: success, success-without-commit, pending and failure paths
- frontend/src/components/LandingPage.test.tsx: the version mock resolves to the new object shape
- e2e/tests/TEST-08_footer_app_version.spec.ts: the live-backend assertion tolerates the new commit span

## Potential conflicts with other independent features
- frontend/src/components/LandingPage.test.tsx may also be modified by BUG-04 (double-submit fix, building concurrently; it may add a LandingPage submit-wiring test). TEST-10 changes only the `fetchBackendVersion` mock line; serialize or rebase if both touch the file. BUG-04's known changes (NoteForm.tsx, NoteForm.test.tsx, its own e2e spec and UAT files) do not overlap this plan.
- frontend/src/components/LandingPage.tsx is flagged in feature_map.md as shared with BUG-04, but this plan does not modify it.
- frontend/src/api/version.ts and frontend/src/components/AppFooter.tsx may also be modified by CHORE-02 (TEST-08 follow-up, independent of TEST-10); serialize if run concurrently.
- frontend/src/components/AppFooter.tsx and frontend/src/api/version.ts are the files BUG-03, CHORE-03 and FEAT-6 edit; all three depend on TEST-10, so they are ordered after it, not concurrent.
